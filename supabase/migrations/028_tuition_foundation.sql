-- Migration 028: Decimal Tuition — Foundation schema
-- Data-model source: docs/tuition/11-data-model.md (settled names, rls boilerplate).

-- ============================================================
-- 1. CURRICULUM SPINE (reference data, school-shared)
-- ============================================================

CREATE TABLE curriculums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,            -- 'cbc', '844', 'igcse'
  level text NOT NULL DEFAULT 'junior',  -- junior | senior
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE curriculum_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_id uuid NOT NULL REFERENCES curriculums(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  strand_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(curriculum_id, name)
);

CREATE TABLE curriculum_strands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  curriculum_subject_id uuid NOT NULL REFERENCES curriculum_subjects(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES curriculum_strands(id) ON DELETE CASCADE, -- NULL = root strand
  sort_order integer NOT NULL DEFAULT 0,
  outcome text,                          -- learning outcome text
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(curriculum_subject_id, name, parent_id)
);

CREATE INDEX idx_curriculum_subjects ON curriculum_subjects(curriculum_id);
CREATE INDEX idx_curriculum_strands ON curriculum_strands(curriculum_subject_id);

-- ============================================================
-- 2. PROGRAMME CORE
-- ============================================================

CREATE TABLE programmes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  creator_user_id uuid REFERENCES auth.users(id),
  owner_staff_id uuid REFERENCES staff(id),
  title text NOT NULL,
  slug text,
  type text NOT NULL DEFAULT 'course',   -- course|revision|remedial|exam_prep|club|sports|music|drama|debate|science|technology|competition|leadership|holiday|custom
  subject_id uuid REFERENCES subjects(id),
  grade_id uuid REFERENCES grades(id),
  curriculum_id uuid REFERENCES curriculums(id),
  description text,
  learning_outcomes jsonb NOT NULL DEFAULT '[]',
  prerequisites text,
  duration_weeks integer NOT NULL DEFAULT 4,
  difficulty text NOT NULL DEFAULT 'beginner', -- beginner|intermediate|advanced
  visibility text NOT NULL DEFAULT 'school',   -- private|school|classes|students|schools|network|public
  cover_url text,
  rating_avg numeric NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  students_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',  -- draft|published|archived
  is_active boolean NOT NULL DEFAULT true,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_programmes_school ON programmes(school_id);
CREATE INDEX idx_programmes_status ON programmes(status);
CREATE INDEX idx_programmes_visibility ON programmes(visibility);

CREATE TABLE programme_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_programme_modules_programme ON programme_modules(programme_id);

CREATE TABLE programme_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES programme_modules(id) ON DELETE CASCADE,
  programme_id uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text,
  content_type text NOT NULL DEFAULT 'text', -- text|video|audio|document|presentation|embed|link|mixed
  body jsonb NOT NULL DEFAULT '[]',
  duration_min integer NOT NULL DEFAULT 10,
  is_preview boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',   -- draft|published
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_programme_lessons_programme ON programme_lessons(programme_id);
CREATE INDEX idx_programme_lessons_module ON programme_lessons(module_id);

CREATE TABLE lessons_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES programme_lessons(id) ON DELETE CASCADE, -- NULL = library asset
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  resource_type text NOT NULL,             -- video|pdf|document|audio|image|presentation|link|embed
  title text NOT NULL,
  url text,
  file_path text,                          -- storage path
  mime_type text,
  file_size bigint,
  caption_url text,
  transcript text,
  folder text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lessons_resources_lesson ON lessons_resources(lesson_id);
CREATE INDEX idx_lessons_resources_school ON lessons_resources(school_id);

CREATE TABLE programme_instructors (
  programme_id uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  position text NOT NULL DEFAULT 'lead',   -- lead|assistant
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (programme_id, staff_id)
);

CREATE TABLE programme_cohorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  class_id uuid REFERENCES classes(id),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE programme_enrolments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  cohort_id uuid REFERENCES programme_cohorts(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',   -- invited|active|completed|dropped
  enrolled_by uuid REFERENCES auth.users(id),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  progress_pct integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(programme_id, student_id)
);

CREATE INDEX idx_programme_enrolments_student ON programme_enrolments(student_id);
CREATE INDEX idx_programme_enrolments_school ON programme_enrolments(school_id);

CREATE TABLE lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES programme_lessons(id) ON DELETE CASCADE,
  programme_id uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress', -- locked|available|in_progress|completed
  progress_pct integer NOT NULL DEFAULT 0,
  time_spent_sec integer NOT NULL DEFAULT 0,
  last_position_sec integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, student_id)
);

CREATE INDEX idx_lesson_progress_student ON lesson_progress(student_id);
CREATE INDEX idx_lesson_progress_programme ON lesson_progress(programme_id);

CREATE TABLE programme_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_programme_reviews_once ON programme_reviews(programme_id, student_id);

-- ============================================================
-- 3. STUDENT / USER IDENTITY BRIDGE
-- ============================================================

CREATE TABLE tuition_student_users (
  student_id uuid PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, school_id)
);

CREATE INDEX idx_tuition_student_users_user ON tuition_student_users(user_id);

-- ============================================================
-- 4. ASSIGNMENTS
-- ============================================================

CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  module_id uuid REFERENCES programme_modules(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  title text NOT NULL,
  instructions text,
  due_at timestamptz,
  open_at timestamptz,
  points integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',   -- draft|open|grading|closed
  allow_late boolean NOT NULL DEFAULT false,
  late_penalty_pct integer NOT NULL DEFAULT 5,
  min_words integer,
  attachments jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignments_programme ON assignments(programme_id);

CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  body text,
  files jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'submitted', -- draft|submitted|late|graded
  submitted_at timestamptz,
  grade integer,
  feedback text,
  graded_by uuid REFERENCES auth.users(id),
  graded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);

-- ============================================================
-- 5. ASSESSMENTS (tuition layer — separate from school exams)
-- ============================================================

CREATE TABLE assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid REFERENCES programmes(id) ON DELETE CASCADE,
  module_id uuid REFERENCES programme_modules(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  title text NOT NULL,
  description text,
  grade_id uuid REFERENCES grades(id),
  subject_id uuid REFERENCES subjects(id),
  curriculum_id uuid REFERENCES curriculums(id),
  duration_min integer NOT NULL DEFAULT 30,
  total_marks integer NOT NULL DEFAULT 20,
  instructions text,
  attempt_limit integer NOT NULL DEFAULT 1,   -- 1 = single, 0 = unlimited
  shuffle_questions boolean NOT NULL DEFAULT false,
  grader text NOT NULL DEFAULT 'auto',        -- auto|manual|hybrid
  result_visibility text NOT NULL DEFAULT 'immediately', -- immediately|after_close|manual
  open_at timestamptz,
  close_at timestamptz,
  status text NOT NULL DEFAULT 'draft',       -- draft|scheduled|open|closed|published_results
  publisher text NOT NULL DEFAULT 'school',   -- school|network
  adopted_from uuid REFERENCES assessments(id) ON DELETE SET NULL,
  is_adopted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessments_school ON assessments(school_id);
CREATE INDEX idx_assessments_programme ON assessments(programme_id);

CREATE TABLE assessment_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  total_marks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_sections_assessment ON assessment_sections(assessment_id);

CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  question_type text NOT NULL,               -- mcq|multi_select|true_false|short_answer|structured|essay|practical
  stem text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',       -- [{id,text,is_correct}]
  correct_answers jsonb NOT NULL DEFAULT '[]',
  marks integer NOT NULL DEFAULT 1,
  difficulty text NOT NULL DEFAULT 'beginner', -- beginner|intermediate|advanced
  curriculum_strand_id uuid REFERENCES curriculum_strands(id) ON DELETE SET NULL,
  subject_id uuid REFERENCES subjects(id),
  grade_id uuid REFERENCES grades(id),
  topic text,
  strand text,
  explanation text,
  usage_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_school ON questions(school_id);
CREATE INDEX idx_questions_type ON questions(question_type);

CREATE TABLE assessment_questions (
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  section_id uuid REFERENCES assessment_sections(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  marks integer NOT NULL DEFAULT 1,
  PRIMARY KEY (assessment_id, question_id)
);

CREATE INDEX idx_assessment_questions_assessment ON assessment_questions(assessment_id);

CREATE TABLE assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  attempt_no integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'not_started', -- not_started|in_progress|submitted|graded
  started_at timestamptz,
  submitted_at timestamptz,
  score integer,
  max_score integer,
  grade text,
  answers jsonb NOT NULL DEFAULT '[]',        -- autosave: [{question_id, answer, flagged}]
  flags jsonb NOT NULL DEFAULT '[]',
  time_taken_sec integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assessment_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX idx_assessment_attempts_student ON assessment_attempts(student_id);
CREATE UNIQUE INDEX idx_assessment_attempts_single ON assessment_attempts(assessment_id, student_id) WHERE attempt_no = 1;

CREATE TABLE assessment_attempt_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  correct boolean NOT NULL DEFAULT false,
  is_blank boolean NOT NULL DEFAULT false,
  marks_awarded integer NOT NULL DEFAULT 0,
  question_results jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_attempt_details_attempt ON assessment_attempt_details(attempt_id);

-- ============================================================
-- 6. LIVE CLASSES
-- ============================================================

CREATE TABLE live_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid REFERENCES programmes(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  title text NOT NULL,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  recurring text NOT NULL DEFAULT 'once',     -- once|daily|weekly
  provider text NOT NULL DEFAULT 'decimal',   -- decimal (replay+chat); external meet/zoom via meeting_url
  meeting_url text,
  recording_url text,
  capacity integer,
  status text NOT NULL DEFAULT 'scheduled',   -- scheduled|live|ended|cancelled
  attendance_count integer NOT NULL DEFAULT 0,
  join_links jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_live_classes_school ON live_classes(school_id);
CREATE INDEX idx_live_classes_starts ON live_classes(starts_at);

CREATE TABLE live_class_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_class_id uuid NOT NULL REFERENCES live_classes(id) ON DELETE CASCADE,
  programme_enrolment_id uuid REFERENCES programme_enrolments(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  joined_at timestamptz,
  left_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_live_class_attendees_class ON live_class_attendees(live_class_id);

-- ============================================================
-- 7. ACTIVITIES & EVENTS
-- ============================================================

CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'club',          -- sports|music|drama|club|debate|competition|event
  description text,
  venue text,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer,
  status text NOT NULL DEFAULT 'draft',       -- draft|registrations|in_progress|results|completed|cancelled
  cover_url text,
  leaderboard jsonb NOT NULL DEFAULT '[]',
  schedule jsonb NOT NULL DEFAULT '[]',
  is_network boolean NOT NULL DEFAULT false,  -- network-hosted activity (e.g. league)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_school ON activities(school_id);
CREATE INDEX idx_activities_type ON activities(type);

CREATE TABLE activity_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  team_id uuid,
  status text NOT NULL DEFAULT 'approved',    -- pending|approved|participated|withdrawn
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, activity_id)
);

CREATE TABLE activity_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  captain_student_id uuid REFERENCES students(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_teams_activity ON activity_teams(activity_id);

CREATE TABLE activity_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  home_team_id uuid REFERENCES activity_teams(id) ON DELETE CASCADE,
  away_team_id uuid REFERENCES activity_teams(id) ON DELETE CASCADE,
  venue text,
  scheduled_at timestamptz,
  home_score integer,
  away_score integer,
  status text NOT NULL DEFAULT 'scheduled',   -- scheduled|finished|walkover|cancelled
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_matches_activity ON activity_matches(activity_id);

-- ============================================================
-- 8. NETWORK LAYER (aggregate + moderation)
-- ============================================================

CREATE TABLE network_publications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL,                        -- programme|assessment|activity
  ref_type text NOT NULL,
  ref_id uuid NOT NULL,
  visibility text NOT NULL DEFAULT 'network',
  status text NOT NULL DEFAULT 'pending',    -- pending|approved|rejected|published
  moderated_by uuid REFERENCES auth.users(id),
  moderated_at timestamptz,
  adoption_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_network_publications_status ON network_publications(status);

CREATE TABLE network_adoptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  network_publication_id uuid NOT NULL REFERENCES network_publications(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  ref_id uuid,                              -- the adopted copy (programme/assessment/activity)
  adopted_by uuid REFERENCES auth.users(id),
  adopted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(network_publication_id, school_id)
);

CREATE TABLE network_benchmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  metric_type text NOT NULL,                -- avg|percentile|participation|per_strand
  value numeric,
  sample_size integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_network_benchmarks_assessment ON network_benchmarks(assessment_id);

-- ============================================================
-- 9. ANALYTICS ROLLUP (progress aggregation)
-- ============================================================

CREATE TABLE tuition_enrolment_daily_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  programme_id uuid NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  activity_date date NOT NULL,
  minutes_active integer NOT NULL DEFAULT 0,
  lessons_completed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(programme_id, student_id, activity_date)
);

-- ============================================================
-- 10. RLS POLICIES
-- ============================================================

ALTER TABLE curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_strands ENABLE ROW LEVEL SECURITY;
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE programme_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE programme_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE programme_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE programme_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE programme_enrolments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE programme_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuition_student_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempt_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_class_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_adoptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuition_enrolment_daily_activity ENABLE ROW LEVEL SECURITY;

-- Curriculum spine: public read within the app (reference data)
CREATE POLICY "Curriculum: read" ON curriculums FOR SELECT USING (true);
CREATE POLICY "Curriculum subjects: read" ON curriculum_subjects FOR SELECT USING (true);
CREATE POLICY "Curriculum strands: read" ON curriculum_strands FOR SELECT USING (true);

-- Content tables: members of a school read own school; super_admin reads all.
-- All copy the house boilerplate verbatim (never get_user_school_ids() in a
-- school_members policy — recursion).
CREATE POLICY "Programmes: members read" ON programmes FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Programmes: staff manage" ON programmes FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Programme modules: members read" ON programme_modules FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Programme modules: staff manage" ON programme_modules FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Lessons: members read" ON programme_lessons FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Lessons: staff manage" ON programme_lessons FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Resources: members read" ON lessons_resources FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Resources: staff manage" ON lessons_resources FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Instructors: members read" ON programme_instructors FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Instructors: staff manage" ON programme_instructors FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Cohorts: members read" ON programme_cohorts FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Cohorts: staff manage" ON programme_cohorts FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Enrolments: members read" ON programme_enrolments FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Enrolments: staff manage" ON programme_enrolments FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Lesson progress: members read" ON lesson_progress FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Lesson progress: staff manage" ON lesson_progress FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Reviews: members read" ON programme_reviews FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Reviews: principals manage" ON programme_reviews FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin') AND sm.is_active = true)
);
CREATE POLICY "Student bridge: own rows" ON tuition_student_users FOR SELECT USING (user_id = auth.uid() OR school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Assignments: members read" ON assignments FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Assignments: staff manage" ON assignments FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Submissions: members read" ON submissions FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Submissions: staff manage" ON submissions FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Assessments: members read" ON assessments FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Assessments: staff manage" ON assessments FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Assessment sections: members read" ON assessment_sections FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Assessment sections: staff manage" ON assessment_sections FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Questions: members read" ON questions FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Questions: staff manage" ON questions FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Assessment questions: members read" ON assessment_questions FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Assessment questions: staff manage" ON assessment_questions FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Attempts: members read" ON assessment_attempts FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Attempts: staff manage" ON assessment_attempts FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Attempt details: members read" ON assessment_attempt_details FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Attempt details: staff manage" ON assessment_attempt_details FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Live classes: members read" ON live_classes FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Live classes: staff manage" ON live_classes FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Live attendees: members read" ON live_class_attendees FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Live attendees: staff manage" ON live_class_attendees FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Activities: members read" ON activities FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Activities: staff manage" ON activities FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Registrations: members read" ON activity_registrations FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Registrations: staff manage" ON activity_registrations FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Teams: members read" ON activity_teams FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Teams: staff manage" ON activity_teams FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Matches: members read" ON activity_matches FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Matches: staff manage" ON activity_matches FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin','teacher','timetable_manager') AND sm.is_active = true)
);
CREATE POLICY "Publications: members read" ON network_publications FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Publications: principals manage" ON network_publications FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin') AND sm.is_active = true)
);
CREATE POLICY "Adoptions: members read" ON network_adoptions FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Adoptions: principals manage" ON network_adoptions FOR ALL USING (
  school_id IN (SELECT sm.school_id FROM school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('principal','super_admin') AND sm.is_active = true)
);
CREATE POLICY "Benchmarks: members read" ON network_benchmarks FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Benchmarks: service write" ON network_benchmarks FOR INSERT WITH CHECK (is_super_admin());
CREATE POLICY "Activity rollup: members read" ON tuition_enrolment_daily_activity FOR SELECT USING (school_id IN (SELECT get_user_school_ids()) OR is_super_admin());
CREATE POLICY "Activity rollup: service write" ON tuition_enrolment_daily_activity FOR INSERT WITH CHECK (is_super_admin());

-- ============================================================
-- 10b. STUDENT IDENTITY POLICIES
--
-- Tuition students are NOT school_members (they have no member_role), so the
-- "members read" policies above never match them. These policies grant
-- students read access to their school's published content plus write access
-- to their own interaction rows (enrolments, progress, attempts, submissions,
-- attendees, registrations, reviews). Identity = tuition_student_users.
-- ============================================================

-- Programmes: students only ever see published, school-visible programmes.
CREATE POLICY "Programmes: students read" ON programmes FOR SELECT
USING (
  school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND status = 'published'
  AND visibility IN ('public', 'school')
  AND is_active = true
);

CREATE POLICY "Programme modules: students read" ON programme_modules FOR SELECT
USING (
  school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND is_active = true
  AND EXISTS (
    SELECT 1 FROM programmes p
    WHERE p.id = programme_modules.programme_id AND p.status = 'published'
      AND p.visibility IN ('public', 'school')
  )
);

CREATE POLICY "Lessons: students read" ON programme_lessons FOR SELECT
USING (
  school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND status = 'published'
  AND EXISTS (
    SELECT 1 FROM programmes p
    WHERE p.id = programme_lessons.programme_id AND p.status = 'published'
      AND p.visibility IN ('public', 'school')
  )
);

CREATE POLICY "Resources: students read" ON lessons_resources FOR SELECT
USING (
  school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM programme_lessons l JOIN programmes p ON p.id = l.programme_id
    WHERE l.id = lessons_resources.lesson_id AND l.status = 'published' AND p.status = 'published'
      AND p.visibility IN ('public', 'school')
  )
);

CREATE POLICY "Instructors: students read" ON programme_instructors FOR SELECT
USING (
  school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM programmes p
    WHERE p.id = programme_instructors.programme_id AND p.status = 'published'
      AND p.visibility IN ('public', 'school')
  )
);

-- Enrolments: a student sees and manages only their own records.
CREATE POLICY "Enrolments: students own" ON programme_enrolments FOR SELECT
USING (student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()));

CREATE POLICY "Enrolments: students join" ON programme_enrolments FOR INSERT
WITH CHECK (
  student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND status IN ('active', 'invited')
);

CREATE POLICY "Enrolments: students update" ON programme_enrolments FOR UPDATE
USING (student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()))
WITH CHECK (student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()));

-- Lesson progress: a student updates only their own rows.
CREATE POLICY "Lesson progress: students own" ON lesson_progress FOR SELECT
USING (student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()));

CREATE POLICY "Lesson progress: students write" ON lesson_progress FOR INSERT
WITH CHECK (
  student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
);

CREATE POLICY "Lesson progress: students update" ON lesson_progress FOR UPDATE
USING (student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()))
WITH CHECK (student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()));

-- Reviews: students review programmes they've been assessed on (own rows only).
CREATE POLICY "Reviews: students own" ON programme_reviews FOR SELECT
USING (student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()));

CREATE POLICY "Reviews: students write" ON programme_reviews FOR INSERT
WITH CHECK (
  student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
);

-- Assessments: students see only live (scheduled/open/results) school or network assessments.
CREATE POLICY "Assessments: students read" ON assessments FOR SELECT
USING (
  school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND status IN ('scheduled', 'open', 'published_results')
);

-- Assignments mirror assessments; students see open/live ones against published programmes.
CREATE POLICY "Assignments: students read" ON assignments FOR SELECT
USING (
  school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND status IN ('open', 'grading', 'closed')
  AND EXISTS (SELECT 1 FROM programmes p WHERE p.id = assignments.programme_id AND p.status = 'published')
);

-- Submissions: a student writes only their own work.
CREATE POLICY "Submissions: students own" ON submissions FOR SELECT
USING (student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()));

CREATE POLICY "Submissions: students write" ON submissions FOR INSERT
WITH CHECK (
  student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
);

CREATE POLICY "Submissions: students update" ON submissions FOR UPDATE
USING (student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()))
WITH CHECK (student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()));

-- Sections, questions and assessment-question links are read through live assessments.
CREATE POLICY "Assessment sections: students read" ON assessment_sections FOR SELECT
USING (
  school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM assessments a WHERE a.id = assessment_sections.assessment_id AND a.status IN ('scheduled', 'open', 'published_results'))
);

CREATE POLICY "Questions: students read" ON questions FOR SELECT
USING (
  school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM assessment_questions aq JOIN assessments a ON a.id = aq.assessment_id
    WHERE aq.question_id = questions.id AND a.school_id = questions.school_id
      AND a.status IN ('scheduled', 'open', 'published_results')
  )
);

CREATE POLICY "Assessment questions: students read" ON assessment_questions FOR SELECT
USING (
  school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND EXISTS (SELECT 1 FROM assessments a WHERE a.id = assessment_questions.assessment_id AND a.status IN ('scheduled', 'open', 'published_results'))
);

-- Attempts: a student manages only their own attempts (own-row write; grading
-- happens server-side and through the "staff manage" policy above).
CREATE POLICY "Attempts: students own" ON assessment_attempts FOR SELECT
USING (student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()));

CREATE POLICY "Attempts: students write" ON assessment_attempts FOR INSERT
WITH CHECK (
  student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND status IN ('not_started', 'in_progress')
);

CREATE POLICY "Attempts: students update" ON assessment_attempts FOR UPDATE
USING (student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()))
WITH CHECK (
  student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND status IN ('in_progress', 'submitted')
);

CREATE POLICY "Attempt details: students own" ON assessment_attempt_details FOR SELECT
USING (student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()));

CREATE POLICY "Attempt details: students write" ON assessment_attempt_details FOR INSERT
WITH CHECK (
  student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
);

-- Live classes: students see scheduled/live/ended records of published programmes.
CREATE POLICY "Live classes: students read" ON live_classes FOR SELECT
USING (
  school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND status IN ('scheduled', 'live', 'ended')
);

CREATE POLICY "Live attendees: students own" ON live_class_attendees FOR SELECT
USING (student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()));

CREATE POLICY "Live attendees: students join" ON live_class_attendees FOR INSERT
WITH CHECK (
  student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
);

-- Activities: students see joined activities that are open.
CREATE POLICY "Activities: students read" ON activities FOR SELECT
USING (
  school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND status IN ('registrations', 'in_progress', 'results', 'completed')
);

CREATE POLICY "Registrations: students own" ON activity_registrations FOR SELECT
USING (student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()));

CREATE POLICY "Registrations: students join" ON activity_registrations FOR INSERT
WITH CHECK (
  student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
  AND school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid())
);

CREATE POLICY "Registrations: students update" ON activity_registrations FOR UPDATE
USING (student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()))
WITH CHECK (student_id IN (SELECT ts.student_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()));

CREATE POLICY "Teams: students read" ON activity_teams FOR SELECT
USING (school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()));

CREATE POLICY "Matches: students read" ON activity_matches FOR SELECT
USING (school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()));

-- Network: students see their school's published benchmark corner.
CREATE POLICY "Benchmarks: students read" ON network_benchmarks FOR SELECT
USING (school_id IN (SELECT ts.school_id FROM tuition_student_users ts WHERE ts.user_id = auth.uid()));

-- ============================================================
-- 11. RBAC — TUITION PERMISSIONS
-- ============================================================

INSERT INTO permissions (resource, action, description) VALUES
  ('tuition_programme', 'read', 'View tuition programmes'),
  ('tuition_programme', 'create', 'Create tuition programmes'),
  ('tuition_programme', 'update', 'Edit tuition programmes'),
  ('tuition_programme', 'delete', 'Delete tuition programmes'),
  ('tuition_programme', 'publish', 'Publish tuition programmes'),
  ('tuition_programme', 'enrol', 'Enrol students into programmes'),
  ('tuition_programme', 'grade', 'Grade programme work'),
  ('tuition_lesson', 'read', 'View tuition lessons'),
  ('tuition_lesson', 'create', 'Create tuition lessons'),
  ('tuition_lesson', 'update', 'Edit tuition lessons'),
  ('tuition_lesson', 'delete', 'Delete tuition lessons'),
  ('tuition_lesson', 'publish', 'Publish tuition lessons'),
  ('tuition_lesson', 'enrol', 'Manage lessons'),
  ('tuition_lesson', 'grade', 'Grade lesson work'),
  ('tuition_assessment', 'read', 'View assessments and results'),
  ('tuition_assessment', 'create', 'Create assessments and assignments'),
  ('tuition_assessment', 'update', 'Edit assessments and assignments'),
  ('tuition_assessment', 'delete', 'Delete assessments and assignments'),
  ('tuition_assessment', 'publish', 'Publish assessments and assignments'),
  ('tuition_assessment', 'enrol', 'Manage assessment participation'),
  ('tuition_assessment', 'grade', 'Grade attempts and submissions'),
  ('tuition_activity', 'read', 'View activities and events'),
  ('tuition_activity', 'create', 'Create activities and events'),
  ('tuition_activity', 'update', 'Edit activities and events'),
  ('tuition_activity', 'delete', 'Delete activities and events'),
  ('tuition_activity', 'publish', 'Publish activities and events'),
  ('tuition_activity', 'enrol', 'Register participants'),
  ('tuition_activity', 'grade', 'Record activity results'),
  ('tuition_live', 'read', 'View live classes'),
  ('tuition_live', 'create', 'Create live classes'),
  ('tuition_live', 'update', 'Edit live classes'),
  ('tuition_live', 'delete', 'Delete live classes'),
  ('tuition_live', 'publish', 'Publish live classes'),
  ('tuition_live', 'enrol', 'Manage attendees'),
  ('tuition_live', 'grade', 'Grade live session work'),
  ('tuition_network', 'read', 'View network content and benchmarks'),
  ('tuition_network', 'create', 'Publish to network'),
  ('tuition_network', 'update', 'Edit network publications'),
  ('tuition_network', 'delete', 'Remove network publications'),
  ('tuition_network', 'publish', 'Publish network content'),
  ('tuition_network', 'enrol', 'Participate in network content'),
  ('tuition_network', 'grade', 'Moderate network content'),
  ('tuition_content', 'read', 'View content library'),
  ('tuition_content', 'create', 'Upload content'),
  ('tuition_content', 'update', 'Edit content'),
  ('tuition_content', 'delete', 'Delete content'),
  ('tuition_content', 'publish', 'Publish content'),
  ('tuition_content', 'enrol', 'Assign content'),
  ('tuition_content', 'grade', 'Manage content library')
ON CONFLICT (resource, action) DO NOTHING;

-- Matches docs/tuition/12 Part 6.3 role matrix. super_admin is handled by
-- is_super_admin() in has_permission(), so it has no explicit rows here.

INSERT INTO role_permissions (role, permission_id)
SELECT 'principal', id FROM permissions WHERE resource LIKE 'tuition_%'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'teacher', id FROM permissions
WHERE (
  resource IN ('tuition_programme','tuition_lesson','tuition_activity','tuition_live')
  AND action IN ('read','create','update','publish','enrol')
) OR (
  resource = 'tuition_assessment' AND action IN ('read','create','update','publish','grade')
) OR (
  resource = 'tuition_network' AND action = 'read'
) OR (
  resource = 'tuition_content' AND action IN ('read','create','update','publish','delete')
)
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'timetable_manager', id FROM permissions
WHERE resource IN ('tuition_programme','tuition_lesson','tuition_assessment','tuition_activity','tuition_live','tuition_network','tuition_content')
  AND action = 'read'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'finance', id FROM permissions
WHERE resource IN ('tuition_programme','tuition_lesson','tuition_assessment','tuition_activity','tuition_live','tuition_network','tuition_content')
  AND action IN ('read')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'admissions_officer', id FROM permissions
WHERE resource IN ('tuition_programme','tuition_lesson','tuition_assessment','tuition_activity')
  AND action = 'read'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_id)
SELECT 'secretary', id FROM permissions
WHERE resource IN ('tuition_programme','tuition_lesson','tuition_assessment','tuition_activity')
  AND action = 'read'
ON CONFLICT DO NOTHING;

-- ============================================================
-- 12. FEATURE FLAG + PLAN FEATURES
-- ============================================================

INSERT INTO feature_flags (key, name, description, scope, is_enabled)
VALUES ('decimal_tuition', 'Tuition (Learn/Teach/Assess/Activities/Network)', 'Master switch for the Tuition product across all portals', 'school', true)
ON CONFLICT (key) DO NOTHING;

UPDATE plans SET features = features || '{"tuition": true}'::jsonb
WHERE slug IN ('starter', 'pro', 'enterprise');

-- ============================================================
-- 13. UPDATED_AT TRIGGERS
-- ============================================================

CREATE TRIGGER update_programmes_updated_at BEFORE UPDATE ON programmes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_programme_modules_updated_at BEFORE UPDATE ON programme_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_programme_lessons_updated_at BEFORE UPDATE ON programme_lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_lesson_progress_updated_at BEFORE UPDATE ON lesson_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_programme_reviews_updated_at BEFORE UPDATE ON programme_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_assessment_attempts_updated_at BEFORE UPDATE ON assessment_attempts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_live_classes_updated_at BEFORE UPDATE ON live_classes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_activity_teams_updated_at BEFORE UPDATE ON activity_teams FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_activity_matches_updated_at BEFORE UPDATE ON activity_matches FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_network_publications_updated_at BEFORE UPDATE ON network_publications FOR EACH ROW EXECUTE FUNCTION update_updated_at();