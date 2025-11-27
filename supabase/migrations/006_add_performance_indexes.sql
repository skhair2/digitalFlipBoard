-- Database Indexes for Query Optimization
-- Run this migration to improve query performance on critical tables

-- Sessions table indexes (already created in 001_initial_schema.sql, but included for completeness)
CREATE INDEX IF NOT EXISTS idx_sessions_code ON public.sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_sessions_creator ON public.sessions(creator_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON public.sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at DESC);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_session ON public.messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON public.messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session_sent ON public.messages(session_id, sent_at DESC);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_premium ON public.profiles(is_premium) WHERE is_premium = TRUE;

-- Analytics table indexes
CREATE INDEX IF NOT EXISTS idx_analytics_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_user_event ON public.analytics_events(user_id, event_name);

-- Scheduled messages indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_board ON public.scheduled_messages(board_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_time ON public.scheduled_messages(scheduled_time ASC);
CREATE INDEX IF NOT EXISTS idx_scheduled_status ON public.scheduled_messages(status) WHERE status IN ('pending', 'failed');

-- Saved designs indexes
CREATE INDEX IF NOT EXISTS idx_saved_designs_user ON public.saved_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_designs_created ON public.saved_designs(created_at DESC);

-- Boards table indexes
CREATE INDEX IF NOT EXISTS idx_boards_user ON public.boards(user_id);
CREATE INDEX IF NOT EXISTS idx_boards_created ON public.boards(created_at DESC);

-- Composite indexes for common JOIN queries
CREATE INDEX IF NOT EXISTS idx_messages_session_sender ON public.messages(session_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_board_status ON public.scheduled_messages(board_id, status);

-- Analyze tables to update statistics (helps query planner)
ANALYZE public.sessions;
ANALYZE public.messages;
ANALYZE public.profiles;
ANALYZE public.analytics_events;
ANALYZE public.scheduled_messages;
ANALYZE public.saved_designs;
ANALYZE public.boards;
