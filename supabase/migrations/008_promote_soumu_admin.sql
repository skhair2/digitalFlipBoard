-- Migration: Promote soumu.stud@gmail.com to admin
-- Date: November 29, 2025

-- Ensure admin_roles table exists before promotion
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'support', 'moderator')),
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    granted_by UUID REFERENCES auth.users(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_status ON admin_roles(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_roles_unique_active
    ON admin_roles (user_id, role)
    WHERE status = 'active';

-- Promote requested user
DO $$
DECLARE
    target_id uuid;
BEGIN
    SELECT id INTO target_id
    FROM auth.users
    WHERE email = 'soumu.stud@gmail.com'
    LIMIT 1;

    IF target_id IS NULL THEN
        RAISE NOTICE 'No auth.users entry found for soumu.stud@gmail.com. Skipping admin promotion.';
        RETURN;
    END IF;

    UPDATE profiles
    SET role = 'admin',
        updated_at = NOW()
    WHERE id = target_id;

    INSERT INTO admin_roles (user_id, role, permissions, granted_by, status)
    SELECT target_id,
           'admin',
           '["users:view_all","users:grant_admin","roles:manage","system:health","audit:view"]'::jsonb,
           target_id,
           'active'
    WHERE NOT EXISTS (
        SELECT 1 FROM admin_roles
        WHERE user_id = target_id
          AND role = 'admin'
          AND status = 'active'
    );

    INSERT INTO admin_activity_log (admin_id, action, target_user_id, details)
    VALUES (
        target_id,
        'promoted_to_admin_via_migration',
        target_id,
        json_build_object('email', 'soumu.stud@gmail.com')
    );
END $$;
