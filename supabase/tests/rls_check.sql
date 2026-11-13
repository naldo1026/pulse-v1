-- Proves nobody else can see or change your check-ins and change reasons,
-- that today's rotating question stays put, and that only your circle sees
-- your level, pulses and seen marks. Local stack only: it adds three users,
-- then rolls everything back. Run it with the stack up:
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
  user_c constant uuid := '00000000-0000-0000-0000-00000000000c';
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
  pulse_a uuid;
  pulse_b uuid;
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


  -- ---------------------------------------------------------------- circles

  insert into auth.users (id, email) values (user_c, 'c@example.test');
  update public.profiles set username = 'alex', phone = '447700900001' where id = user_a;
  update public.profiles set username = 'bea' where id = user_b;
  update public.profiles set username = 'cal', level = 70 where id = user_c;

  perform pg_temp.sign_in(user_a);

  perform pg_temp.expect(pg_temp.row_total('select 1 from public.profiles') = 1, 'with nobody in their circle, A reads only their own profile');
  perform pg_temp.expect(
    pg_temp.error_of(format('insert into public.nudges (to_id, kind) values (%L, ''ask'')', user_b)) = '42501',
    'A can''t nudge someone outside their circle'
  );

  perform pg_temp.expect(pg_temp.error_of(format('update public.profiles set username = ''bea'' where id = %L', user_a)) = '23505', 'a taken username is refused');
  perform pg_temp.expect(pg_temp.error_of(format('update public.profiles set username = ''Alex'' where id = %L', user_a)) = '23514', 'a username with capitals is refused');
  perform pg_temp.expect(pg_temp.error_of(format('update public.profiles set username = ''al'' where id = %L', user_a)) = '23514', 'a username under 3 characters is refused');

  perform pg_temp.expect(pg_temp.row_total('select 1 from public.find_person(''be'')') = 0, 'part of a username finds nobody');
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.find_person(''alex'')') = 0, 'you don''t find yourself');
  perform pg_temp.expect(
    (select display_name = 'B' and state is null from public.find_person(' @Bea ')),
    'an exact username finds them, ignoring @, capitals and spaces'
  );

  -- A asks B.
  perform pg_temp.expect(public.ask_to_connect(user_b) = 'asked', 'A asks B');
  perform pg_temp.expect(public.ask_to_connect(user_b) = 'asked', 'asking twice is harmless');
  perform pg_temp.expect((select state from public.find_person('bea')) = 'asked', 'A sees B as asked');
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.my_requests() where not incoming') = 1, 'A sees one request going out');
  perform pg_temp.expect(pg_temp.row_total(format('select 1 from public.profiles where id = %L', user_b)) = 0, 'asking doesn''t show A B''s level');
  perform pg_temp.expect(
    pg_temp.error_of(format('insert into public.circle_requests (from_id, to_id) values (%L, %L)', user_a, user_c)) = '42501',
    'nobody inserts a request directly'
  );
  perform pg_temp.expect(
    pg_temp.error_of(format('insert into public.connections (user_id, friend_id) values (%L, %L)', user_a, user_c)) = '42501',
    'nobody inserts a connection directly'
  );

  perform pg_temp.sign_in(user_b);
  perform pg_temp.expect(pg_temp.row_total(format('select 1 from public.profiles where id = %L', user_a)) = 0, 'being asked doesn''t show B A''s level either');
  perform pg_temp.expect((select username from public.my_requests() where incoming) = 'alex', 'B sees who asked');
  perform pg_temp.expect((select state from public.find_person('alex')) = 'asked_you', 'B sees A as asked_you');
  perform pg_temp.expect(public.ask_to_connect(user_a) = 'connected', 'B accepts');
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.my_requests()') = 0, 'the request is gone once accepted');
  perform pg_temp.expect((select level from public.profiles where id = user_a) = 60, 'B reads A''s level');
  perform pg_temp.expect((select phone from public.profiles where id = user_a) = '447700900001', 'B reads A''s WhatsApp number');
  perform pg_temp.expect(pg_temp.changed('delete from public.connections') = 0, 'B''s delete of connections changes nothing');

  perform pg_temp.sign_in(user_a);
  perform pg_temp.expect((select level from public.profiles where id = user_b) = 30, 'A reads B''s level');
  perform pg_temp.expect((select state from public.find_person('bea')) = 'connected', 'A sees B as connected');

  perform pg_temp.sign_in(user_c);
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.profiles') = 1, 'C, outside the circle, still reads only their own profile');
  perform pg_temp.expect(
    pg_temp.row_total(format('select 1 from public.profiles where id = %L and phone is not null', user_a)) = 0,
    'C can''t read A''s WhatsApp number'
  );

  -- Pulses and seen marks.
  perform pg_temp.sign_in(user_a);
  insert into public.pulses (level, groups) values (60, array['household', 'family', 'friends']) returning id into pulse_a;
  perform pg_temp.expect((select recipient_ids from public.pulses where id = pulse_a) = array[user_b], 'A''s pulse reaches B, and not C');
  perform pg_temp.expect(
    pg_temp.error_of(format('insert into public.nudges (to_id, kind) values (%L, ''in'')', user_b)) is null,
    'A can nudge B now'
  );

  perform pg_temp.sign_in(user_c);
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.pulses') = 0, 'C reads no pulses');
  perform pg_temp.expect(
    pg_temp.error_of(format('insert into public.pulse_seen (pulse_id) values (%L)', pulse_a)) = '42501',
    'C can''t mark A''s pulse seen'
  );

  perform pg_temp.sign_in(user_b);
  perform pg_temp.expect(pg_temp.row_total(format('select 1 from public.pulses where id = %L', pulse_a)) = 1, 'B reads the pulse sent to them');
  insert into public.pulse_seen (pulse_id) values (pulse_a);
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.pulse_seen') = 1, 'B marks it seen');
  insert into public.groupings (member_id, grp) values (user_a, 'household');
  insert into public.pulses (level, groups) values (30, array['family']) returning id into pulse_b;
  perform pg_temp.expect(cardinality((select recipient_ids from public.pulses where id = pulse_b)) = 0, 'a pulse only reaches the groups chosen');

  perform pg_temp.sign_in(user_a);
  perform pg_temp.expect(
    pg_temp.row_total(format('select 1 from public.pulse_seen where pulse_id = %L and viewer_id = %L', pulse_a, user_b)) = 1,
    'A sees that B saw it'
  );
  perform pg_temp.expect(pg_temp.row_total(format('select 1 from public.pulses where id = %L', pulse_b)) = 0, 'A doesn''t read a pulse that didn''t reach them');

  perform pg_temp.sign_in(user_c);
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.pulse_seen') = 0, 'C reads no seen marks');

  -- Declining.
  perform pg_temp.expect(public.ask_to_connect(user_b) = 'asked', 'C asks B');
  perform pg_temp.sign_in(user_b);
  perform public.decline_request(user_c);
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.my_requests()') = 0, 'a declined request disappears for B');
  perform pg_temp.expect((select state from public.find_person('cal')) is null, 'and C looks like a stranger to B');
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.circle_declines') = 0, 'nobody reads declines through the API');

  perform pg_temp.sign_in(user_c);
  perform pg_temp.expect((select state from public.find_person('bea')) = 'asked', 'C still sees B as asked');
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.circle_declines') = 0, 'C can''t see the decline either');
  perform public.cancel_request(user_b);
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.my_requests()') = 0, 'C cancels');
  perform pg_temp.expect(public.ask_to_connect(user_b) = 'asked', 'C asks again');

  perform pg_temp.sign_in(user_b);
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.my_requests()') = 0, 'asking again still doesn''t reach B');
  perform pg_temp.expect(public.ask_to_connect(user_c) = 'connected', 'B can still add C themselves');
  perform pg_temp.expect((select level from public.profiles where id = user_c) = 70, 'and then reads C''s level');

  -- Removing.
  perform public.remove_from_circle(user_c);
  perform pg_temp.expect(pg_temp.row_total(format('select 1 from public.profiles where id = %L', user_c)) = 0, 'removing C hides C from B');
  perform pg_temp.sign_in(user_c);
  perform pg_temp.expect(pg_temp.row_total(format('select 1 from public.profiles where id = %L', user_b)) = 0, 'and hides B from C');
  perform pg_temp.expect(public.ask_to_connect(user_b) = 'asked', 'C can ask again');
  perform pg_temp.sign_in(user_b);
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.my_requests()') = 0, 'but it doesn''t reach B, who removed them');

  perform pg_temp.sign_in(user_a);
  perform pg_temp.expect((select level from public.profiles where id = user_b) = 30, 'B removing C leaves A and B connected');

  perform pg_temp.sign_out();
  perform pg_temp.expect(pg_temp.row_total('select 1 from public.profiles') = 0, 'signed out reads no profiles');
  perform pg_temp.expect(pg_temp.error_of('select public.find_person(''bea'')') = '42501', 'signed out can''t call find_person');

  perform pg_temp.admin();
  perform pg_temp.expect(
    (select count(*) from public.circle_declines where owner_id = user_b and from_id = user_c) = 1,
    'B''s decline of C is on record, so notify won''t push C''s asks'
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

  perform pg_temp.expect(
    (select count(*) from pg_class
      where oid in ('public.circle_requests'::regclass, 'public.circle_declines'::regclass, 'public.connections'::regclass)
        and relrowsecurity) = 3,
    'RLS is on for the 3 circle tables'
  );
  perform pg_temp.expect(
    not has_function_privilege('anon', 'public.find_person(text)', 'execute')
      and not has_function_privilege('anon', 'public.my_requests()', 'execute')
      and not has_function_privilege('anon', 'public.ask_to_connect(uuid)', 'execute')
      and not has_function_privilege('anon', 'public.decline_request(uuid)', 'execute')
      and not has_function_privilege('anon', 'public.cancel_request(uuid)', 'execute')
      and not has_function_privilege('anon', 'public.remove_from_circle(uuid)', 'execute'),
    'no circle function is granted to signed-out users'
  );
  perform pg_temp.expect(
    pg_get_function_result('public.find_person(text)'::regprocedure) = 'TABLE(id uuid, username text, display_name text, state text)',
    'find_person returns a name and username, nothing else'
  );
  perform pg_temp.expect(
    (select count(*) from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename in ('circle_requests', 'connections')) = 2
      and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'circle_declines'),
    'requests and connections are live, declines aren''t'
  );

  raise notice 'rls_check passed';
end $$;

rollback;
