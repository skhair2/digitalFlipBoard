-- Session History Table for long-term persistence
create table if not exists session_history (
  id uuid default uuid_generate_v4() primary key,
  session_code text not null,
  messages jsonb not null, -- Stores the array of messages from Redis
  archived_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for faster lookups by session code
create index if not exists idx_session_history_code on session_history(session_code);

-- Enable RLS
alter table session_history enable row level security;

-- Policies for session_history
-- For now, only admins or the system can view all history.
-- In a real app, we'd link this to a user_id if possible.
create policy "Admins can view all session history"
  on session_history for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
