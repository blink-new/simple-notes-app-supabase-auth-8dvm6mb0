
-- Create a table for public notes
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  content text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Set up Row Level Security (RLS)
alter table public.notes enable row level security;

-- Create policies
-- Policy to allow individuals to create their own notes
create policy "Users can create their own notes"
  on notes for insert
  with check (auth.uid() = user_id);

-- Policy to allow individuals to view their own notes
create policy "Users can view their own notes"
  on notes for select
  using (auth.uid() = user_id);

-- Policy to allow individuals to update their own notes
create policy "Users can update their own notes"
  on notes for update
  using (auth.uid() = user_id);

-- Policy to allow individuals to delete their own notes
create policy "Users can delete their own notes"
  on notes for delete
  using (auth.uid() = user_id);