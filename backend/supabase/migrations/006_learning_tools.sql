-- Progressive problem hints.
alter table public.problems add column if not exists hints text[] not null default '{}';

create table if not exists public.submission_feedback (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists submission_feedback_submission_idx on public.submission_feedback(submission_id);
alter table public.submission_feedback enable row level security;
