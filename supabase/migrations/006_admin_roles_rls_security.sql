-- Migration: Add RLS UPDATE policy for admin_roles table
-- Date: November 22, 2025
-- Description: Enforces that only admins can update role statuses
-- This prevents frontend bypass of authorization

-- Add UPDATE RLS policy for admin_roles table
-- Only users with admin role can update role statuses
CREATE POLICY "admins_can_update_roles_status"
  ON admin_roles
  FOR UPDATE
  USING (
    -- Only admins can update roles
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
      AND ar.role = 'admin'
      AND ar.status = 'active'
    )
  )
  WITH CHECK (
    -- Only admins can update, and cannot escalate privileges
    EXISTS (
      SELECT 1 FROM admin_roles ar
      WHERE ar.user_id = auth.uid()
      AND ar.role = 'admin'
      AND ar.status = 'active'
    )
  );

-- Add UNIQUE constraint to prevent duplicate active roles per user
ALTER TABLE admin_roles
ADD CONSTRAINT unique_active_admin_role
UNIQUE (user_id, role) WHERE status = 'active';

-- Add CHECK constraint for valid status values
ALTER TABLE admin_roles
ADD CONSTRAINT valid_status_values
CHECK (status IN ('active', 'inactive', 'suspended'));

-- Add INDEX on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_admin_roles_status
ON admin_roles(status);

-- Add INDEX on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id
ON admin_roles(user_id);
