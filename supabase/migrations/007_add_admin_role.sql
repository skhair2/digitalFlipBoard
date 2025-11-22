-- Add role field to profiles table
-- Migration: 007_add_admin_role.sql
-- Date: November 22, 2025

-- Add role column to profiles table
ALTER TABLE profiles 
ADD COLUMN role VARCHAR(50) DEFAULT 'user' NOT NULL;

-- Add check constraint to ensure only valid roles
ALTER TABLE profiles
ADD CONSTRAINT valid_role CHECK (role IN ('user', 'admin'));

-- Create index for efficient role-based queries
CREATE INDEX idx_profiles_role ON profiles(role);

-- Add RLS policy for admin access
-- Admins can view all user profiles
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT id FROM auth.users WHERE email IN (
  SELECT email FROM profiles WHERE role = 'admin'
)));

-- Admins can update user tiers
CREATE POLICY "Admins can update subscription tier" ON profiles
FOR UPDATE
USING (auth.uid() IN (SELECT id FROM auth.users WHERE email IN (
  SELECT email FROM profiles WHERE role = 'admin'
)))
WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE email IN (
  SELECT email FROM profiles WHERE role = 'admin'
)));

-- Create audit log table for admin actions
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action VARCHAR(255) NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for audit logs
CREATE INDEX idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX idx_admin_activity_log_action ON admin_activity_log(action);

-- Enable RLS on audit logs
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON admin_activity_log
FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT id FROM auth.users WHERE email IN (
  SELECT email FROM profiles WHERE role = 'admin'
)));

-- Only admins can insert audit logs
CREATE POLICY "Admins can create audit logs" ON admin_activity_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE email IN (
  SELECT email FROM profiles WHERE role = 'admin'
)));

-- Create system stats table for caching analytics
CREATE TABLE IF NOT EXISTS admin_system_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_key VARCHAR(100) UNIQUE NOT NULL,
  stat_value JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for stats
CREATE INDEX idx_admin_system_stats_key ON admin_system_stats(stat_key);

-- Enable RLS on system stats (read-only for admins)
ALTER TABLE admin_system_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system stats" ON admin_system_stats
FOR SELECT
TO authenticated
USING (auth.uid() IN (SELECT id FROM auth.users WHERE email IN (
  SELECT email FROM profiles WHERE role = 'admin'
)));
