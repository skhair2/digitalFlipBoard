-- Create saved_designs table
create table saved_designs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  layout jsonb not null, -- Stores the 6x22 array
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table saved_designs enable row level security;

-- Policies
create policy "Users can view their own designs"
  on saved_designs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own designs"
  on saved_designs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own designs"
  on saved_designs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own designs"
  on saved_designs for delete
  using (auth.uid() = user_id);
