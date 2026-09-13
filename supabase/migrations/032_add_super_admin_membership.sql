-- 2025-09-12 add super-admin membership for demo admin user
-- This allows login and full access to /super-admin/* routes
BEGIN;

-- Ensure the admin@decimal.app user has super_admin role in school_members
-- The user needs to be in the school_members table with member_role = 'super_admin'
-- and linked via user_id (the auth.users.id for the email)

-- Upsert the super_admin role - note: school_id can be null for super_admins
-- We need to link to the auth.users id for admin@decimal.app
-- Subquery finds the UUID of the user row for that email

INSERT INTO school_members (user_id, member_role, school_id)
SELECT 
    (SELECT id FROM auth.users WHERE email = 'admin@decimal.app' LIMIT 1),
    'super_admin',
    NULL
ON CONFLICT DO NOTHING;

-- Also add principal membership (needed for school management nav)
INSERT INTO school_members (user_id, member_role, school_id, user_type)
SELECT 
    (SELECT id FROM auth.users WHERE email = 'principal@decimal.app' LIMIT 1),
    'principal',
    (SELECT id FROM schools LIMIT 1),
    'staff'
ON CONFLICT DO NOTHING;

COMMIT;
