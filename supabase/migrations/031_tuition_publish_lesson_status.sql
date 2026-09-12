-- Ensure published programmes have lesson.status='published' (required by student
-- RLS policies). Also harden any modules accidentally left inactive.
UPDATE programme_modules
SET is_active = true, updated_at = now()
WHERE programme_id IN (SELECT id FROM programmes WHERE status = 'published')
  AND is_active = false;

UPDATE programme_lessons
SET status = 'published', updated_at = now()
WHERE programme_id IN (SELECT id FROM programmes WHERE status = 'published')
  AND status != 'published';
