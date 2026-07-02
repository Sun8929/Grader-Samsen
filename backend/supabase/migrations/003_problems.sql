-- Problems table
create table if not exists public.problems (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  statement text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  xp integer default 0,
  time_limit integer not null default 1000, -- in ms
  memory_limit integer not null default 256, -- in MB
  tags text[] default '{}',
  pdf_url text, -- PDF file URL or Base64 data string
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Index for searching problems by creator
create index if not exists problems_created_by_idx on public.problems (created_by);

-- Enable RLS for Problems
alter table public.problems enable row level security;

create policy "Problems are viewable by authenticated users"
  on public.problems for select
  to authenticated
  using (true);

create policy "Teachers can insert problems"
  on public.problems for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('teacher', 'admin')
    )
  );

create policy "Teachers can update their own problems"
  on public.problems for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('teacher', 'admin')
    )
  );

create policy "Teachers can delete their own problems"
  on public.problems for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('teacher', 'admin')
    )
  );


-- Testcases table linked to problems
create table if not exists public.testcases (
  id uuid default gen_random_uuid() primary key,
  problem_id uuid references public.problems(id) on delete cascade not null,
  input text not null,
  output text not null,
  is_public boolean default true,
  created_at timestamptz default now()
);

-- Index for looking up testcases by problem
create index if not exists testcases_problem_id_idx on public.testcases (problem_id);

-- Enable RLS for Testcases
alter table public.testcases enable row level security;

create policy "Testcases are viewable by authenticated users"
  on public.testcases for select
  to authenticated
  using (
    is_public = true or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('teacher', 'admin')
    )
  );

create policy "Teachers can modify testcases"
  on public.testcases for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('teacher', 'admin')
    )
  );


-- Submissions table linked to users and problems
create table if not exists public.submissions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  problem_id uuid references public.problems(id) on delete cascade not null,
  language text not null,
  code text not null,
  verdict text not null default 'Pending',
  score integer not null default 0,
  runtime integer, -- in ms
  memory integer, -- in KB
  submitted_at timestamptz default now()
);

-- Indexing for lookup speed
create index if not exists submissions_user_id_idx on public.submissions (user_id);
create index if not exists submissions_problem_id_idx on public.submissions (problem_id);

-- Enable RLS for Submissions
alter table public.submissions enable row level security;

create policy "Users can view their own submissions or all if teacher/admin"
  on public.submissions for select
  to authenticated
  using (
    user_id = auth.uid() or
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('teacher', 'admin')
    )
  );

create policy "Students can submit their code"
  on public.submissions for insert
  to authenticated
  with check (user_id = auth.uid());
