-- Migration 038: School lifecycle — add 'rejected' to school_status
--
-- src/app/(platform)/super-admin/schools/page.tsx offers a "Rejected" status
-- in its dropdown (line 52) and calls updateSchool(..., { status: "rejected" })
-- on the Reject button (line 468), but `school_status` (001:10) only ever
-- contained pending/approved/active/suspended/archived. The write failed at the
-- enum, and because /api/admin/update-school logged the error and still
-- returned { ok: true }, the UI showed a success toast for a school that was
-- never actually rejected.
--
-- The route is also fixed to validate the status and return 500 on a DB error.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumname = 'school_status' AND enumlabel = 'rejected') THEN
    ALTER TYPE school_status ADD VALUE 'rejected';
  END IF;
END $$;

-- Guard against the same class of bug: any status the app can send must be a
-- member of the enum.
DO $$
DECLARE
  missing text;
BEGIN
  SELECT string_agg(s, ', ')
  INTO missing
  FROM unnest(ARRAY['pending','approved','active','rejected','suspended','archived']) AS s
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_enum e
    WHERE e.enumname = 'school_status' AND e.enumlabel = s
  );

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'school_status is missing: %', missing;
  END IF;
END $$;