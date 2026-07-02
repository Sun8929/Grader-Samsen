-- Classrooms table
create table if not exists public.classrooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text unique not null,
  description text,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- Index for looking up classrooms by code
create index if not exists classrooms_code_idx on public.classrooms (code);
-- Index for looking up classrooms by teacher
create index if not exists classrooms_teacher_id_idx on public.classrooms (teacher_id);

-- Classroom members (enrollments)
create table if not exists public.classroom_members (
  classroom_id uuid references public.classrooms(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (classroom_id, student_id)
);

-- Index for searching student enrollments
create index if not exists classroom_members_student_id_idx on public.classroom_members (student_id);

-- Enable RLS
alter table public.classrooms enable row level security;
alter table public.classroom_members enable row level security;

-- Policies for Classrooms
create policy "Classrooms are viewable by authenticated users"
  on public.classrooms for select
  to authenticated
  using (true);

create policy "Teachers can insert classrooms"
  on public.classrooms for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('teacher', 'admin')
    )
  );

create policy "Teachers can update their own classrooms"
  on public.classrooms for update
  to authenticated
  using (teacher_id = auth.uid());

create policy "Teachers can delete their own classrooms"
  on public.classrooms for delete
  to authenticated
  using (teacher_id = auth.uid());

-- Policies for Classroom Members
create policy "Members are viewable by authenticated users"
  on public.classroom_members for select
  to authenticated
  using (true);

create policy "Students can enroll themselves"
  on public.classroom_members for insert
  to authenticated
  with check (student_id = auth.uid());

create policy "Students or teachers can remove enrollments"
  on public.classroom_members for delete
  to authenticated
  using (
    student_id = auth.uid() or
    exists (
      select 1 from public.classrooms
      where id = classroom_id and teacher_id = auth.uid()
    )
  );
