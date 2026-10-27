-- Pulse schema.
--
-- Closed test: everyone signed in can read everyone's level. Each person
-- writes only their own rows. Pushes go out from two Edge Functions:
-- `notify` (fired by triggers on pulses and nudges) and `morning` (fired by
-- pg_cron every 5 minutes). Both are called with a shared secret kept in
-- Vault. See README for the one-time Vault setup.

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Internal helpers live outside `public` so the API can't call them.
create schema if not exists private;

-- ---------------------------------------------------------------- tables

-- What everyone sees.
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '',
  level smallint not null default 50 check (level between 0 and 100),
  reason text,
  wants_chat boolean not null default false,
  around text check (around in ('an hour', 'till 10', 'all evening')),
  around_until timestamptz,
  level_updated_at timestamptz not null default now(),
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- Only you see these.
create table public.settings (
  user_id uuid primary key references public.profiles on delete cascade,
  morning_time text not null default '07:40' check (morning_time = 'off' or morning_time ~ '^\d\d:\d\d$'),
  timezone text not null default 'UTC',
  theme text not null default 'dusk',
  mbti text,
  songs jsonb not null default '{}',
  spotify boolean not null default false,
  last_morning_sent date
);

-- Which of your groups someone is in. No row means friends.
create table public.groupings (
  owner_id uuid not null default auth.uid() references public.profiles on delete cascade,
  member_id uuid not null references public.profiles on delete cascade,
  grp text not null check (grp in ('household', 'family', 'friends')),
  primary key (owner_id, member_id)
);

create table public.pulses (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null default auth.uid() references public.profiles on delete cascade,
  level smallint not null check (level between 0 and 100),
  reason text,
  groups text[] not null,
  recipient_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
create index on public.pulses (sender_id, created_at desc);
create index on public.pulses using gin (recipient_ids);

create table public.pulse_seen (
  pulse_id uuid not null references public.pulses on delete cascade,
  viewer_id uuid not null default auth.uid() references public.profiles on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (pulse_id, viewer_id)
);

-- Every level change, for the Week screen. Written by trigger only.
create table public.level_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles on delete cascade,
  level smallint not null,
  created_at timestamptz not null default now()
);
create index on public.level_log (user_id, created_at);

-- One row per device. `platform` leaves room for native (Expo) tokens later.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  platform text not null default 'web',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

-- "Ask" on a match, "I'm in" / "Maybe" on someone who's around.
create table public.nudges (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null default auth.uid() references public.profiles on delete cascade,
  to_id uuid not null references public.profiles on delete cascade,
  kind text not null check (kind in ('ask', 'in', 'maybe')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------- RLS

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.groupings enable row level security;
alter table public.pulses enable row level security;
alter table public.pulse_seen enable row level security;
alter table public.level_log enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.nudges enable row level security;

create policy "everyone reads" on public.profiles for select to authenticated using (true);
create policy "insert own" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "update own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "own" on public.settings for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own" on public.groupings for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "everyone reads" on public.pulses for select to authenticated using (true);
create policy "send as self" on public.pulses for insert to authenticated with check (sender_id = (select auth.uid()));

create policy "everyone reads" on public.pulse_seen for select to authenticated using (true);
create policy "mark as self" on public.pulse_seen for insert to authenticated with check (viewer_id = (select auth.uid()));

create policy "read own" on public.level_log for select to authenticated using (user_id = (select auth.uid()));

create policy "own" on public.push_subscriptions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "read own" on public.nudges for select to authenticated
  using ((select auth.uid()) in (from_id, to_id));
create policy "send as self" on public.nudges for insert to authenticated with check (from_id = (select auth.uid()));

-- -------------------------------------------------------------- triggers

-- New user (added in the dashboard) -> profile + settings.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, initcap(split_part(split_part(new.email, '@', 1), '.', 1)))
  on conflict (id) do nothing;
  insert into public.settings (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- Anyone added before this migration ran.
insert into public.profiles (id, display_name)
  select id, initcap(split_part(split_part(email, '@', 1), '.', 1)) from auth.users
  on conflict (id) do nothing;
insert into public.settings (user_id) select id from public.profiles on conflict do nothing;

-- Stamp and log level changes. Finishing onboarding logs the starting
-- level even if it wasn't moved from the default.
create function private.on_level_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.level is distinct from old.level or (new.onboarded and not old.onboarded) then
    new.level_updated_at := now();
    insert into public.level_log (user_id, level) values (new.id, new.level);
  end if;
  return new;
end $$;

create trigger level_change before update on public.profiles
  for each row execute function private.on_level_change();

-- Who a pulse reaches: everyone in the sender's chosen groups, where anyone
-- they haven't sorted counts as friends. Set here so the client can't.
create function private.fill_recipients() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.recipient_ids := array(
    select p.id from public.profiles p
    left join public.groupings g on g.owner_id = new.sender_id and g.member_id = p.id
    where p.id <> new.sender_id and coalesce(g.grp, 'friends') = any(new.groups)
  );
  return new;
end $$;

create trigger pulses_recipients before insert on public.pulses
  for each row execute function private.fill_recipients();

-- POST to an Edge Function. Does nothing until the Vault secrets exist, so
-- the app works before push is set up.
create function private.call_edge(fn text, body jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  base text := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url');
  secret text := (select decrypted_secret from vault.decrypted_secrets where name = 'push_secret');
begin
  if base is null or secret is null then return; end if;
  perform net.http_post(
    url := base || '/functions/v1/' || fn,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-pulse-secret', secret),
    body := body
  );
end $$;

create function private.notify_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.call_edge('notify', jsonb_build_object('table', tg_table_name, 'id', new.id));
  return null;
end $$;

create trigger pulses_notify after insert on public.pulses
  for each row execute function private.notify_insert();
create trigger nudges_notify after insert on public.nudges
  for each row execute function private.notify_insert();

-- ------------------------------------------------------- morning check-in

-- People whose local check-in time passed in the last 15 minutes and who
-- haven't been asked today. Stamps them in the same statement, so a slow
-- or repeated cron run can't ask anyone twice. Called by `morning` with
-- the service role. Local time comes from the joined zone name, so one bad
-- timezone value skips that person instead of failing everyone.
create function public.claim_due_mornings() returns setof uuid
language sql security definer set search_path = '' as $$
  with due as materialized (
    select s.user_id, (now() at time zone tz.name) as local
      from public.settings s
      join pg_catalog.pg_timezone_names tz on tz.name = s.timezone
     where s.morning_time <> 'off'
       and (now() at time zone tz.name)::time >= s.morning_time::time
       and (now() at time zone tz.name)::time < s.morning_time::time + interval '15 minutes'
       and s.last_morning_sent is distinct from (now() at time zone tz.name)::date
  )
  update public.settings s
     set last_morning_sent = due.local::date
    from due
   where s.user_id = due.user_id
  returning s.user_id;
$$;

revoke execute on function public.claim_due_mornings() from public, anon, authenticated;
grant execute on function public.claim_due_mornings() to service_role;

select cron.schedule('pulse-morning', '*/5 * * * *', $$ select private.call_edge('morning', '{}'::jsonb) $$);

-- --------------------------------------------------------------- realtime

alter publication supabase_realtime add table public.profiles, public.pulses, public.pulse_seen;
