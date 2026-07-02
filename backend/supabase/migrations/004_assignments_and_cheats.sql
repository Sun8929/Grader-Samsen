-- Create Assignments Table
create table if not exists public.assignments (
  id uuid default gen_random_uuid() primary key,
  classroom_id uuid references public.classrooms(id) on delete cascade not null,
  title text not null,
  description text,
  due_at timestamptz not null,
  problem_ids uuid[] not null, -- Array of problems bound to this assignment
  created_at timestamptz default now()
);

-- Indexing for assignments lookup
create index if not exists assignments_classroom_id_idx on public.assignments (classroom_id);

-- Enable RLS for Assignments
alter table public.assignments enable row level security;

create policy "Assignments are viewable by authenticated users"
  on public.assignments for select
  to authenticated
  using (true);

create policy "Teachers can manage assignments"
  on public.assignments for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('teacher', 'admin')
    )
  );

-- Alter Submissions table to add plagiarism check tracking columns
alter table public.submissions add column if not exists plagiarism_score integer default 0;
alter table public.submissions add column if not exists plagiarism_source_id uuid references public.submissions(id) on delete set null;
alter table public.submissions add column if not exists is_plagiarized boolean default false;
