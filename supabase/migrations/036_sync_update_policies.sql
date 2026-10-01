-- Migration 036: Sync — allow UPDATE on attendance and exam results
--
-- The offline sync engine resolves conflicts by updating the server row
-- (src/lib/services/sync.ts: client-wins update, and resolveConflict for both
-- attendance and marks). But the only policies on attendance_records are
-- `for select` and `for insert` (001:434, 001:437), and exam_results only has
-- a `for all` policy limited to teacher/principal/super_admin membership
-- (002:65). Every conflict-resolution write was therefore rejected by RLS in
-- production, while the unit tests passed because they mock Supabase.
--
-- briefing §16.5 explicitly forbids silent last-write-wins on attendance,
-- marks, fees and student records, so these paths must actually function.
--
-- Both policies are school-scoped and role-scoped. Note the writes in the sync
-- service additionally re-assert school_id / exams.school_id in application
-- code, because the row id originates from the client.

-- ============================================================
-- ATTENDANCE RECORDS
-- ============================================================

DROP POLICY IF EXISTS "Attendance: teachers can amend" ON attendance_records;

CREATE POLICY "Attendance: teachers can amend"
  ON attendance_records
  FOR UPDATE
  USING (
    school_id IN (
      SELECT sm.school_id FROM school_members sm
      WHERE sm.user_id = auth.uid()
        AND sm.role IN ('teacher', 'principal', 'super_admin')
        AND sm.is_active = true
    )
    OR is_super_admin()
  )
  WITH CHECK (
    school_id IN (SELECT get_user_school_ids())
    OR is_super_admin()
  );

-- ============================================================
-- EXAM RESULTS
-- ============================================================
--
-- exam_results has no school_id; tenancy runs through exams.school_id. The
-- existing `for all` policy already covers UPDATE for teacher/principal/
-- super_admin, so only the platform-admin escape hatch needs widening — a
-- pure platform admin holds no school_members row and is excluded by the
-- membership subquery above.

DROP POLICY IF EXISTS "Exam Results: teachers can record" ON exam_results;

CREATE POLICY "Exam Results: teachers can record"
  ON exam_results
  FOR ALL
  USING (
    exam_id IN (
      SELECT e.id FROM exams e
      WHERE e.school_id IN (
        SELECT sm.school_id FROM school_members sm
        WHERE sm.user_id = auth.uid()
          AND sm.role IN ('teacher', 'principal', 'super_admin')
          AND sm.is_active = true
      )
    )
    OR is_super_admin()
  )
  WITH CHECK (
    exam_id IN (
      SELECT e.id FROM exams e
      WHERE e.school_id IN (SELECT get_user_school_ids())
    )
    OR is_super_admin()
  );