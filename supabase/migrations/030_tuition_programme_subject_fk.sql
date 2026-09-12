-- Migration 030: tuition programmes.subject_id → curriculum_subjects
-- The curriculum subject picker feeds curriculum_subjects ids, but the FK
-- pointed at the legacy per-school subjects table (empty for tuition schools).
-- Re-point so programme.subject_id aligns with the tuition curriculum spine.

ALTER TABLE programmes
  DROP CONSTRAINT IF EXISTS programmes_subject_id_fkey,
  ADD CONSTRAINT programmes_subject_id_fkey
    FOREIGN KEY (subject_id) REFERENCES curriculum_subjects(id) ON DELETE SET NULL;