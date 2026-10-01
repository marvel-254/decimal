-- Migration 033: RBAC — core school permissions
--
-- Migration 010 created `permissions` / `role_permissions` and the
-- has_permission() function, but no core (non-tuition) rows were ever seeded —
-- only 028_tuition_foundation.sql inserted tuition_* permissions. Because
-- has_permission() returns false when no matching row exists, every
-- requirePermission() call for a core resource threw ForbiddenError for all
-- roles except platform admins (who bypass via is_super_admin()). That broke
-- /api/students, /api/student-accounts, /api/fee-structures and all
-- /api/billing/* routes, including recording a fee payment.
--
-- This migration seeds the core resource matrix and grants it per role.

-- ============================================================
-- 1. CORE PERMISSIONS
-- ============================================================

INSERT INTO permissions (resource, action, description) VALUES
  -- Students
  ('students', 'read', 'View student records'),
  ('students', 'create', 'Admit or register students'),
  ('students', 'update', 'Edit student records'),
  ('students', 'delete', 'Archive or delete student records'),
  ('students', 'manage', 'Full control over student records'),
  -- Staff
  ('staff', 'read', 'View staff records'),
  ('staff', 'create', 'Add staff members'),
  ('staff', 'update', 'Edit staff records and roles'),
  ('staff', 'delete', 'Remove staff members'),
  ('staff', 'manage', 'Full control over staff records'),
  -- Attendance
  ('attendance', 'read', 'View attendance records and reports'),
  ('attendance', 'create', 'Record attendance'),
  ('attendance', 'update', 'Amend recorded attendance'),
  ('attendance', 'delete', 'Delete attendance records'),
  -- Academics (terms, grades, classes, subjects)
  ('academics', 'read', 'View academic structure'),
  ('academics', 'create', 'Create academic structure entries'),
  ('academics', 'update', 'Edit academic structure entries'),
  ('academics', 'delete', 'Delete academic structure entries'),
  -- Examinations
  ('exams', 'read', 'View exams and results'),
  ('exams', 'create', 'Create exams and assessments'),
  ('exams', 'update', 'Edit exams and enter marks'),
  ('exams', 'delete', 'Delete exams and results'),
  ('exams', 'publish', 'Publish exam results'),
  ('exams', 'grade', 'Grade and grade-submit work'),
  -- Fees and billing
  ('fees', 'read', 'View fee structures and student balances'),
  ('fees', 'create', 'Create fee structures'),
  ('fees', 'update', 'Edit fee structures'),
  ('fees', 'delete', 'Delete fee structures'),
  ('billing', 'read', 'View invoices, payments and receipts'),
  ('billing', 'write', 'Record payments and issue invoices'),
  ('billing', 'manage', 'Manage school billing and subscriptions'),
  -- Admissions
  ('admissions', 'read', 'View applications and registrations'),
  ('admissions', 'create', 'Create applications and registrations'),
  ('admissions', 'update', 'Edit applications and registrations'),
  ('admissions', 'delete', 'Remove applications and registrations'),
  ('admissions', 'decide', 'Admit or reject applicants'),
  -- Communication
  ('communication', 'read', 'Read announcements and messages'),
  ('communication', 'create', 'Send announcements and messages'),
  ('communication', 'update', 'Edit sent announcements and messages'),
  ('communication', 'delete', 'Delete announcements and messages'),
  ('communication', 'publish', 'Publish announcements to the whole school'),
  -- Timetable
  ('timetable', 'read', 'View timetables'),
  ('timetable', 'create', 'Create timetable slots'),
  ('timetable', 'update', 'Edit timetable slots'),
  ('timetable', 'delete', 'Delete timetable slots'),
  ('timetable', 'publish', 'Publish or unpublish a timetable'),
  -- Reports
  ('reports', 'read', 'View reports and analytics'),
  ('reports', 'export', 'Export reports and data'),
  -- Documents
  ('documents', 'read', 'View documents'),
  ('documents', 'create', 'Upload documents'),
  ('documents', 'delete', 'Delete documents'),
  -- School settings and users
  ('settings', 'read', 'View school settings'),
  ('settings', 'update', 'Change school settings'),
  ('users', 'read', 'View school members'),
  ('users', 'create', 'Invite school members'),
  ('users', 'update', 'Change member roles'),
  ('users', 'delete', 'Remove school members'),
  ('users', 'manage', 'Full control over school members')
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================================
-- 2. ROLE GRANTS
-- ============================================================
--
-- super_admin is intentionally absent: has_permission() short-circuits on
-- is_super_admin(), matching the convention set in 028.
--
-- parent is intentionally absent: the parent portal is authorised by
-- parent_student_relationships inside each /api/parent/* route rather than by
-- role permissions, so granting core permissions to parents would widen the
-- surface beyond "their own children".

-- Principal: full control of the school.
INSERT INTO role_permissions (role, permission_id)
SELECT 'principal', id FROM permissions WHERE resource NOT LIKE 'tuition_%'
ON CONFLICT DO NOTHING;

-- Teacher: read the school, record their own attendance and marks.
INSERT INTO role_permissions (role, permission_id)
SELECT 'teacher', id FROM permissions
WHERE (resource = 'students' AND action = 'read')
   OR (resource = 'staff' AND action = 'read')
   OR (resource = 'attendance' AND action IN ('read', 'create', 'update'))
   OR (resource = 'academics' AND action = 'read')
   OR (resource = 'exams' AND action IN ('read', 'create', 'update', 'grade'))
   OR (resource = 'communication' AND action IN ('read', 'create'))
   OR (resource = 'timetable' AND action = 'read')
   OR (resource = 'reports' AND action = 'read')
   OR (resource = 'documents' AND action IN ('read', 'create'))
ON CONFLICT DO NOTHING;

-- Timetable manager: owns the timetable, read-only elsewhere.
INSERT INTO role_permissions (role, permission_id)
SELECT 'timetable_manager', id FROM permissions
WHERE (resource = 'timetable')
   OR (resource = 'academics' AND action = 'read')
   OR (resource IN ('students', 'staff') AND action = 'read')
ON CONFLICT DO NOTHING;

-- Finance / bursar: owns money, read-only on the records it bills against.
INSERT INTO role_permissions (role, permission_id)
SELECT 'finance', id FROM permissions
WHERE (resource = 'billing')
   OR (resource = 'fees')
   OR (resource = 'reports' AND action IN ('read', 'export'))
   OR (resource IN ('students', 'staff', 'academics') AND action = 'read')
   OR (resource = 'attendance' AND action = 'read')
   OR (resource = 'communication' AND action IN ('read', 'create'))
   OR (resource = 'documents' AND action IN ('read', 'create'))
ON CONFLICT DO NOTHING;

-- Admissions officer: owns applications and enrolment.
INSERT INTO role_permissions (role, permission_id)
SELECT 'admissions_officer', id FROM permissions
WHERE (resource = 'admissions')
   OR (resource = 'students' AND action IN ('read', 'create', 'update'))
   OR (resource = 'staff' AND action IN ('read', 'create', 'update'))
   OR (resource IN ('academics', 'timetable') AND action = 'read')
   OR (resource = 'communication' AND action IN ('read', 'create'))
   OR (resource = 'reports' AND action IN ('read', 'export'))
   OR (resource = 'documents' AND action IN ('read', 'create'))
ON CONFLICT DO NOTHING;

-- Secretary: day-to-day office and communication.
INSERT INTO role_permissions (role, permission_id)
SELECT 'secretary', id FROM permissions
WHERE (resource = 'communication')
   OR (resource = 'students' AND action IN ('read', 'create', 'update'))
   OR (resource = 'staff' AND action = 'read')
   OR (resource = 'admissions' AND action IN ('read', 'create', 'update'))
   OR (resource = 'documents')
   OR (resource IN ('academics', 'timetable', 'attendance') AND action = 'read')
   OR (resource = 'reports' AND action = 'read')
ON CONFLICT DO NOTHING;