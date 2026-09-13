-- 2025-09-12: Add super_admin membership for admin@decimal.app
-- Required to access /super-admin/* routes in the platform
-- Note: school_id is NOT NULL in school_members, so we assign to existing school

BEGIN;

-- Add admin@decimal.app user as super_admin of the default/primary school
-- The user ID for admin@decimal.app must be fetched from auth.users
-- Using the slug to identify the school (or pick the first available)
INSERT INTO school_members (user_id, school_id, role, is_active)
SELECT 
    (SELECT id FROM auth.users WHERE email = 'admin@decimal.app' LIMIT 1),
    (SELECT id FROM schools ORDER BY created_at LIMIT 1),
    'super_admin',
    true
ON CONFLICT (user_id, school_id, role) DO NOTHING;

COMMIT;
