# DECIMAL TUITION — SPEC FILE 11 — Data Model & Implementation Mapping

> Conceptual-to-tables mapping for the whole Tuition domain. Follows Decimal house rules
> (see `_context.md` §5): `id uuid PK default gen_random_uuid()`, snake_case, `school_id`
> scoping column on every tenant table, `created_at`, `updated_at` trigger, `is_active`,
> `is_published`, RLS boilerplate. Next migration numbers start at **028**.

## 1. Curriculum spine (shared reference data)

| Table | Purpose | Key columns |
|---|---|---|
| `curriculums` | CBC / 8-4-4 / IGCSE etc. | id, name, code (e.g. `cbc`), level (junior/senior), is_active |
| `curriculum_subjects` | subjects per curriculum | curriculums_id, name, code, strand_count |
| `curriculum_strands` | strand / sub-strand hierarchy | curriculum_subject_id, name, parent_id (NULL=root strand), order |

- Reuses `schools.education_level`, existing `subjects` where a school teaches them, but ties tuition content to a curriculum for benchmarking.
- Implementation notes: seed CBC strands for core KS subjects from the CBC doc in later migration; `curriculum_outcome` text on strands (learning outcomes).

## 2. Programme core (the heart of Tuition)

```
programmes
  id, school_id (publisher root owner)  -- publisher school, even for network programmes
  creator_user_id, owner_staff_id
  title, slug, type (course|revision|remedial|exam_prep|club|sports|music|drama|debate|
                     science|technology|competition|leadership|holiday|custom)
  subject_id (nullable → subjects or curriculum_subjects), grade_id, curriculum_id
  description, learning_outcomes jsonb (array of strings), prerequisites text
  duration_weeks int, difficulty (beginner|intermediate|advanced)
  visibility (private|school|classes|students|schools|network|public)
  cover_url, rating_avg numeric, rating_count int, students_count int (denormalized)
  status (draft|published|archived), is_active, published_at
  created_at, updated_at
```

```
programme_modules
  id, programme_id, school_id, title, description, position int, is_active

programme_lessons
  id, module_id, programme_id, school_id, title, summary, content_type
      (text|video|audio|document|presentation|embed|link|mixed)
  body jsonb (paragraphs, media embeds), duration_min int
  is_preview boolean (available before enrol), position int, status (draft|published)
  created_at, updated_at
```

```
lessons_resources
  id, lesson_id, school_id, resource_type (video|pdf|document|audio|image|presentation|link|embed)
  title, url, file_path, mime_type, file_size bigint, caption_url, transcript
  created_by, created_at

programme_instructors
  programme_id, staff_id, role (lead|assistant)  -- PK(programme_id, staff_id)

programme_cohorts
  id, programme_id, school_id, name (e.g. "Form 1A 2026"), class_id nullable,
  created_by, created_at

programme_enrolments
  id, programme_id
  student_id, school_id, cohort_id nullable, status (invited|active|completed|dropped)
  enrolled_by, enrolled_at, progress_pct int default 0, completed_at, created_at

lesson_progress (per student per lesson)
  id, lesson_id, programme_id, student_id, school_id, status (in_progress|completed)
  progress_pct, time_spent_sec, last_position_sec (video), completed_at, updated_at

programme_reviews
  id, programme_id, school_id (of the reviewer), student_id NOT NULL (the enrolled student reviewing)
  rating int CHECK (rating BETWEEN 1 AND 5), review text, created_at, updated_at
  UNIQUE(programme_id, student_id)  -- partial unique index → one review per (programme_id, student_id)
  -- App + RLS: only an enrolee whose enrolment status is active or completed may review.
  -- RLS boilerplate: rows scoped to the reviewer's own school (school_id).
```

## 3. Assignments

```
assignments
  id, programme_id, module_id, school_id, created_by
  title, instructions (body), due_at timestamptz, open_at timestamptz
  points int, status (draft|open|grading|closed)
  allow_late boolean, late_penalty_pct int, min_words int nullable, attachments jsonb

submissions
  id, assignment_id, student_id, school_id
  body text nullable, files jsonb (path, name, size, mime)
  status (none|draft|submitted|late|graded)  -- none not stored, default draft
  submitted_at, grade int nullable, feedback text nullable, graded_by, graded_at
  UNIQUE(assignment_id, student_id)
```

## 4. Assessments (tuition layer — separate from school `exams`)

```
assessments
  id, programme_id nullable, module_id nullable, school_id, created_by
  title, description, grade_id, subject_id, curriculum_id, duration_min int, total_marks int
  instructions text, attempt_limit int default 1, shuffle_questions boolean
  grader (auto|manual|hybrid), result_visibility (immediately|after_close|manual)
  availability (date_window: open_at/close_at timestamptz)
  status (draft|scheduled|open|closed|published_results)
  publisher (school|network), adopted_from assessment_id nullable, is_adopted boolean

assessment_sections
  id, assessment_id, school_id, title, position int, total_marks int

questions
  id, school_id, created_by
  question_type (mcq|multi_select|true_false|short_answer|structured|essay|practical)
  stem text (question body), options jsonb [{id,text,is_correct}], correct_answers jsonb
  marks int, difficulty (beginner|intermediate|advanced), curriculum_strand_id nullable
  subject_id, grade_id, topic text, strand text (search tags)
  explanation text, usage_count int

assessment_questions (bridge)
  assessment_id, section_id, question_id, position int, marks int   -- PK(assessment_id, question_id)

assessment_attempts
  id, assessment_id, student_id, school_id, status (not_started|in_progress|submitted|graded)
  attempt_no int NOT NULL  -- 1-based, serial per (assessment_id, student_id)
  started_at, submitted_at, score int, max_score int, grade text nullable
  answers jsonb (autosave: [{question_id, answer, flag}]), time_taken_sec, flags jsonb
  -- Partial unique index: enforces a single attempt ONLY when assessment.attempt_limit = 1.
  CREATE UNIQUE INDEX ON assessment_attempts (assessment_id, student_id) WHERE attempt_no = 1;
  -- App-level lock: only one live in_progress attempt per (assessment_id, student_id).
  -- attempt_limit = 0 (unlimited) or > 1 → multiple attempts allowed; attempt_no grows by 1.
  -- Starting a new attempt: no live in_progress row exists; attempt_no = (existing attempts count) + 1.

assessment_results (derived on grading)
  computed per attempt: per-question right/wrong/blank, per-strand %, topics; stored
  question_results jsonb in a `assessment_attempt_details` table for analysis.
```

## 5. Live classes

```
live_classes
  id, programme_id, school_id, created_by (teacher staff_id)
  title, description, starts_at, ends_at, recurring (once|daily|weekly)
  provider text default 'decimal'  -- settled default: Decimal replay + chat (not a third-party room)
  meeting_url nullable  -- optional external embed (Google Meet / Zoom)
  recording_url nullable  -- stores the Decimal replay after the class ends
  capacity, status (scheduled|live|ended|cancelled)
  attendance_count, join_links jsonb (per provider)

live_class_attendees
  id, live_class_id, programme_enrolment_id, student_id, school_id, joined_at, left_at
```

## 6. Activities & events

```
activities
  id, school_id, created_by, name, type (sports|music|drama|club|debate|competition|event)
  description, venue, starts_at, ends_at, capacity, status
      (draft|registrations|in_progress|results|completed|cancelled)
  cover_url, leaderboard jsonb (derived), schedule jsonb

activity_registrations
  activity_id, student_id, school_id, team_id nullable, status (pending|approved|participated|withdrawn), registered_at

activity_teams      (for sports/leagues)
  id, activity_id, school_id, name, captain_student_id, created_at

activity_matches    (fixtures & results)
  id, activity_id, home_team_id, away_team_id, venue, scheduled_at, home_score, away_score
  status (scheduled|finished|walkover|cancelled)
```

## 7. Network layer (aggregate + moderation)

```
network_publications
  id, publisher_school_id, title, type (programme|assessment|activity)
  ref_type, ref_id (programme_id/assessment_id/activity_id), visibility (network)
  status (pending|approved|rejected|published), moderated_by, moderated_at
  adoption_count int

network_adoptions
  id, network_publication_id, school_id, ref_id (the adopted copy), adopted_by, adopted_at

network_benchmarks
  id, assessment_id, school_id, metric_type (avg|percentile|participation|per_strand)
  value numeric, sample_size int, created_at   -- aggregated rows written by cron/service-role

-- PII RULE: benchmarks and network results NEVER store student-level data outside the
-- owning school. Cross-school visibility is strictly aggregate (avg, percentile, sample).
```

Per-strand aggregation derived from `assessment_attempt_details` + `curriculum_strands` (anonymous via `school_id` grouping).

## 8. Student identity linking

```
tuition_student_users (bridge: students ↔ auth users)
  student_id uuid PK refs students, user_id uuid NOT NULL refs auth.users, school_id
  created_at
-- For students who log in directly (or via parent_user_id on students table).
-- The tuition layout resolves the student view via this table OR students.parent_user_id.
```

## 9. Progress analytics (aggregate)

```
tuition_enrolment_daily_activity (optional analytics rollup)
  id, school_id, programme_id, student_id, activity_date, minutes_active, lessons_completed
-- Fed by a cron; powers Progress streaks + teacher/school Analytics without heavy queries.
```

## 10. Screen → entity mapping summary

| Screen family | Reads | Writes |
|---|---|---|
| Explore / Browse | programmes, subjects, curriculum, rating; network_publications | enrol |
| Programme detail | programmes, programme_modules, programme_lessons, instructors, reviews(programme_reviews), related | enrol/save |
| My Learning | programme_enrolments, lesson_progress, assignments, assessments | — |
| Learning player | programme_lessons, lessons_resources, lesson_progress, notes | lesson_progress, notes |
| Assignments | assignments, submissions | submissions |
| Assessment take | assessments, assessment_sections, questions | assessment_attempts |
| Result/review | attempts, details, strands | — |
| Teacher dashboard | programmes, enrolments, progress, assignments, assessments | — |
| Programme builder | programmes, programme_modules, programme_lessons, lessons_resources | all programme objects + publish |
| Question bank | questions | questions |
| Assessment builder | questions, assessment_sections | assessments, bridge |
| Student manager | enrolments, progress, assessments, activities | teacher notes (teacher_student_notes) |
| Teacher analytics | progress rollups, attempts, submissions | — |
| School admin | aggregated enrolments/engagement/assessments | adopt, approve activities |
| Network | publications, adoptions, benchmarks | adopt, moderate |
| Profile | profiles, students, staff, programmes, achievements | — |
| Notifications | notifications (existing) | emits (existing events) |
| Search | programmes, programme_lessons, teachers, assessments, activities, resources | — |

## 11. RLS summary (new)

| Table class | Policy shape |
|---|---|
| programmes/programme_modules/programme_lessons/lessons_resources | members read (own school + network/public + is_preview); teacher+principal manage; publisher school for network share |
| enrolments/progress/attempts/submissions | student owns own rows; teacher/principal read class rows; NEVER cross-school (except aggregate) |
| questions | teacher read/write own school; usable by school assessments |
| network_publications/adoptions | publisher school manage; all schools read published network items |
| network_benchmarks | all member schools read aggregate; no student-level |

## 12. MVP vs later implementation order

- **028**: curriculum spine + programmes + programme_modules + programme_lessons + lessons_resources + enrolments + lesson_progress (+ RLS).
- **029**: assignments + submissions.
- **030**: questions + assessments + sections + bridge + attempts + grading.
- **031**: activities + registrations + teams + matches.
- **032**: student-user bridge, notes, reviews.
- **033**: network_publications + adoptions + benchmarks.
- **034**: analytics rollups + notifications wiring + feature flag `decimal_tuition` + plans.features.tuition.

(Numbers illustrative; each migration idempotent, sequential from current 027.)