-- Add tier and board limits to profiles
ALTER TABLE public.profiles 
ADD COLUMN tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
ADD COLUMN max_boards INTEGER DEFAULT 1;

-- Update existing users to free tier
UPDATE public.profiles 
SET tier = 'free', max_boards = 1 
WHERE tier IS NULL;

-- Add sharing columns to sessions
ALTER TABLE public.sessions 
ADD COLUMN shared_users JSONB DEFAULT '[]'::jsonb;

-- Create index for shared users
CREATE INDEX idx_sessions_shared_users ON public.sessions USING GIN (shared_users);

-- Update RLS policies for shared access
CREATE POLICY "Users can view shared sessions"
  ON public.sessions FOR SELECT
  USING (
    is_active = TRUE AND 
    expires_at > NOW() AND
    (
      auth.uid() = creator_id OR 
      shared_users @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text))
    )
  );

CREATE POLICY "Users can update sessions they created or are shared with"
  ON public.sessions FOR UPDATE
  USING (
    auth.uid() = creator_id OR 
    shared_users @> jsonb_build_array(jsonb_build_object('user_id', auth.uid()::text, 'permission', 'edit'))
  );
