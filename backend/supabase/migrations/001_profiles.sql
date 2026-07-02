-- Profiles table linked to Supabase Auth users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  name text not null default '',
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  xp integer default 0,
  streak integer default 0,
  tier text default 'Bronze',
  created_at timestamptz default now()
);

create index if not exists profiles_username_idx on public.profiles (username);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);
