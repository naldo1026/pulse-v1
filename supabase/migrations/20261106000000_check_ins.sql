-- The data analytics-first builds on: check-ins and private change reasons.
-- All of it belongs to the user, so none of these tables go in the realtime
-- publication. Friends never see them.

-- ---------------------------------------------------------------- tables

-- Edited in the Supabase dashboard, so questions can change without a deploy.
-- `id` is permanent: never reuse one for a different question. Set `active`
-- to false to retire a question. `options` is a list of { id, label, value },
-- where `value` is a number so answers can be charted.
create table public.check_in_questions (
  id text primary key,
  kind text not null check (kind in ('fixed', 'rotating')),
  prompt text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array'),
  active boolean not null default true,
  sort integer not null default 0
);

-- One per person per day on their own calendar. The skip rate is a query.
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  local_date date not null,
  status text not null check (status in ('done', 'skipped')),
  created_at timestamptz not null default now(),
  unique (user_id, local_date)
);

-- A skipped check-in keeps whatever was answered before the skip. question_id
-- has no cascade, so a question someone has answered can't be deleted.
create table public.check_in_answers (
  check_in_id uuid not null references public.check_ins on delete cascade,
  question_id text not null references public.check_in_questions,
  option_id text not null,
  value numeric not null,
  primary key (check_in_id, question_id)
);

-- One row each time the "What made this change?" prompt is shown. Null
-- reason means it was skipped. Separate from profiles.reason, which is shared.
create table public.level_reasons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles on delete cascade,
  level_log_id bigint not null unique references public.level_log on delete cascade,
  before_level smallint not null check (before_level between 0 and 100),
  after_level smallint not null check (after_level between 0 and 100),
  reason text check (char_length(reason) <= 100),
  source text check (source in ('chip', 'typed')),
  shown_at timestamptz not null default now(),
  check ((reason is null) = (source is null))
);
create index on public.level_reasons (user_id, shown_at);

-- ------------------------------------------------------------------- RLS

alter table public.check_in_questions enable row level security;
alter table public.check_ins enable row level security;
alter table public.check_in_answers enable row level security;
alter table public.level_reasons enable row level security;

create policy "everyone reads" on public.check_in_questions for select to authenticated using (true);

create policy "own" on public.check_ins for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own" on public.check_in_answers for all to authenticated
  using (exists (select 1 from public.check_ins c where c.id = check_in_id and c.user_id = (select auth.uid())))
  with check (exists (select 1 from public.check_ins c where c.id = check_in_id and c.user_id = (select auth.uid())));

-- Foreign keys ignore RLS, so the log row's owner has to be checked here, or
-- someone could attach a reason to another person's level change.
create policy "own" on public.level_reasons for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.level_log l where l.id = level_log_id and l.user_id = (select auth.uid()))
  );

-- --------------------------------------------------------------- functions

-- Both run as the caller, so RLS still applies.

-- The fixed questions, then the rotating question this person answered least
-- recently. Never answered comes first, then `sort` breaks ties. Only answers
-- from before p_date count, so answering today can't change today's pick.
create function public.todays_questions(p_date date) returns setof public.check_in_questions
language sql stable set search_path = '' as $$
  with rotating as (
    select q.id
      from public.check_in_questions q
      left join public.check_in_answers a on a.question_id = q.id
      left join public.check_ins c
        on c.id = a.check_in_id and c.user_id = (select auth.uid()) and c.local_date < p_date
     where q.kind = 'rotating' and q.active
     group by q.id, q.sort
     order by max(c.local_date) nulls first, q.sort, q.id
     limit 1
  )
  select q.*
    from public.check_in_questions q
   where q.active and (q.kind = 'fixed' or q.id in (select id from rotating))
   order by q.kind = 'rotating', q.sort, q.id;
$$;

-- Saves the check-in and its answers together, so a dropped connection can't
-- leave a row with no answers. p_answers is a list of { question_id, option_id }.
-- `value` comes from the question's options, not the client. Saving twice on
-- one date updates the same row, and the last status wins.
create function public.save_check_in(p_date date, p_status text, p_answers jsonb default '[]') returns uuid
language plpgsql set search_path = '' as $$
declare
  saved_id uuid;
  saved_count integer;
begin
  insert into public.check_ins (local_date, status)
  values (p_date, p_status)
  on conflict (user_id, local_date) do update set status = excluded.status
  returning id into saved_id;

  insert into public.check_in_answers (check_in_id, question_id, option_id, value)
  select saved_id, q.id, a.option_id, (o ->> 'value')::numeric
    from jsonb_to_recordset(p_answers) as a (question_id text, option_id text)
    join public.check_in_questions q on q.id = a.question_id
    cross join lateral jsonb_array_elements(q.options) as o
   where o ->> 'id' = a.option_id
  on conflict (check_in_id, question_id) do update
    set option_id = excluded.option_id, value = excluded.value;

  get diagnostics saved_count = row_count;
  if saved_count <> jsonb_array_length(p_answers) then
    raise exception 'unknown question or option';
  end if;

  return saved_id;
end $$;

revoke execute on function public.todays_questions(date) from public, anon;
revoke execute on function public.save_check_in(date, text, jsonb) from public, anon;
grant execute on function public.todays_questions(date) to authenticated;
grant execute on function public.save_check_in(date, text, jsonb) to authenticated;

-- -------------------------------------------------------------------- seed

insert into public.check_in_questions (id, kind, prompt, options, sort) values
  ('sleep', 'fixed', 'How did you sleep?',
   '[{"id":"1","label":"1","value":1},{"id":"2","label":"2","value":2},{"id":"3","label":"3","value":3},{"id":"4","label":"4","value":4},{"id":"5","label":"5","value":5}]', 1),
  ('social_yesterday', 'fixed', 'How social was yesterday?',
   '[{"id":"barely","label":"Barely saw anyone","value":0},{"id":"a_bit","label":"A bit","value":1},{"id":"fair","label":"A fair amount","value":2},{"id":"lot","label":"A lot","value":3}]', 2),
  ('busy_today', 'rotating', 'How busy is today looking?',
   '[{"id":"quiet","label":"Quiet","value":0},{"id":"normal","label":"Normal","value":1},{"id":"packed","label":"Packed","value":2}]', 3),
  ('alone_time', 'rotating', 'Any time alone planned today?',
   '[{"id":"yes","label":"Yes","value":1},{"id":"no","label":"No","value":0}]', 4),
  ('stress', 'rotating', 'How''s your stress right now?',
   '[{"id":"1","label":"1","value":1},{"id":"2","label":"2","value":2},{"id":"3","label":"3","value":3},{"id":"4","label":"4","value":4},{"id":"5","label":"5","value":5}]', 5),
  ('exercise', 'rotating', 'Did you exercise yesterday?',
   '[{"id":"yes","label":"Yes","value":1},{"id":"no","label":"No","value":0}]', 6),
  ('social_plans', 'rotating', 'Anything social planned today?',
   '[{"id":"yes","label":"Yes","value":1},{"id":"no","label":"No","value":0}]', 7),
  ('screen_time', 'rotating', 'How much screen time last night?',
   '[{"id":"little","label":"Little","value":0},{"id":"some","label":"Some","value":1},{"id":"lots","label":"Lots","value":2}]', 8);
