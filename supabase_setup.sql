-- ================================================================
-- HOMEWORK CHECK AI - SUPABASE TABLES & AUTO-SYNC SETUP
-- ================================================================
-- Is code ko copy karke Supabase Dashboard ke "SQL Editor" me paste karein
-- aur "Run" button par click kar dein.
-- ================================================================

-- 1. Create PROFILES Table (Jisme Name, Mobile, Email save hoga)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  phone text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create HOMEWORK_HISTORY Table (Jisme Checked homework aur chat save hoga)
create table if not exists public.homework_history (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
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

-- 3. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.homework_history enable row level security;

-- 4. Security Policies for Profiles
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 5. Security Policies for Homework History
drop policy if exists "Users can view own homework" on public.homework_history;
create policy "Users can view own homework"
  on public.homework_history for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own homework" on public.homework_history;
create policy "Users can insert own homework"
  on public.homework_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own homework" on public.homework_history;
create policy "Users can update own homework"
  on public.homework_history for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own homework" on public.homework_history;
create policy "Users can delete own homework"
  on public.homework_history for delete
  using (auth.uid() = user_id);

-- 6. AUTOMATIC TRIGGER: Jab bhi koi signup kare, uska data turant 'profiles' table me chala jaye
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone, email, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Student'),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    new.email,
    new.created_at
  )
  on conflict (id) do update
  set name = excluded.name,
      phone = excluded.phone,
      email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger activate karein
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

