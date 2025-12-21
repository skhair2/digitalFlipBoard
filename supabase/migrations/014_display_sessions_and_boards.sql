-- Display Sessions Table (for tracking active and historical display connections)
CREATE TABLE IF NOT EXISTS display_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_code TEXT UNIQUE NOT NULL,
  display_user_id UUID REFERENCES auth.users(id), -- Optional: if display is logged in
  board_id UUID REFERENCES boards(id), -- Optional: if display is tied to a persistent board
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add pairing_code to boards table to allow persistent boards to be paired
ALTER TABLE boards ADD COLUMN IF NOT EXISTS pairing_code TEXT;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE boards ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_display_sessions_code ON display_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_boards_pairing_code ON boards(pairing_code);

-- Enable RLS on display_sessions
ALTER TABLE display_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for display_sessions
CREATE POLICY "Users can view their own display sessions"
  ON display_sessions FOR SELECT
  USING (
    auth.uid() = display_user_id OR 
    EXISTS (
      SELECT 1 FROM boards 
      WHERE boards.id = display_sessions.board_id 
      AND boards.user_id = auth.uid()
    )
  );

-- Update boards policies to allow system to update pairing_code
-- (In a real app, we'd use a service role or specific function)
