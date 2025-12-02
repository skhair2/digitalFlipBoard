-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_by UUID REFERENCES auth.users(id)
);

-- Insert default settings
INSERT INTO system_settings (key, value) VALUES
('maintenance_mode', '{"enabled": false, "message": "System is under maintenance. Please check back later."}'),
('global_announcement', '{"enabled": false, "message": "", "type": "info"}'),
('registration_open', '{"enabled": true}')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read settings (needed for app to know if maintenance mode is on)
CREATE POLICY "Everyone can read system settings" 
    ON system_settings FOR SELECT 
    USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update system settings" 
    ON system_settings FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
