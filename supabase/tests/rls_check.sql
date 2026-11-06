-- Proves nobody else can see or change your check-ins and change reasons, and
-- that today's rotating question stays put. Local stack only: it adds two
-- users, then rolls everything back. Run it with the stack up:
--
--   docker exec -i supabase_db_pulse psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/rls_check.sql
--
-- (The container is supabase_db_<project_id>.) A failed check stops the script
-- with an error. It ends with "rls_check passed". This is plain SQL rather than
-- pgTAP, so `supabase test db` won't run it.

begin;

create function pg_temp.sign_in(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
end $$;

create function pg_temp.sign_out() returns void language plpgsql as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
end $$;

-- Back to the role running the script, which RLS doesn't apply to.
create function pg_temp.admin() returns void language plpgsql as $$
begin
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

create function pg_temp.expect(ok boolean, what text) returns void language plpgsql as $$
begin
  if ok is not true then raise exception 'FAILED: %', what; end if;
  raise notice 'ok: %', what;
end $$;

create function pg_temp.row_total(query text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute format('select count(*) from (%s) q', query) into n;
  return n;
end $$;

create function pg_temp.changed(stmt text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute stmt;
  get diagnostics n = row_count;
  return n;
end $$;

-- The SQLSTATE a statement fails with, or null if it works. 42501 is what RLS
-- and missing permissions raise, so a typo or a broken constraint can't pass
-- as "rejected".
create function pg_temp.error_of(stmt text) returns text language plpgsql as $$
begin
  execute stmt;
  return null;
exception when others then
  return sqlstate;
end $$;

create function pg_temp.rotating(day date) returns text language sql as $$
  select id from public.todays_questions(day) where kind = 'rotating';
$$;

do $$
declare
  user_a constant uuid := '00000000-0000-0000-0000-00000000000a';
  user_b constant uuid := '00000000-0000-0000-0000-00000000000b';
  day1 constant date := '2026-01-01';
  day2 constant date := '2026-01-02';
  day3 constant date := '2026-01-03';
  day4 constant date := '2026-01-04';
  next_day date;
  q text;
  log_a1 bigint;
  log_a2 bigint;
  log_a_free bigint;
  log_b bigint;
  check_in_a uuid;
  check_in_a_day2 uuid;
  saved_again uuid;
  check_in_b uuid;
begin
  -- ----------------------------------------------------------------- setup

  -- The sign-up trigger makes the profiles, the level trigger the log rows.
  insert into auth.users (id, email) values (user_a, 'a@example.test'), (user_b, 'b@example.test');
  update public.profiles set level = 40 where id = user_a;
  select max(id) into log_a1 from public.level_log where user_id = user_a;
  update public.profiles set level = 80 where id = user_a;
  select max(id) into log_a2 from public.level_log where user_id = user_a;
  update public.profiles set level = 60 where id = user_a;
  select max(id) into log_a_free from public.level_log where user_id = user_a;
  update public.profiles set level = 30 where id = user_b;
  select max(id) into log_b from public.level_log where user_id = user_b;

  -- ------------------------------------------------------------------ seed

  perform pg_temp.expect(pg_temp.row_total('select 1 from public.check_in_questions where kind = ''fixed''') = 2, 'seeded 2 fixed questions');
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.check_in_questions where kind = ''rotating''') = 6, 'seeded 6 rotating questions');

  -- --------------------------------------------- A can use their own rows,
  -- so a pass below can't just mean nobody can read anything.

  perform pg_temp.sign_in(user_a);

  perform pg_temp.expect(
    (select array_agg(q.id order by q.ordinality) from public.todays_questions(day1) with ordinality q)
      = array['sleep', 'social_yesterday', 'busy_today'],
    'today is the 2 fixed questions, then a rotating one'
  );
  perform pg_temp.expect(pg_temp.rotating(day1) = 'busy_today', 'first ask: never-answered question with the lowest sort');
  perform pg_temp.expect(pg_temp.rotating(day1) = 'busy_today', 'second ask on the same date: same question');

  check_in_a := public.save_check_in(day1, 'done',
    '[{"question_id":"sleep","option_id":"4","value":99},{"question_id":"social_yesterday","option_id":"lot"},{"question_id":"busy_today","option_id":"packed"}]');

  perform pg_temp.expect(pg_temp.row_total('select 1 from public.check_ins') = 1, 'A reads their own check-in');
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.check_in_answers') = 3, 'A reads their own answers');
  perform pg_temp.expect(
    (select value from public.check_in_answers where check_in_id = check_in_a and question_id = 'sleep') = 4,
    'value comes from the question''s options, not the client'
  );
  perform pg_temp.expect(
    (select value from public.check_in_answers where check_in_id = check_in_a and question_id = 'busy_today') = 2,
    'value is looked up for each answer'
  );

  insert into public.level_reasons (level_log_id, before_level, after_level, reason, source)
    values (log_a1, 50, 40, 'Work', 'chip');
  insert into public.level_reasons (level_log_id, before_level, after_level)
    values (log_a2, 40, 80);
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.level_reasons') = 2, 'A saves and reads a chip reason and a skip');

  perform pg_temp.expect(
    pg_temp.error_of(format('insert into public.level_reasons (level_log_id, before_level, after_level, reason) values (%L, 40, 80, ''Work'')', log_a_free)) = '23514',
    'a reason needs a source'
  );
  perform pg_temp.expect(
    pg_temp.error_of(format('insert into public.level_reasons (level_log_id, before_level, after_level) values (%L, 50, 40)', log_a1)) = '23505',
    'one reason per level change'
  );

  -- -------------------------------------------------------------- rotation

  perform pg_temp.expect(pg_temp.rotating(day1) = 'busy_today', 'still the same question after answering it that day');
  perform pg_temp.expect(pg_temp.rotating(day2) = 'alone_time', 'the next date moves on');

  check_in_a_day2 := public.save_check_in(day2, 'skipped', '[{"question_id":"sleep","option_id":"2"}]');
  perform pg_temp.expect(
    (select status from public.check_ins where id = check_in_a_day2) = 'skipped'
      and pg_temp.row_total(format('select 1 from public.check_in_answers where check_in_id = %L', check_in_a_day2)) = 1,
    'a skip keeps the answers already given'
  );
  perform pg_temp.expect(pg_temp.rotating(day3) = 'alone_time', 'a skip without the rotating answer repeats it next day');

  perform public.save_check_in(day4, 'skipped');
  perform pg_temp.expect(pg_temp.row_total(format('select 1 from public.check_ins where local_date = %L', day4)) = 1, 'a skip with no answers still saves a row');

  saved_again := public.save_check_in(day2, 'done', '[{"question_id":"alone_time","option_id":"yes"}]');
  perform pg_temp.expect(saved_again = check_in_a_day2, 'saving twice on one date returns the same row');
  perform pg_temp.expect(pg_temp.row_total(format('select 1 from public.check_ins where local_date = %L', day2)) = 1, 'and there''s still one row for that date');
  perform pg_temp.expect(pg_temp.row_total(format('select 1 from public.check_in_answers where check_in_id = %L', check_in_a_day2)) = 2, 'and it keeps the earlier answers alongside the new one');
  perform pg_temp.expect((select status from public.check_ins where id = check_in_a_day2) = 'done', 'and the last status wins');

  -- Answer the rest of the rotation, one a day.
  next_day := '2026-01-10';
  foreach q in array array['stress', 'exercise', 'social_plans', 'screen_time'] loop
    perform pg_temp.expect(pg_temp.rotating(next_day) = q, format('next in the rotation: %s', q));
    perform public.save_check_in(next_day, 'done', jsonb_build_array(jsonb_build_object(
      'question_id', q,
      'option_id', (select options -> 0 ->> 'id' from public.check_in_questions where id = q)
    )));
    next_day := next_day + 1;
  end loop;
  perform pg_temp.expect(pg_temp.rotating(next_day) = 'busy_today', 'once all are answered, the least recent comes back');
  perform pg_temp.expect(pg_temp.rotating(day1) = 'busy_today', 'later answers don''t change an earlier date''s pick');

  perform pg_temp.admin();
  update public.check_in_questions set active = false where id = 'busy_today';
  perform pg_temp.sign_in(user_a);
  perform pg_temp.expect(pg_temp.rotating(next_day) = 'alone_time', 'a retired question is left out');
  perform pg_temp.admin();
  update public.check_in_questions set active = true where id = 'busy_today';
  perform pg_temp.sign_in(user_a);

  -- ---------------------------------------------------- nothing half-saved

  perform pg_temp.expect(
    pg_temp.error_of('select public.save_check_in(''2026-03-01'', ''done'', ''[{"question_id":"sleep","option_id":"4"},{"question_id":"sleep_typo","option_id":"4"}]'')') = 'P0001',
    'an unknown question raises an error'
  );
  perform pg_temp.expect(
    pg_temp.error_of('select public.save_check_in(''2026-03-01'', ''done'', ''[{"question_id":"sleep","option_id":"9"}]'')') = 'P0001',
    'an unknown option raises an error'
  );
  perform pg_temp.expect(
    pg_temp.row_total('select 1 from public.check_ins where local_date = ''2026-03-01''') = 0,
    'and neither one saves anything'
  );

  -- ------------------------------------------------- B reading A's rows

  perform pg_temp.sign_in(user_b);

  perform pg_temp.expect(pg_temp.row_total('select 1 from public.check_ins') = 0, 'B gets 0 rows from check_ins');
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.check_in_answers') = 0, 'B gets 0 rows from check_in_answers');
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.level_reasons') = 0, 'B gets 0 rows from level_reasons');
  perform pg_temp.expect(pg_temp.rotating(day2) = 'busy_today', 'A''s answers don''t move B''s rotation');

  -- ------------------------------------------------- B writing A's rows

  perform pg_temp.expect(
    pg_temp.error_of(format('insert into public.check_ins (user_id, local_date, status) values (%L, ''2026-04-01'', ''done'')', user_a)) = '42501',
    'B can''t insert a check-in with A''s user_id'
  );
  perform pg_temp.expect(
    pg_temp.error_of(format('insert into public.check_ins (user_id, local_date, status) values (%L, %L, ''skipped'') on conflict (user_id, local_date) do update set status = ''skipped''', user_a, day1)) = '42501',
    'B can''t overwrite A''s check-in with an upsert'
  );
  perform pg_temp.expect(
    pg_temp.error_of(format('insert into public.check_in_answers (check_in_id, question_id, option_id, value) values (%L, ''stress'', ''1'', 1)', check_in_a)) = '42501',
    'B can''t add an answer to A''s check-in'
  );
  perform pg_temp.expect(
    pg_temp.error_of(format('insert into public.level_reasons (user_id, level_log_id, before_level, after_level) values (%L, %L, 80, 60)', user_a, log_a_free)) = '42501',
    'B can''t insert a reason with A''s user_id'
  );
  perform pg_temp.expect(
    pg_temp.error_of(format('insert into public.level_reasons (user_id, level_log_id, before_level, after_level) values (%L, %L, 80, 60)', user_b, log_a_free)) = '42501',
    'B can''t attach their own reason to A''s level change'
  );

  perform pg_temp.expect(pg_temp.changed(format('update public.check_ins set status = ''skipped'' where user_id = %L', user_a)) = 0, 'B''s update of A''s check-ins changes nothing');
  perform pg_temp.expect(pg_temp.changed(format('delete from public.check_ins where user_id = %L', user_a)) = 0, 'B''s delete of A''s check-ins changes nothing');
  perform pg_temp.expect(pg_temp.changed(format('update public.check_in_answers set value = 0 where check_in_id = %L', check_in_a)) = 0, 'B''s update of A''s answers changes nothing');
  perform pg_temp.expect(pg_temp.changed(format('delete from public.check_in_answers where check_in_id = %L', check_in_a)) = 0, 'B''s delete of A''s answers changes nothing');
  perform pg_temp.expect(pg_temp.changed(format('update public.level_reasons set reason = ''x'', source = ''typed'' where user_id = %L', user_a)) = 0, 'B''s update of A''s reasons changes nothing');
  perform pg_temp.expect(pg_temp.changed(format('delete from public.level_reasons where user_id = %L', user_a)) = 0, 'B''s delete of A''s reasons changes nothing');

  -- B's own rows work, and can't be handed over to A.
  check_in_b := public.save_check_in(day1, 'done', '[{"question_id":"sleep","option_id":"1"}]');
  insert into public.level_reasons (level_log_id, before_level, after_level, reason, source)
    values (log_b, 50, 30, 'long day', 'typed');
  perform pg_temp.expect(check_in_b <> check_in_a, 'the same date for B is B''s own row');
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.check_ins') = 1, 'B reads only their own check-in');
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.check_in_answers') = 1, 'B reads only their own answer');
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.level_reasons') = 1, 'B reads only their own reason');
  perform pg_temp.expect(
    pg_temp.error_of(format('update public.check_ins set user_id = %L where id = %L', user_a, check_in_b)) = '42501',
    'B can''t move a check-in to A'
  );
  perform pg_temp.expect(
    pg_temp.error_of(format('update public.check_in_answers set check_in_id = %L where check_in_id = %L', check_in_a, check_in_b)) = '42501',
    'B can''t move an answer to A''s check-in'
  );
  perform pg_temp.expect(
    pg_temp.error_of(format('update public.level_reasons set level_log_id = %L where user_id = %L', log_a_free, user_b)) = '42501',
    'B can''t move a reason to A''s level change'
  );

  -- ------------------------------------------------- questions are read-only

  perform pg_temp.expect(pg_temp.row_total('select 1 from public.check_in_questions') = 8, 'a signed-in user reads all 8 questions');
  perform pg_temp.expect(
    pg_temp.error_of('insert into public.check_in_questions (id, kind, prompt, options) values (''x'', ''fixed'', ''x'', ''[]'')') = '42501',
    'a signed-in user can''t insert a question'
  );
  perform pg_temp.expect(pg_temp.changed('update public.check_in_questions set prompt = ''x''') = 0, 'a signed-in user''s update of questions changes nothing');
  perform pg_temp.expect(pg_temp.changed('delete from public.check_in_questions') = 0, 'a signed-in user''s delete of questions changes nothing');

  -- ------------------------------------------------------------- signed out

  perform pg_temp.sign_out();

  perform pg_temp.expect(pg_temp.row_total('select 1 from public.check_in_questions') = 0, 'signed out gets 0 rows from check_in_questions');
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.check_ins') = 0, 'signed out gets 0 rows from check_ins');
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.check_in_answers') = 0, 'signed out gets 0 rows from check_in_answers');
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.level_reasons') = 0, 'signed out gets 0 rows from level_reasons');
  perform pg_temp.expect(pg_temp.error_of('select public.todays_questions(''2026-01-01'')') = '42501', 'signed out can''t call todays_questions');
  perform pg_temp.expect(pg_temp.error_of('select public.save_check_in(''2026-01-01'', ''skipped'')') = '42501', 'signed out can''t call save_check_in');

  -- ------------------------------------------------- A's rows came through

  perform pg_temp.admin();

  perform pg_temp.expect(
    (select status from public.check_ins where id = check_in_a) = 'done'
      and pg_temp.row_total(format('select 1 from public.check_in_answers where check_in_id = %L and value <> 0', check_in_a)) = 3
      and (select reason from public.level_reasons where level_log_id = log_a1) = 'Work',
    'A''s rows are untouched'
  );
  perform pg_temp.expect(
    pg_temp.row_total('select 1 from public.check_in_questions where prompt = ''x''') = 0
      and pg_temp.row_total('select 1 from public.check_in_questions') = 8,
    'the questions are untouched'
  );

  -- ---------------------------------------------------------------- catalog

  perform pg_temp.expect(
    (select count(*) from pg_class
      where oid in ('public.check_in_questions'::regclass, 'public.check_ins'::regclass, 'public.check_in_answers'::regclass, 'public.level_reasons'::regclass)
        and relrowsecurity) = 4,
    'RLS is on for all 4 tables'
  );
  -- RLS would stop a signed-out save anyway, so check the grant by itself.
  perform pg_temp.expect(
    not has_function_privilege('anon', 'public.todays_questions(date)', 'execute')
      and not has_function_privilege('anon', 'public.save_check_in(date, text, jsonb)', 'execute'),
    'neither function is granted to signed-out users'
  );
  perform pg_temp.expect(
    exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'),
    'the realtime publication is there to check'
  );
  perform pg_temp.expect(
    not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename in ('check_in_questions', 'check_ins', 'check_in_answers', 'level_reasons')),
    'none of the new tables are in the realtime publication'
  );

  raise notice 'rls_check passed';
end $$;

rollback;
