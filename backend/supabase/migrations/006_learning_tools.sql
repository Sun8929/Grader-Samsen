-- Progressive problem hints.
alter table public.problems add column if not exists hints text[] not null default '{}';
