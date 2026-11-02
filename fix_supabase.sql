-- =========================================================================
-- FIX PROFILES & HOMEWORK_HISTORY PERMISSIONS IN SUPABASE
-- Run this in your Supabase SQL Editor:
-- =========================================================================

-- 1. Remove foreign key constraint so any signup can insert immediately
alter table if exists public.profiles drop constraint if exists profiles_id_fkey;

-- 2. Allow id column to accept text or uuid
alter table if exists public.profiles alter column id type text;

-- 3. Update RLS policies so website can insert and view profiles
alter table public.profiles enable row level security;

drop policy if exists "Enable all for profiles" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Open policy for SELECT, INSERT, UPDATE so website works 100% smoothly
create policy "Allow public select profiles" on public.profiles for select using (true);
create policy "Allow public insert profiles" on public.profiles for insert with check (true);
create policy "Allow public update profiles" on public.profiles for update using (true);

-- 4. Do the same for homework_history
alter table if exists public.homework_history drop constraint if exists homework_history_user_id_fkey;
alter table if exists public.homework_history alter column user_id type text;

drop policy if exists "Users can view own homework" on public.homework_history;
drop policy if exists "Users can insert own homework" on public.homework_history;
drop policy if exists "Users can update own homework" on public.homework_history;
drop policy if exists "Users can delete own homework" on public.homework_history;

create policy "Allow public select homework_history" on public.homework_history for select using (true);
create policy "Allow public insert homework_history" on public.homework_history for insert with check (true);
create policy "Allow public update homework_history" on public.homework_history for update using (true);
create policy "Allow public delete homework_history" on public.homework_history for delete using (true);

