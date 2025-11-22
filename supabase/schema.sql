-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Saved Designs Table
create table if not exists saved_designs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  layout jsonb not null, -- Stores the 22x6 grid array
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Boards Table (for managing multiple physical or virtual boards)
create table if not exists boards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Scheduled Messages Table
create table if not exists scheduled_messages (
  id uuid default uuid_generate_v4() primary key,
  board_id uuid references boards(id) on delete cascade not null,
  content text not null,
  scheduled_time timestamp with time zone not null,
  status text default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS)

-- Enable RLS
alter table saved_designs enable row level security;
alter table boards enable row level security;
alter table scheduled_messages enable row level security;

-- Policies for saved_designs
create policy "Users can view their own designs"
  on saved_designs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own designs"
  on saved_designs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own designs"
  on saved_designs for delete
  using (auth.uid() = user_id);

-- Policies for boards
create policy "Users can view their own boards"
  on boards for select
  using (auth.uid() = user_id);

create policy "Users can insert their own boards"
  on boards for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own boards"
  on boards for delete
  using (auth.uid() = user_id);

-- Policies for scheduled_messages
-- Note: We check board ownership for scheduling
create policy "Users can view schedules for their boards"
  on scheduled_messages for select
  using (
    exists (
      select 1 from boards
      where boards.id = scheduled_messages.board_id
      and boards.user_id = auth.uid()
    )
  );

create policy "Users can insert schedules for their boards"
  on scheduled_messages for insert
  with check (
    exists (
      select 1 from boards
      where boards.id = scheduled_messages.board_id
      and boards.user_id = auth.uid()
    )
  );

create policy "Users can delete schedules for their boards"
  on scheduled_messages for delete
  using (
    exists (
      select 1 from boards
      where boards.id = scheduled_messages.board_id
      and boards.user_id = auth.uid()
    )
  );
