-- Create boards table
create table if not exists public.boards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on boards
alter table public.boards enable row level security;

-- Create policies for boards
create policy "Users can view their own boards"
  on public.boards for select
  using (auth.uid() = user_id);

create policy "Users can insert their own boards"
  on public.boards for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own boards"
  on public.boards for update
  using (auth.uid() = user_id);

create policy "Users can delete their own boards"
  on public.boards for delete
  using (auth.uid() = user_id);

-- Create scheduled_messages table
create table if not exists public.scheduled_messages (
  id uuid default gen_random_uuid() primary key,
  board_id uuid references public.boards(id) on delete cascade not null,
  content text not null,
  scheduled_time timestamp with time zone not null,
  status text default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on scheduled_messages
alter table public.scheduled_messages enable row level security;

-- Create policies for scheduled_messages
create policy "Users can view schedules for their boards"
  on public.scheduled_messages for select
  using (
    exists (
      select 1 from public.boards
      where boards.id = scheduled_messages.board_id
      and boards.user_id = auth.uid()
    )
  );

create policy "Users can insert schedules for their boards"
  on public.scheduled_messages for insert
  with check (
    exists (
      select 1 from public.boards
      where boards.id = scheduled_messages.board_id
      and boards.user_id = auth.uid()
    )
  );

create policy "Users can update schedules for their boards"
  on public.scheduled_messages for update
  using (
    exists (
      select 1 from public.boards
      where boards.id = scheduled_messages.board_id
      and boards.user_id = auth.uid()
    )
  );

create policy "Users can delete schedules for their boards"
  on public.scheduled_messages for delete
  using (
    exists (
      select 1 from public.boards
      where boards.id = scheduled_messages.board_id
      and boards.user_id = auth.uid()
    )
  );
