-- Add columns to track user signup and email verification status
-- This migration adds:
-- 1. welcome_email_sent - tracks if welcome email has been sent
-- 2. email_verified - tracks if email has been verified
-- 3. signup_method - tracks how user signed up (password, google_oauth, magic_link)
-- 4. created_at - tracks when profile was created

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS signup_method TEXT DEFAULT 'password' CHECK (signup_method IN ('password', 'google_oauth', 'magic_link')),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster queries on signup method and verification status
CREATE INDEX IF NOT EXISTS idx_profiles_signup_method ON profiles(signup_method);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_welcome_email_sent ON profiles(welcome_email_sent);

-- Add comment for documentation
COMMENT ON COLUMN profiles.welcome_email_sent IS 'Flag to track if welcome email has been sent to user';
COMMENT ON COLUMN profiles.email_verified IS 'Flag to track if user has verified their email address';
COMMENT ON COLUMN profiles.signup_method IS 'Method used for signup: password, google_oauth, or magic_link';
COMMENT ON COLUMN profiles.created_at IS 'Timestamp when user profile was created';
