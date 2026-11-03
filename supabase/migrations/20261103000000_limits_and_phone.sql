-- One pulse an hour, and a phone number for WhatsApp.

-- Digits only, country code first: the form wa.me links take.
alter table public.profiles add column phone text check (phone ~ '^[0-9]{8,15}$');

-- Nobody gets buzzed by the same person twice in an hour. The lock makes a
-- double tap wait for the first insert, so it sees that row and fails.
-- Named so it fires before pulses_recipients (same timing runs alphabetically).
create function private.one_pulse_an_hour() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtext(new.sender_id::text));
  if exists (
    select 1 from public.pulses
     where sender_id = new.sender_id and created_at > now() - interval '1 hour'
  ) then
    raise exception 'one pulse an hour';
  end if;
  return new;
end $$;

create trigger pulses_limit before insert on public.pulses
  for each row execute function private.one_pulse_an_hour();
