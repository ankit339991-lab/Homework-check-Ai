# Supabase SQL Schema for Homework Check AI
-- Run this in your Supabase SQL Editor if you want to query history directly in SQL:

create table if not exists public.homework_history (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade,
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

-- Enable Row Level Security (RLS)
alter table public.homework_history enable row level security;

-- Policy: users can select their own homework
create policy "Users can select own homework"
  on public.homework_history for select
  using (auth.uid() = user_id);

-- Policy: users can insert their own homework
create policy "Users can insert own homework"
  on public.homework_history for insert
  with check (auth.uid() = user_id);

-- Policy: users can update their own homework
create policy "Users can update own homework"
  on public.homework_history for update
  using (auth.uid() = user_id);

-- Policy: users can delete their own homework
create policy "Users can delete own homework"
  on public.homework_history for delete
  using (auth.uid() = user_id);

