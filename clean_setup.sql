-- =========================================================================
-- CLEAN RE-CREATE OF PROFILES AND HOMEWORK_HISTORY TABLES
-- (Old empty tables ko drop karke perfectly create karega bina kisi error ke)
-- =========================================================================

-- 1. Purani tables drop karein (CASCADE se sabhi purani policies bhi hat jayengi)
drop table if exists public.homework_history cascade;
drop table if exists public.profiles cascade;

-- 2. New PROFILES Table banayein (text id jo kisi bhi ID ko accept karega)
create table public.profiles (
  id text primary key,
  name text not null,
  phone text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. New HOMEWORK_HISTORY Table banayein
create table public.homework_history (
  id text primary key,
  user_id text not null,
  subject text,
  grade_level text,
  check_mode text,
  text text,
  images jsonb default '[]'::jsonb,
  feedback text,
  model_used text,
  chat_history jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.homework_history enable row level security;

-- 5. Open Policies (Taki website se direct signup aur history save ho sake)
create policy "Allow all operations on profiles" 
  on public.profiles for all 
  using (true) 
  with check (true);

create policy "Allow all operations on homework_history" 
  on public.homework_history for all 
  using (true) 
  with check (true);

