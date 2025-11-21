-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extended from Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  stripe_customer_id TEXT,
  premium_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Sessions table
CREATE TABLE public.sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_code TEXT UNIQUE NOT NULL,
  creator_id UUID REFERENCES auth.users(id),
  display_name TEXT DEFAULT 'My Display',
  is_active BOOLEAN DEFAULT TRUE,
  connected_controller_id UUID,
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  connection_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  
  CONSTRAINT session_code_format CHECK (session_code ~ '^[A-Z0-9]{6}$')
);

CREATE INDEX idx_sessions_code ON public.sessions(session_code);
CREATE INDEX idx_sessions_creator ON public.sessions(creator_id);
CREATE INDEX idx_sessions_active ON public.sessions(is_active) WHERE is_active = TRUE;

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active sessions by code" 
  ON public.sessions FOR SELECT 
  USING (is_active = TRUE AND expires_at > NOW());

CREATE POLICY "Authenticated users can create sessions" 
  ON public.sessions FOR INSERT 
  WITH CHECK (auth.uid() = creator_id OR creator_id IS NULL);

CREATE POLICY "Session creators can update their sessions" 
  ON public.sessions FOR UPDATE 
  USING (auth.uid() = creator_id OR creator_id IS NULL);

-- Messages table
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  animation_type TEXT DEFAULT 'flip',
  color_theme TEXT DEFAULT 'monochrome',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT message_length CHECK (LENGTH(content) <= 132),
  CONSTRAINT animation_type_valid CHECK (animation_type IN ('flip', 'fade', 'slide', 'wave', 'cascade', 'typewriter'))
);

CREATE INDEX idx_messages_session ON public.messages(session_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_sent_at ON public.messages(sent_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages for their sessions" 
  ON public.messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = messages.session_id 
      AND (sessions.creator_id = auth.uid() OR sessions.connected_controller_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages to paired sessions" 
  ON public.messages FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions 
      WHERE sessions.id = messages.session_id 
      AND sessions.is_active = TRUE 
      AND sessions.expires_at > NOW()
    )
  );

-- Mixpanel events table (for redundancy)
CREATE TABLE public.analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_name TEXT NOT NULL,
  properties JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_user ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_event ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_created ON public.analytics_events(created_at DESC);

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.sessions 
  WHERE expires_at < NOW() AND is_active = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Scheduled job (requires pg_cron extension)
-- Run cleanup daily at 3 AM
-- SELECT cron.schedule('clean-sessions', '0 3 * * *', 'SELECT clean_expired_sessions();');
