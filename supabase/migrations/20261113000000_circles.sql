-- Usernames and circles. Anyone can sign up now, so seeing someone needs a
-- connection you both agreed to: you ask by username, they accept. Until
-- then you see nobody and nobody sees you. Your level, pulses, seen marks
-- and WhatsApp number only reach your circle.
--
-- Nobody is connected when this runs. Everyone re-adds their people.

-- ------------------------------------------------------------- usernames

-- Lowercase only, so "Keanen" and "keanen" can't both exist. The app
-- lowercases before saving. Null until someone picks one.
alter table public.profiles add column username text unique
  check (username ~ '^[a-z0-9_]{3,20}$');

-- ---------------------------------------------------------------- tables

-- Both tables key on a uuid on purpose. Realtime sends DELETE events to
-- every subscriber, with only the primary key, and a (from_id, to_id) key
-- would tell everyone who removed whom.

-- Asking to be in each other's circles. Accepting deletes the row.
create table public.circle_requests (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles on delete cascade,
  to_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  unique (from_id, to_id),
  check (from_id <> to_id)
);
create index on public.circle_requests (to_id);

-- Who you've declined or removed. Their requests stop reaching you, but
-- they still look pending to them, so they're never told. Kept apart from
-- circle_requests and out of the API entirely: an update there would show
-- up on the asker's realtime feed.
create table public.circle_declines (
  owner_id uuid not null references public.profiles on delete cascade,
  from_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, from_id)
);

-- Who's in your circle. Two rows per pair, one each way, so a policy only
-- ever looks up rows belonging to the person asking.
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles on delete cascade,
  friend_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, friend_id),
  check (user_id <> friend_id)
);
create index on public.connections (friend_id);

-- ------------------------------------------------------------------- RLS

-- Read-only from the API. The functions below do every write.
alter table public.circle_requests enable row level security;
alter table public.circle_declines enable row level security;
alter table public.connections enable row level security;

create policy "either side reads" on public.circle_requests for select to authenticated
  using ((select auth.uid()) in (from_id, to_id));
create policy "read own" on public.connections for select to authenticated
  using (user_id = (select auth.uid()));
-- circle_declines has no policies: nobody reads it through the API.

-- Replaces "everyone reads" from the init migration.
drop policy "everyone reads" on public.profiles;
create policy "self and circle" on public.profiles for select to authenticated using (
  id = (select auth.uid())
  or exists (select 1 from public.connections c where c.user_id = (select auth.uid()) and c.friend_id = profiles.id)
);

drop policy "everyone reads" on public.pulses;
create policy "sender and recipients" on public.pulses for select to authenticated
  using (sender_id = (select auth.uid()) or (select auth.uid()) = any (recipient_ids));

drop policy "everyone reads" on public.pulse_seen;
create policy "viewer and sender" on public.pulse_seen for select to authenticated using (
  viewer_id = (select auth.uid())
  or exists (select 1 from public.pulses p where p.id = pulse_seen.pulse_id and p.sender_id = (select auth.uid()))
);
drop policy "mark as self" on public.pulse_seen;
create policy "mark as recipient" on public.pulse_seen for insert to authenticated with check (
  viewer_id = (select auth.uid())
  and exists (select 1 from public.pulses p where p.id = pulse_seen.pulse_id and (select auth.uid()) = any (p.recipient_ids))
);

-- Nudges push to the other person's phone, so only your circle can send one.
drop policy "send as self" on public.nudges;
create policy "send to your circle" on public.nudges for insert to authenticated with check (
  from_id = (select auth.uid())
  and exists (select 1 from public.connections c where c.user_id = (select auth.uid()) and c.friend_id = nudges.to_id)
);

-- -------------------------------------------------------------- triggers

-- Who a pulse reaches: your circle, in the groups you chose. Anyone you
-- haven't sorted still counts as friends.
create or replace function private.fill_recipients() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.recipient_ids := array(
    select c.friend_id from public.connections c
    left join public.groupings g on g.owner_id = new.sender_id and g.member_id = c.friend_id
    where c.user_id = new.sender_id and coalesce(g.grp, 'friends') = any(new.groups)
  );
  return new;
end $$;

-- A new request pushes to the person asked, unless they've declined you.
create trigger circle_requests_notify after insert on public.circle_requests
  for each row execute function private.notify_insert();

-- --------------------------------------------------------------- functions

-- Security definer, so they can see past RLS. Each one only acts for the
-- caller.

-- Puts two people in each other's circles, and tells the one who asked.
create function private.connect(accepter uuid, asker uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.circle_requests
   where (from_id = accepter and to_id = asker) or (from_id = asker and to_id = accepter);
  delete from public.circle_declines
   where (owner_id = accepter and from_id = asker) or (owner_id = asker and from_id = accepter);
  insert into public.connections (user_id, friend_id)
  values (accepter, asker), (asker, accepter)
  on conflict do nothing;
  perform private.call_edge('notify', jsonb_build_object('table', 'accepted', 'from', accepter, 'to', asker));
end $$;

-- An exact username only, so nobody can list everyone on Pulse. Gives a
-- name and nothing else. state: 'connected', 'asked' (you asked them),
-- 'asked_you', or null.
create function public.find_person(p_username text)
returns table (id uuid, username text, display_name text, state text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username, p.display_name,
    case
      when exists (select 1 from public.connections c where c.user_id = auth.uid() and c.friend_id = p.id) then 'connected'
      when exists (select 1 from public.circle_requests r where r.from_id = auth.uid() and r.to_id = p.id) then 'asked'
      when exists (select 1 from public.circle_requests r where r.from_id = p.id and r.to_id = auth.uid())
        and not exists (select 1 from public.circle_declines d where d.owner_id = auth.uid() and d.from_id = p.id) then 'asked_you'
    end
    from public.profiles p
   where p.username = lower(ltrim(trim(p_username), '@'))
     and p.id <> auth.uid();
$$;

-- Requests waiting, both ways, with names: profiles' RLS hides anyone
-- outside your circle. Leaves out people you've declined.
create function public.my_requests()
returns table (id uuid, username text, display_name text, incoming boolean, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username, p.display_name, r.to_id = auth.uid(), r.created_at
    from public.circle_requests r
    join public.profiles p on p.id = case when r.to_id = auth.uid() then r.from_id else r.to_id end
   where auth.uid() in (r.from_id, r.to_id)
     and not exists (select 1 from public.circle_declines d where d.owner_id = auth.uid() and d.from_id = r.from_id)
   order by r.created_at desc;
$$;

-- Asks someone, or accepts if they already asked you (even if you
-- declined them then). Returns 'asked' or 'connected'. Twenty asks a day
-- at most, since each one can buzz a phone.
create function public.ask_to_connect(p_to uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
begin
  if me is null or p_to is null or p_to = me then
    raise exception 'can''t ask that person';
  end if;
  -- Two people asking each other at once both end up connected.
  perform pg_advisory_xact_lock(hashtext(least(me, p_to)::text || greatest(me, p_to)::text));
  if exists (select 1 from public.connections where user_id = me and friend_id = p_to) then
    return 'connected';
  end if;
  if exists (select 1 from public.circle_requests where from_id = p_to and to_id = me) then
    perform private.connect(me, p_to);
    return 'connected';
  end if;
  if (select count(*) from public.circle_requests where from_id = me and created_at > now() - interval '1 day') >= 20 then
    raise exception 'too many requests';
  end if;
  insert into public.circle_requests (from_id, to_id) values (me, p_to) on conflict do nothing;
  return 'asked';
end $$;

-- They still see it as pending. You can still add them yourself later.
create function public.decline_request(p_from uuid) returns void
language sql security definer set search_path = '' as $$
  insert into public.circle_declines (owner_id, from_id)
  select auth.uid(), r.from_id from public.circle_requests r
   where r.from_id = p_from and r.to_id = auth.uid()
  on conflict do nothing;
$$;

create function public.cancel_request(p_to uuid) returns void
language sql security definer set search_path = '' as $$
  delete from public.circle_requests where from_id = auth.uid() and to_id = p_to;
$$;

-- Takes you out of each other's circles. From then on their requests don't
-- reach you, as if you'd declined, but you can still add them again. Your
-- groupings row stays: it's your own label, and comes back if you do.
create function public.remove_from_circle(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  removed integer;
begin
  delete from public.connections
   where (user_id = me and friend_id = p_id) or (user_id = p_id and friend_id = me);
  get diagnostics removed = row_count;
  if removed > 0 then
    insert into public.circle_declines (owner_id, from_id) values (me, p_id) on conflict do nothing;
  end if;
end $$;

revoke execute on function
  public.find_person(text), public.my_requests(), public.ask_to_connect(uuid),
  public.decline_request(uuid), public.cancel_request(uuid), public.remove_from_circle(uuid)
  from public, anon;
grant execute on function
  public.find_person(text), public.my_requests(), public.ask_to_connect(uuid),
  public.decline_request(uuid), public.cancel_request(uuid), public.remove_from_circle(uuid)
  to authenticated;

-- --------------------------------------------------------------- realtime

-- So a request or an accept shows up without a refresh. RLS limits inserts
-- to the people involved. Deletes reach everyone, but only as a uuid.
alter publication supabase_realtime add table public.circle_requests, public.connections;
