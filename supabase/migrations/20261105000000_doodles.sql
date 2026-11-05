-- The doodle you've given someone on your Circle, shown instead of their
-- initial. It's your own label for them: groupings' RLS keeps it private to
-- the owner. The ids live in lib/doodles.js.
alter table public.groupings add column doodle text check (char_length(doodle) <= 40);
