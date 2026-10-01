-- Migration 037: Announcements — audience targeting
--
-- src/lib/services/announcement.ts reads and writes `target_audience`
-- (lines 24, 75, 99), src/app/api/parent/announcements/route.ts selects and
-- filters on it, and the principal announcements UI offers an audience
-- dropdown — but 001_initial_schema.sql only ever created `target_roles
-- member_role[]`. Every one of those code paths failed with
-- "column announcements.target_audience does not exist", which broke the
-- parent announcements feed outright.
--
-- `target_roles` is left in place: it is the member-role based variant and is
-- still declared by 001.

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS target_audience text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- The four audiences the principal UI offers (principal/announcements/page.tsx).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'announcements_target_audience_check'
  ) THEN
    ALTER TABLE announcements
      ADD CONSTRAINT announcements_target_audience_check
      CHECK (target_audience IN ('all', 'teachers', 'parents', 'staff'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_announcements_school_audience
  ON announcements(school_id, target_audience, is_published, created_at DESC);

-- mapAnnouncement falls back to created_at when updated_at is absent, so
-- backfill rather than leaving existing rows at the default now().
UPDATE announcements SET updated_at = created_at WHERE updated_at > created_at;

DROP TRIGGER IF EXISTS trg_announcements_updated_at ON announcements;

CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ENFORCE TARGETING IN RLS
-- ============================================================
--
-- Previously "Announcements: members can view" granted every school member
-- every announcement, so targeting was a cosmetic label rather than a
-- boundary. Re-scope so an announcement addressed to one audience is not
-- readable by the roles it excludes.
--
-- Staff-only and teacher-only announcements are for internal audiences; the
-- parent portal reads through the service role and filters by audience in the
-- API layer (api/parent/announcements), so members never see parent-only rows.

DROP POLICY IF EXISTS "Announcements: members can view" ON announcements;

CREATE POLICY "Announcements: members can view"
  ON announcements
  FOR SELECT
  USING (
    (
      school_id IN (SELECT get_user_school_ids())
      AND target_audience IN ('all', 'staff', 'teachers')
    )
    OR is_super_admin()
  );