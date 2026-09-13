-- 2025-09-12: Add super_admin role membership for admin@decimal.app
-- Required to access /super-admin/* routes in the platform
BEGIN;

INSERT INTO school_members (user_id, member_role, school_id, user_type)
SELECT 
    (SELECT id FROM auth.users WHERE email = 'admin@decimal.app' AND confirmed_at IS NOT NULL LIMIT 1),
    'super_admin',
    NULL,
    'staff'
ON CONFLICT DO NOTHING;

COMMIT;
