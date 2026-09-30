-- Migration 032: Platform-level super admin
--
-- PROBLEM THIS FIXES
-- ------------------
-- `is_super_admin()` (001_initial_schema.sql:370) was defined as "the caller
-- has a `super_admin` row in `school_members`". But `school_members.school_id`
-- is NOT NULL (001_initial_schema.sql:52), so the schema structurally cannot
-- represent a platform operator who is not a member of some school.
--
-- This is already the behaviour the app expects: `/super-admin/schools` lists
-- schools platform-wide, and the Enter School flow
-- (src/app/api/auth/set-active-school/route.ts) lets a super admin operate a
-- school they hold no membership in. The data model was simply behind the app.
--
-- The two previous `032_*.sql` files attempted to resolve this by inserting
-- `school_id = NULL`. Both were broken:
--   * 032_add_super_admin_membership.sql was not valid SQL at all
--     (`INSERT INTO t (cols)` followed by a bare `(SELECT ...)` with no
--     `SELECT` keyword), so it aborted mid-migration;
--   * it also violated the NOT NULL constraint on `school_members.school_id`.
-- They are replaced by this file.
--
-- WHAT THIS DOES
-- --------------
-- 1. Adds `profiles.is_platform_admin` — a platform-scoped admin flag that
--    requires no school membership.
-- 2. Redefines `is_super_admin()` to accept EITHER the new flag OR the legacy
--    per-school `super_admin` membership, so existing deployments and the
--    demo seed keep working untouched.
-- 3. Backfills the flag for anyone who already holds a `super_admin`
--    membership, so no admin loses access on deploy.
-- 4. Grants the flag to admin@decimal.app, idempotently.
--
-- DELIBERATELY NOT CHANGED
-- ------------------------
-- `get_user_school_ids()` is left returning memberships ONLY. RLS policies
-- overwhelmingly read `school_id in (get_user_school_ids()) OR
-- is_super_admin()` (87 call sites across the migration history), so the
-- `is_super_admin()` disjunct already grants platform admins access. Widening
-- `get_user_school_ids()` to "all schools" would multiply that blast radius
-- for no benefit.
--
-- ROLLBACK
-- --------
-- DROP TRIGGER guard_platform_admin_flag ON profiles;
-- DROP FUNCTION guard_platform_admin_flag_change() CASCADE;
-- ALTER TABLE profiles DROP COLUMN is_platform_admin;
-- -- then restore the original is_super_admin() from 001_initial_schema.sql:370


-- =============================================================================
-- 1. THE FLAG
-- =============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_platform_admin boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN profiles.is_platform_admin IS
  'Platform-scoped super admin. Grants access to /super-admin and bypasses '
  'school scoping in RLS via is_super_admin(). Requires NO school membership. '
  'Only mutable by an existing platform admin — see guard_platform_admin_flag.';


-- SECTION 2 -- the anti-escalation guard. It is DROPPED at the top of this
-- script and re-CREATED at the very bottom, because it would otherwise abort
-- the backfill and grant in sections 3 and 5: triggers fire regardless of role
-- (psql runs as postgres, which bypasses RLS but not triggers), and
-- is_super_admin() resolves auth.uid() to NULL outside a request, so the guard
-- would reject the very writes this migration needs to perform.

DROP TRIGGER IF EXISTS guard_platform_admin_flag ON profiles;


-- =============================================================================
-- 3. BACKFILL — don't lock out admins who already have access
-- =============================================================================
-- Anyone currently reaching /super-admin via a `super_admin` membership gets
-- the flag too, so this migration is a no-op for their access.

UPDATE profiles p
   SET is_platform_admin = true
  FROM school_members sm
 WHERE sm.user_id = p.id
   AND sm.role = 'super_admin'
   AND sm.is_active = true
   AND p.is_platform_admin = false;


-- =============================================================================
-- 4. THE FUNCTION
-- =============================================================================
-- Same signature as before so all 87 existing call sites keep working
-- unchanged. Accepts the new platform flag OR the legacy per-school role.

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1
      FROM profiles p
     WHERE p.id = auth.uid()
       AND p.is_platform_admin = true
  )
  OR EXISTS (
    SELECT 1
      FROM school_members sm
     WHERE sm.user_id = auth.uid()
       AND sm.role = 'super_admin'
       AND sm.is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER
   SET search_path = public, pg_temp;


-- =============================================================================
-- 5. GRANT TO THE BOOTSTRAP ADMIN
-- =============================================================================
-- Idempotent and safe on an empty database: if the auth user or their profile
-- row is absent, the subqueries yield NULL and nothing is inserted. Rerun
-- freely.

INSERT INTO profiles (id, full_name, is_platform_admin)
SELECT u.id, 'System Administrator', true
  FROM auth.users u
 WHERE u.email = 'admin@decimal.app'
   AND u.confirmed_at IS NOT NULL
ON CONFLICT (id) DO UPDATE
  SET is_platform_admin = true;


-- =============================================================================
-- 6. ANTI-ESCALATION GUARD  (read this before removing it)
-- =============================================================================
-- Created LAST, on purpose. See the note in section 2.
--
-- The existing policy
--
--   create policy "Profiles: users can update own" on profiles
--     for update using (id = auth.uid());                        -- 001:406
--
-- has no WITH CHECK, so it falls back to USING. That means a caller can
-- update ANY column of their own profile row — including a privileged flag.
-- A column-level REVOKE cannot fix this: in Postgres a table-level privilege
-- overrides any column-level revoke, so revoking UPDATE on this one column
-- would require dropping table-level UPDATE and re-granting every other
-- column individually.
--
-- So the flag is pinned by a BEFORE UPDATE trigger instead. A user may still
-- update their own profile freely; they just cannot flip this bit.

CREATE OR REPLACE FUNCTION guard_platform_admin_flag()
RETURNS trigger AS $$
BEGIN
  IF NEW.is_platform_admin IS DISTINCT FROM OLD.is_platform_admin THEN
    -- is_super_admin() is SECURITY DEFINER, so this reads profiles without
    -- recursing through RLS. During a BEFORE UPDATE the function sees the
    -- pre-update row under MVCC, which is the OLD value we want to compare.
    IF NOT is_super_admin() THEN
      RAISE EXCEPTION
        'is_platform_admin can only be changed by an existing platform admin';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER guard_platform_admin_flag
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION guard_platform_admin_flag();