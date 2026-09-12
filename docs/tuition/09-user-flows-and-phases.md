# DECIMAL TUITION — SPEC FILE 09 — User Flows, Responsive Rules, State Standards Round-up, MVP Cut & Delivery Phases

> Part 12/13/14 of the Tuition wireframe brief, condensed. Read with:
> `_context.md` (conventions, statuses, gating) · `02-information-architecture.md` (routes/nav)
> · `04-screen-inventory.md` (screen IDs + priorities) · `10-route-architecture.md` (implementation)
> · `11-data-model.md` (tables) · `03-design-system.md` (tokens/components/responsive).
>
> **Route truth = `02`/`04`. Screen-ID truth = `04`. Status truth = `_context.md` §7.**
> Every route below is exact and copy-paste-safe.

**Diagram legend.** Transitions use `-->`. Decisions use `<>` with branch labels `yes`/`no`
(when the label is vertical, follow the arrow). `[Action]` = user action. Bracketed text on an
edge is the event/cause. Exit states are the terminal boxes on the right.

---

## PART 1 — MASTER USER FLOWS

### Flow 1 — STUDENT first activation & full learning journey (signup → enrol → learn → assess → progress)

**Purpose.** Turn a new or returning school user into an enrolled, learning, assessed student —
the P0 spine that every other student flow extends.

```
(auth) login/signup --> (resolved by (tuition) layout)
                              |
              +---------------+----------------+
              v                                v
      (has student identity?)            (is member role?)
              | no                                     | (teacher/principal/etc.)
              v                                        v
     SYS-06 /tuition/onboarding            role-aware dispatch:
     welcome -> connect school ->           teacher -> /tuition/teacher
     choose grade -> interests -> goals      principal -> /tuition/school
              |                                    |
              v                                    +-> school: return later
     (grade + interests saved)                      (this flow continues below)
              |
              v
      STU-01 /tuition  (Home)
              |
   +----------+-----------+
   |                      |
   v                      v
 (has enrolments?)      Explore CTA
   | no                  |
   v                     v
 EmptyState "Explore"   STU-02 /tuition/explore
   |                    |   |    |
   |                    v   |    +-----> (trending section)
   |              (category rail / featured)
   |                    |
   +--------------------+
                        v
              STU-03 /tuition/explore?grade=&subject= (filtered browse + search)
                        |
                        v
              STU-04 /tuition/programmes/[id]
                        |
              +---------+----------+
              |         |          |
              v         v          v
        (preview)   [Enrol]      (save for later)
              |         | (POST /api/tuition/enrol)
              |         v
              |   <> (programme private / approval needed?) ->no-> (enrolment active)
              |         |   yes: enrolment stays invited (approval flow, teacher TCH-08)
              |         v
              |   toast "Enrolled" --> back to STU-04 with "Start learning" CTA
              |         |
              +---------+
                        v
              STU-05 /tuition/my-learning   (progress list for enrolments)
                        |
                        v
              STU-06 /tuition/learn/[programmeId]/[lessonId]
                        |   (lesson body/resources)   [Mark complete]  POST /api/tuition/lessons/[id]/complete
                        v
              <> (module finished?) -->no--->  [Next lesson] --> STU-06 (next [lid])
                        | yes
                        v
              <> (next module unlocked) --> auto-advance into module
                        |
                        <> (assignment attached?) --> yes -> STU-08 /tuition/assignments
                        |                                     |  open assignment
                        |                                     v
                        <> (assessment linked?) --> yes   STU-09 /tuition/assignments/[id]  (submit)
                        |                                     |  (draft -> submitted -> graded)
                        v
              STU-10 /tuition/assessments (upcoming/available/finished)
                        |
                        v
              STU-11 /tuition/assessments/[id]/instructions -> STU-12 [take] -> STU-13 result
                        |
                        v
              STU-18 /tuition/progress  (streak, subject progress, weak topics)
```

**Primary path (numbered).**
1. Auth (`(auth)` password or Google OAuth). The `(tuition)` layout resolves identity: a
   `students.parent_user_id` link, a `tuition_student_users` bridge row, or a member role.
2. If no student identity and not a member → **SYS-06** `/tuition/onboarding`.
3. SYS-06: welcome → connect/create school account → pick grade (`Grade 8` etc. via
   `schools.education_level` + curriculum level) → interests → goals → recommendation list.
4. Land on **STU-01** `/tuition`. Continue-strip offers in-progress lessons, or an
   `EmptyState` CTA "Explore programmes" → **STU-02**.
5. **STU-02** `/tuition/explore` — featured/recommended/trending + category rail.
6. **STU-03** `/tuition/explore?grade=&subject=` — filtered browse + search results.
7. **STU-04** `/tuition/programmes/[id]` — hero, curriculum tree, preview lessons, CTA.
8. `[Enrol]` → `POST /api/tuition/enrol` → `programme_enrolments` row (`status` for
   open programmes = `active`; private/approved-only programmes = `invited`).
9. **STU-05** `/tuition/my-learning` — enrolled programmes with progress bars.
10. **STU-06** `/tuition/learn/[programmeId]/[lessonId]` — lesson body + resources; `[Mark
    complete]` writes `lesson_progress` (`completed`) and bumps `progress_pct`.
11. Continue lesson chain inside modules; on module finish, next module unlocks.
12. When an **assignment** is attached → **STU-08**/**STU-09**.
13. When an **assessment** is linked → **STU-10→STU-11→STU-12→STU-13**.
14. **STU-18** `/tuition/progress` — streaks, per-subject %, weaknesses.

**Branches & alternate paths.**
- **Enrol from search:** Search overlay (SYS-02, `⌘K`) → programme row → **STU-04** → enrol.
- **Enrol from referral:** a `?ref=network_publication_id` or invite link resolves to the
  school's adopted copy → **STU-04** → enrol; enrolment records the adoption source so the
  Network can attribute participation for benchmarking.
- **Enrol from My Learning:** **STU-05** empty state CTA "Explore programmes" → STU-02.
- **Parent/teacher/principal student view:** role-aware dispatch at `/tuition` — this flow's
  "student" variant is only rendered for actual student identities; others get their own space.

**Exit states.** `active` enrolment on `/tuition/my-learning`; lesson `completed` progress;
assignment `submitted`; assessment attempt `graded` with a result; streak increment on STU-18.

**Edge cases.**
- **Duplicate enrol:** `programme_enrolments` is unique per (programme, student) → UI shows
  "You're already enrolled — Continue learning" (no error).
- **Private programme:** enrol leaves `invited`; student sees "Waiting for teacher approval"
  on STU-04; teacher approves in **TCH-08**.
- **No grade matches:** browse filters to grade but zero results → EmptyState "No programmes
  for Grade 8 yet" + "Request a programme" CTA (creates a network/teacher signal, not a ticket).
- **Offline enrol:** queued (`useOfflineMutation` / `sync.ts`), enrol completes on reconnect.
- **Broken lesson link** (deleted lesson): STU-06 shows EmptyState "Lesson no longer
  available" and offers "Go back to My Learning".
- **Referral from another school's private programme:** deny + explain (PII rule).

---

### Flow 2 — STUDENT daily learning loop

**Purpose.** The habit-loop: open Home, continue, complete, chain to assignment, handle an
assessment reminder — the highest-frequency student loop, and the one offline mode protects.

```
STU-01 /tuition
   |
   v
(Continue strip = next lesson per active enrolment)
   |
   v
STU-06 /tuition/learn/[programmeId]/[lessonId]
   |
   +-- [Mark complete] --> POST /api/tuition/lessons/[id]/complete
   |                          |
   v                          v
(lifestyle continue)      <> (assignment due today?) --> yes --> STU-08 /tuition/assignments
   |                          |                                        |
   |                          +-->(no)--> back to Home                  v
   |                          |                             STU-09 /tuition/assignments/[id]
   +-----> [Next lesson]      |                                        |
                             |                                        +-- [Submit] --> POST /api/tuition/assignments/[id]/submissions
                             |                                        v
                             |                                   (submission submitted/late)
                             |                                        |
                             +---<> (unfinished assessment reminder?) --yes--> STU-10 /tuition/assessments
                                                                                  |  (upcoming shows reminder banner)
                                                                                  v
                                                                         STU-11 instructions --> STU-12 take --> STU-13 result
                                                                                  |
                                                                                  v
                                                                         STU-01 Home (new streak)
```

**Primary path.**
1. STU-01 `/tuition` → "Continue learning" card picks the first `in_progress`/`available`
   lesson across active enrolments (or the latest `available` in the most recent one).
2. Open **STU-06** player; consume content; `[Mark complete]` → `lesson_progress`.
3. Completion banner offers `[Next lesson]` (same module) or "Back to Home".
4. Home re-renders: streak count, updated progress %, newly-listed assignments.

**Alternate paths.**
- **Reminder-first:** Student skips straight from Home to an assignment/assessment banner.
- **Streak-break restart:** continuation picks up exactly where `lesson_progress` left off
  (video `last_position_sec`, or `in_progress` lesson).

**Exit states.** Lesson `completed`; assignment `submitted`; assessment attempt `graded`;
streak incremented (`tuition_enrolment_daily_activity` rollup).

**Edge cases.**
- **Locked next lesson:** previous lesson incomplete → player blocks with Lock EmptyState
  "Complete Lesson N to unlock".
- **Day rollover mid-session:** streak logic keys off `activity_date` (local tz), not session.
- **Assignment already submitted:** STU-08 shows `graded`/`submitted` state; no double submit.
- **Offline continue:** player works from cache; completion queues and syncs later (Flow 14).

---

### Flow 3 — STUDENT assessment-taking flow (with auto-submit & retry)

**Purpose.** Exam-safe taking: instructions → confirm → timer/palette/flag/autosave → submit.
Hard guarantees: answers never lost on network failure; time-out always auto-submits.

```
STU-10 /tuition/assessments   (status open, try)
   |
   v
STU-11 /tuition/assessments/[id]/instructions
   |   (rules, duration, attempts left, auto-submit warning)
   |
   v
[Start assessment] --> POST /api/tuition/assessments/[id]/attempts  (status in_progress)
   |
   v
STU-12 /tuition/assessments/[id]/take
   |   full-screen, timer pinned, palette hidden until toggled
   |
   +-- [autosave] every 15s --> PUT attempt.answers jsonb (flagged)   <--run both on interval and on answer
   |
   +-- [Flag question] --> attempts.flags overlay (palette marker)
   |
   +-- [Pause] (blocked mid-question; pauses tracker only--timer keeps running if real-time limit)
   |
   +-- [Resume] (restore snapshot; reloads answers from server or IndexedDB)
   |
   +-- [Submit] --> POST submit
   |                 |
   |                 +--<> (still time? & all submitted?)       --no-->  (auto-submit path below)
   |                 |                                           |
   |                 +--<> (network failed?)                     v
   |                 |      | yes                           AssessmentTimer hits 0:
   |                 |      v                               client auto-sends submit;
   |                 |      (queue in IndexedDB; keep attempts in_progress;         retry with backoff 2s/5s/15s;
   |                 |        answers locally safe; toast "Saved offline")           on repeat failure keep local + prompt)
   |                 |      v                                                        |
   |                 |      (reconnect triggers sync -> submit)                      v
   |                 |                                                                POST submit (idempotent)
   |                 +--<> (submitted OK?) --> yes
   v                                        |-no--> retry with backoff 2s/5s/15s;
   (timeout mid-take)                              keep answers, NEVER navigate away
        |
        v
[Auto-submit banner "Time's up — submitting"]
        |
        v
POST submit (client auto)  -->  (graded? grader=auto? yes: score computed immediately)
        |
        v
STU-13 /tuition/assessments/[id]/result
        |   ScoreDial, per-question review, topic/strand analysis
        +-- [Review answers] -> expandable review (right/wrong/blank, explanation)
        |
        v
(result_visibility=after_close / manual -> (waiting screen; result delayed))
        |
        v
(Branch back) STU-10 'finished' tab  |  STU-18 progress  |  STU-01 home
```

**Primary path.**
1. STU-10 `/tuition/assessments` "available" tab → **STU-11** `/tuition/assessments/[id]/instructions`.
2. `[Start assessment]` → attempt created → **STU-12** `/tuition/assessments/[id]/take`.
3. Answer; autosave every 15s; palette toggling; flag questions of concern.
4. `[Submit]` at end → attempt `submitted`.
5. `grader=auto` → attempt `graded` instantly → **STU-13** result.
6. `grader=manual/hybrid` → result released per `result_visibility`.

**Auto-submit at time-out.** `AssessmentTimer` at 00:0x shows a warning (`role="status"` live
region); at `0` a client auto-submit fires. If auto-submit POST fails, the attempt stays
`in_progress` with its saved answers and the retry path resumes.

**Failed submission retry.** A submit POST that fails keeps the user on STU-12 (never navigates),
queues the attempt locally, retries with backoff `2s→5s→15s`, and only on persistent failure
shows "Saved on this device — will sync when you're back online", keeping answers in IndexedDB.

**Alternate paths.**
- **Pause/resume:** `[Pause]` only matters for a wall-clock window with real timer; answers and
  flags reload from server on resume (or from IndexedDB when offline). Resume restores position.
- **Attempt limit exhausted:** STU-10 disables the `[Take]` button; STU-11 shows "No attempts left".
- **Result withheld:** `result_visibility` = `after_close`/`manual` → STU-13 renders a
  "Results hidden — teacher will release them" waiting state.

**Exit states.** Attempt `graded`; result viewable; assessment moves to "finished" on STU-10.

**Edge cases.**
- **Mid-attempt network loss:** every answer still autosaves locally (offline queue) → resume
  restores full state including flags.
- **Tab close:** attempt is `in_progress` with persisted answers → next open shows "Resume
  attempt" on STU-10 instead of "Start".
- **ID collision on re-submit:** submit is idempotent (unique assessment_id+student_id per
  attempt limit) — retries cannot double-submit.
- **Manual-graded question mixed in auto assessment (hybrid):** auto score releases, manual
  rows show "pending" until graded in TCH-16.

---

### Flow 4 — TEACHER programme creation (builder 1–5, draft resume, publish validation)

**Purpose.** Fast, low-click path from scratch to a published programme with draft
autosave/resume at every step and a real validation gate at publish.

```
TCH-01 /tuition/teacher
   |
   +-- [Quick action: New Programme]  or  TCH-02 "no programmes" EmptyState CTA
   |
   v
TCH-02 /tuition/teacher/programmes  -->  "+ Create programme"  -->  TCH-03 /tuition/teacher/programmes/new?step=1
   |
   v
TCH-03 step=1 (Details)
   |   title, type, subject, grade, curriculum, difficulty, outcomes, cover
   |   [Save & continue]  |  [Save draft]  |  (autosave → creates programme draft)
   v
TCH-04 step=2 (Structure)
   |   module tree + lessons, reorder, durations
   |   <> (draft previously saved?) --> yes: show "Resume draft — step 2 of 5"
   v
TCH-05 step=3 (Content)
   |   per-lesson body + resources (from library or upload direct)
   v
TCH-06 step=4 (Access)
   |   visibility scopes: private / school / classes / students / schools / network / public
   |   (network scope disabled unless school enabled for network publishing — P1)
   v
TCH-07 step=5 (Review & Publish)
   |   validation checklist runs POST /api/tuition/programmes/[id]/publish
   |   |
   |   +--<> (validation fails?) --> yes --> red checklist rows (title/slug, >=1 module,
   |   |             |                          >=1 lesson with content, lessons published, access set)
   |   |             v                          [Fix] returns to failing step (draft preserved)
   |   |        (stay on step 5, fix inline where possible)
   |   +--<> (validation OK?) --> yes
   |                                 |
   |                                 v
   |                        [Publish] --> status published, visibility applies
   |                                 |
   |                                 [Notify enrollees] switch (optional)
   |                                 v
   |                        TCH-08 /tuition/teacher/programmes/[id]  (manage tabs)
   |
   +--> anytime: [Save draft] (outline) --> draft persisted, exit; resume from TCH-02 "Drafts" segment
```

**Primary path.**
1. TCH-01 quick action or TCH-02 EmptyState → **TCH-03** `?step=1`.
2. Enter details → autosave creates the `draft` programme → `[Save and continue]`.
3. **TCH-04** `?step=2`: build modules → nested lessons → reorder.
4. **TCH-05** `?step=3`: per-lesson body + resources.
5. **TCH-06** `?step=4`: visibility scope + preview lessons.
6. **TCH-07** `?step=5`: review → publish (validation gate) → **TCH-08** manage.
7. From TCH-08 tabs: overview / students (enrol) / content / assessments (create links) / results.

**Draft-save & resume.**
- Every step autosaves (live "Autosaved" chip, Geist Mono) and offers explicit `[Save draft]`.
- Leaving mid-wizard keeps the draft; TCH-02 shows a "Continue draft — step 2 of 5" card that
  deep-links to `?step=2`. State (which step, which fields) is captured server-side per draft.

**Publish-validation failure branch.**
- Publish validates title/slug, ≥1 module, ≥1 published lesson with content, and an access
  scope. Failures render as red checklist rows with `[Fix on step N]` → returns to the failing
  step with the draft intact. Nothing publishes partially.

**Exit states.** Programme `published` (or back to `draft`); programme visible to its scope;
TCH-08 manage shows enrolment and content status.

**Edge cases.**
- **Empty programme publish**: blocked by validation (explicit error row, not generic banner).
- **Duplicate title slug:** inline slug conflict error on step 1.
- **School subject missing in curriculum:** subject is optional on step 1; if the school hasn't
  mapped subjects, the selector falls back to `curriculum_subjects`.
- **Two teachers editing (rare):** ownership check on `PATCH`; second editor gets a stale-draft
  warning and can reload (no merge engine in MVP).
- **Cover upload fails:** cover optional; gradient `ProgrammeCover` fallback (initials) always exists.

---

### Flow 5 — TEACHER assignment flow (create → publish → submissions → grade → feedback)

**Purpose.** Assignment lifecycle end-to-end, with inline grading and feedback so a teacher
never leaves the submissions list to grade.

```
TCH-13 /tuition/teacher/assignments
   |
   +-- [New assignment] --> modal: programme, title, instructions, due_at, points, late rules
   |                          |
   |                          +-- [Save draft] --> status draft (hidden from students)
   |                          +-- [Publish]     --> status open (visible in STU-08)
   |                          +-----+           |   students submit
   |                                v           v
   |                        (open, submissions arrive)     STU-08/09 student side (Flow 1/2)
   |                                |
   |                                +------<> (due passed?) --> yes --> status grading (auto-close)
   |                                |                                        |
   |                                +-- teacher closes manually                  v
   |                                v                                    TCH-13 "grading" tab
   +--------------------------------+
                                    |  click submission row
                                    v
                          (inline review panel: submission body + files)
                                    |
   +--------------------------------+--------------------------------+
   |                                |                                |
   v                                v                                v
[right/wrong?]                [Grade number input]             [Feedback textarea]
   |                                |                                |
   +--------------------------------+--------------------------------+
                                    |
                                    v
                            [Save & mark graded]  -->  submission status graded
                                    |              |  (late still flagged if past due + allow_late)
                                    v             |
                          toast "Grade released"  |
                                    |             |
                                    v             v
                          TCH-13 "graded" tab (class mean, pending count) --> student STU-09 shows grade+feedback
```

**Primary path.**
1. Open TCH-13; `[New assignment]` modal → `[Publish]` → assignment `open`.
2. Students submit (STU-08/09). Submissions appear in TCH-13 with submission pills.
3. Select a row → inline panel; read body/files; `[Grade]` number + `[Feedback]` textarea.
4. `[Save & mark graded]` → submission `graded`, status “graded” tab, class mean KPI updates.
5. Student sees grade + feedback in **STU-09**.

**Alternate paths.**
- **Auto-close on due date:** assignment flips to `grading`; late submissions permitted only
  when `allow_late` (flagged `late`, penalty applied per `late_penalty_pct`).
- **Manual close:** teacher sets `closed`; submissions locked.
- **Bulk view:** teacher marks graded and moves to next submission without leaving the panel.

**Exit states.** Assignment `closed`; every submission `graded` or `late`; results visible.

**Edge cases.**
- **No submissions:** TCH-13 shows an EmptyState ("No submissions yet") and the open assignment
  can be `[Remind class]` (notification to enrolled students) or closed.
- **Duplicate file submission:** only latest allowed; earlier file replaced after confirm; the
  system keeps prior files during the confirm window (no data-loss path).
- **Late vs on-time:** pill distinguishes `submitted` vs `late`; late keeps penalty info visible.
- **Grading sync/offline:** grade writes queue like other mutations; student sees nothing until
  synced (grade is authoritative server-side).

---

### Flow 6 — TEACHER assessment flow (build from bank → schedule → monitor → grade → release → analyse)

**Purpose.** Question-bank-driven assessment factory: pick questions, schedule, publish,
monitor live attempts, auto/manual grade, release, and analyse — without leaving the workspace.

```
TCH-14 /tuition/teacher/assessments
   |
   +-- [New assessment] --> TCH-15 /tuition/teacher/assessments/new
   |                          |   step A: settings (title, grade/subject/curriculum, duration,
   |                          |            attempts, shuffle, availability window, grader,
   |                          |            result_visibility)
   |                          v
   |                     step B: sections + question picker (Sheet over TCH-17 question bank,
   |                            filters grade/subject/strand/difficulty/type, marks)
   |                          |
   |                          +-- [Import from question bank] adds assessment_questions bridge rows
   |                          |
   |                          +-- [Save draft] --> status draft
   |                          +-- [Publish]     --> status scheduled (or open if window active);
   |                          |                    students see it on STU-10
   |                          v
   |                  <> (grader = auto?) --> yes: MCQs/true-false/multi-select mark on submit
   |                          |                  (attempt -> graded, score stored)
   |                          |      no: manual/hybrid -> attempts land "submitted"
   |                          v
   +-----------------------------------+
                                       v
                            TCH-16 /tuition/teacher/assessments/[id]/results
                                       |   participation funnel, per-question bars, score dist,
                                       |   strand radar (Recharts)
   +-----------------------------------+-------------------------------+
   |                                                                   |
   v                                                                   v
(monitor attempts live)                                     (manual rows) [Grade] inline per attempt
   |                                                                   |
   +-------------------------------------------------------------------+
                                       |
                       <> (result_visibility = immediately/after_close/manual?)
                                       |
          +----------------------------+------------------------------+
          v                               v                            v
   immediately:                          after_close:                 manual:
   STU-13 on submit                     auto-release at close        [Release results] button in TCH-16
          |                               |                            |
          +-------------------------------+----------------------------+
                                       |
                                       v
                        results visible to students (STU-13)
                                       |
                                       v
                        TCH-16 analysis tabs -> per-strand %, weak topics,
                        export CSV -> (school principal may see SCH-09)
```

**Primary path.**
1. TCH-14 → `[New assessment]` → **TCH-15** builder.
2. Settings → sections → pick questions from the bank (Sheet) → assign marks.
3. `[Publish]` → `scheduled`/`open`; students see it in STU-10 and take it (Flow 3).
4. **TCH-16** `/tuition/teacher/assessments/[id]/results` — live monitoring (attempts, funnel).
5. Auto-grade objective questions on submit; manual structure/essay graded inline.
6. Release per `result_visibility`; analyse per-question/per-strand.

**Alternate paths.**
- **Publish to network (P1):** TCH-07-style switch "Submit to network" → `network_publications`
  pending → moderation (Flow 10). Disabled in MVP.
- **Shuffle:** `shuffle_questions` reshuffles per attempt (order stored in attempt).

**Exit states.** Assessment `closed` + `published_results`; attempts `graded`; student results
released; analysis exports.

**Edge cases.**
- **Zero questions selected:** publish blocked (validation error).
- **Duration longer than availability:** clamp to window on publish with inline warning.
- **Mid-attempt window close:** attempt `in_progress` allowed to finish; submit remains possible
  until auto-submit; no new starts after close.
- **Attempt limit = 1 with completed attempt:** STU-10 blocks `[Take]` with "attempted".
- **Question bank sparse:** empty picker shows EmptyState "No questions yet — go to Question
  Bank (TCH-17) to add your first MCQ" with deep link.

---

### Flow 7 — TEACHER content flow (upload → library → reuse → link)

**Purpose.** Upload once, reuse anywhere: assets live in the library and are *linked* into
lessons, never copied per-lesson (keeps storage lean in low-bandwidth Kenyan contexts).

```
TCH-09 /tuition/teacher/content
   |
   +-- [Upload] --> FileDropzone --> object goes to storage (supabase storage bucket)
   |                 asset row = lessons_resources with lesson_id NULL (library asset)
   |                 resource_type video|pdf|document|audio|image|presentation|link|embed
   |                 metadata: mime, size, transcript/captions for video
   |                 v
   |        TCH-09 list/folders (type filters, search, storage meter)
   |
   +-- [New folder] organise
   |
   +-- (use in lesson)  --> open programme builder step 3
   |                          |
   |                          v
   |                 TCH-05 (lesson pane) --> [Add from library] -->
   |                          |   link asset into this lesson (lesson_id set)
   |                          v
   |                 lesson resource row (shared, not copied)
   |
   +-- (manage/delete) --> TCH-10 /tuition/teacher/content/[id]  preview + replace + delete
                              (delete blocked while linked to a published lesson;
                               shows "Linked to 2 lessons" instead)
```

**Primary path.**
1. TCH-09 `/tuition/teacher/content` → `[Upload]` → FileDropzone → storage.
2. Asset appears in library (searchable, typed, metered).
3. Open any programme lesson editor; `[Add from library]` links the asset into that lesson.
4. Manage/replace/delete from library or TCH-10 detail.

**Exit states.** Uploaded asset in library; lesson resource linked; deleted-only-when-unlinked.

**Edge cases.**
- **Heavy video:** progress bar on upload; `file_size` recorded; recommend transcript.
- **Bad mime:** rejected with inline type help.
- **Delete while linked:** blocked; shows link count — teacher must unlink first.
- **Offline upload:** queued (PWA sync), asset created on reconnect.
- **Reuse across buildings** (same file in many lessons) = identical `url`/`file_path` link;
  storage bill reflects one copy.

---

### Flow 8 — SCHOOL ADOPTION flow (principal → adopt → assign → enrol → monitor → benchmark)

**Purpose.** How a principal adopts a programme/assessment (school's own or Network), assigns
teachers, bulk-enrols a class, and watches results — the chain that makes Network content useful.

```
SCH-01 /tuition/school  -->  ("Network" or "Programmes") 
   |
   v
SCH-11 /tuition/school/network   (network hub: programmes + assessments)
   |
   +---<> (browse school-scoped content?) --> yes --> SCH-02 /tuition/school/programmes
   |                                                  (adoption status per programme)
   |
   +-- [Browse network programmes] --> NET-03 view (read) --> programme detail
   |
   v
[browse assessments] --> SCH-08 /tuition/school/assessments/adopt
   |   (network assessments catalogue)
   |
   +-- [Adopt] --> network_adoptions row (ref_id = adopted copy) + toast "Adopted"
   |
   v
(assigned copy now owned by school)
   |
   +-- [Assign teacher] --> programme_instructors (role lead)  |  TCH teacher sees in My Programmes
   |
   v
SCH-06 /tuition/school/enrolments
   |   bulk enrol: pick class/grade/cohort --> create programme_enrolments (status active/invited)
   |   (or build cohort "Grade 8 Green 2026", reuse class_id)
   |
   v
SCH-01 dashboard --> monitor engagement/participation (KPIs, alert tiles)
   |
   v
SCH-07 /tuition/school/assessments --> participation --> SCH-09 /tuition/school/assessments/[id]
   |                                                    (results, class performance, manual release only if perms)
   |
   v
SCH-11/SCH-12 benchmark --> school mean vs network mean, percentile, per-strand (aggregated, anonymized)
```

**Primary path.**
1. SCH-01 `/tuition/school` → Network hub (**SCH-11**).
2. Browse network programmes/assessments (NET-03/NET-04 read views).
3. SCH-08 `/tuition/school/assessments/adopt` → `[Adopt]` → adopted copy.
4. Assign a teacher (programme_instructors) → appears on the teacher's TCH-02.
5. SCH-06 `/tuition/school/enrolments` bulk-enrol a class → enrolments created.
6. Monitor SCH-01; analyse SCH-07/SCH-09; benchmark SCH-11/SCH-12.

**Exit states.** Publication adopted; teacher assigned; cohort enrolled; results visible to
school; school appears in benchmark aggregates (own students only).

**Edge cases.**
- **Second adoption of same publication:** duplicate-protected → "Already adopted — Assign
  teacher" instead.
- **No teachers on Tuition yet:** assign step shows EmptyState + CTA "Invite a teacher".
- **Class is huge (e.g. 90):** bulk enrol paginates; progress in batches (no UI freeze).
- **Network benchmark privacy:** school peers never see a student's identity; only school-level
  aggregate (`school_id`-grouped rows in `network_benchmarks`).
- **Principal adopts but teacher is from another subject:** still allowed; principal reassigns
  later via SCH-04.

---

### Flow 9 — SCHOOL ACTIVITY flow (create/approve → registrations → teams → fixtures → results → awards)

**Purpose.** Co-curricular lifecycle for sports/music/drama/clubs — from a teacher's draft to
registrations, teams, fixtures and results/awards, with principal approval gates.

```
(teacher) TCH-20 /tuition/teacher/activities  --> [New activity] --> status draft
                                   |
                                   +-- [Submit for approval]
                                   v
SCH-10 /tuition/school/activities  (approval queue - principal)
                                   |
                      <> (approved?) --> no --> status cancelled (or back to draft w/ reason)
                                   | yes
                                   v
                            status registrations --> students see STU-16 /tuition/activities
                                   |                                |
                                   |                                v
                                   |                       STU-17 /tuition/activities/[id]
                                   |                            [Register] --> activity_registrations (pending)
                                   |                                |
                                   +<-----------------------------+
                                   v
                            <> (registrations closed by organiser?) --> yes --> status in_progress
                                   |                                       |
                                   +-- [Form teams] (sports/leagues):         v
                                   |     activity_teams + captain             activity_matches (fixtures)
                                   |                                          |  (home/away, venue, scheduled_at)
                                   |                                          v
                                   +-- [Enter results] ------------------> activity_matches finished (scores)
                                   |                                          |
                                   |                                          v
                                   +-- status results --> leaderboard jsonb derived   |
                                                                                       v
                                   +-- status completed --> [Award]                  (certificates/marks)
                                                                                       |
SCH-10 monitor (approve, schedule, results) <-----------------------------------------+
```

**Primary path.**
1. Teacher drafts an activity (TCH-20) and submits for approval.
2. Principal approves in SCH-10 → status `registrations`.
3. Students register in STU-16/17 → `activity_registrations` `pending`→`approved`.
4. Organiser forms teams (sports) → fixtures → results (`activity_matches`).
5. Status `results` → leaderboard → `completed` → awards.

**Exit states.** Activity `completed`; results recorded; leaderboard derived; awards/certificate
hooks available (P2).

**Edge cases.**
- **Approval rejected:** activity returns to `draft` with a reason shown to the teacher.
- **Capacity reached:** STU-17 disables register and shows "Full".
- **Walkover / cancelled match:** `activity_matches.status` handles `walkover|cancelled`.
- **Two students on same team + parent conflict:** team roster enforced by unique
  activity_registrations per student.
- **Activity without registrations:** organiser can extend registrations window rather than
  force `in_progress`.

---

### Flow 10 — NETWORK PUBLICATION flow (publish → moderation → adopt → participate → benchmark)

**Purpose.** A teacher/principal publishes an assessment (or programme) to the Network; it is
moderated, adopted by other schools, taken by their students, and yields aggregated benchmarks —
strictly anonymized beyond the owning school.

```
(teacher) TCH-15 publish assessment  -> (optional) [Submit to network]  (P1 gate)
   |                                    creates network_publications (type=assessment)
   v
NET-08 /tuition/network/moderation   (platform/network coordinator)
   |   status pending
   |
   <> (approve?) --> no --> rejected (+ reason to publisher), not visible to schools
   | yes
   v
status published --> visible across schools (NET-04/NET-05, SCH-08 adopt catalogue)
   |
   +-----------+-----------+--------------+-----------------+
   v           v           v              v                 v
SCH-08      NET-05      (other)       (own school)      (participation starts)
[Adopt]     adopt        adopt          participates
   |           |           |              |
   +-----------+-----------+--------------+ (adoptions counted -> adoption_count)
                             |
                             v
                students take assessment (Flow 3) in each adopting school
                             |
                             v
                results per owning school (SCH-09)  -- NEVER cross-school PII
                             |
                             v
                network_benchmarks rows (cron/service-role, aggregated by school_id)
                             |
                             v
                NET-06 /tuition/network/benchmarking
                             |   school avg vs network avg, percentile, participation,
                             |   per-strand, sample_size (READ-ONLY in MVP)
                             v
                NET-01 dashboard + NET-04/NET-05 '(insights)' tab
                             |
                             v
                [Export] or [insight copy] shared with schools (aggregated only)
```

**Primary path.**
1. Teacher/principal publishes to Network (P1; flag `school_feature_flags.network_publish`).
2. Moderation queue NET-08 → approve (or reject with reason).
3. Schools adopt via SCH-08/NET-05; `adoption_count` increments.
4. Students in adopting schools take the assessment (Flow 3).
5. Service-role/cron aggregates `network_benchmarks` (avg/percentile/participation/per_strand,
   `sample_size`).
6. NET-06 benchmarking dashboard (read-only in MVP) shows aggregate comparisons + insights.

**Exit states.** Publication `approved`→`published` (or `rejected`); adoptions recorded;
benchmarks populated; insights served.

**Edge cases.**
- **Duplicate publishing:** same assessment can't be submitted twice (unique ownership row);
  refine-and-resubmit reuses the row.
- **Moderation hold:** schools see neither the pending item nor its publisher content.
- **Publication withdrawn:** adopted copies remain usable at the school; fresh adoptions stop.
- **Privacy proof:** benchmarks only carry `school_id`-grouped aggregates; student rows never
  leave the owning school (enforced in policy + UI copy).
- **Zero sample:** benchmark cards show "Not enough participants yet" instead of a number
  (no misleading 0% percentiles).

---

### Flow 11 — PARENT read-only flow

**Purpose.** Passive visibility for parents: pick a linked child, view progress/assessments/
certificates, react to notifications, and contact the teacher — zero write access.

```
(auth) parent login --> (tuition) layout: role = parent --> /tuition student view (read-only)
   |
   v
(parent child switcher, mirroring existing platform pattern)
   |   children from parent_student_relationships
   v
<> (single child?) --> yes --> auto-select
   | no --> chooser first
   v
STU-01 /tuition  (Home read-only: continue strip, upcoming assessments)
   |
   +-- [Progress]   --> STU-18 /tuition/progress (streaks, subject %, weak topics)  READ-ONLY
   |
   +-- [Assessments]--> STU-10 /tuition/assessments --> STU-13 result (grades + review) READ-ONLY
   |
   +-- [Certificates]--> STU-20 /tuition/certificates (P2; placeholder in MVP) READ-ONLY
   |
   +-- [Notifications]--> SYS-03 /tuition/notifications (assessment released, grade posted, event)
   |
   +-- [Contact teacher]--> (existing parent-teacher contact / profile action) -->
   |                            TCH-08/TCH-12 side: teacher sees student note thread
   |
   +-- (switching active child updates every screen; URL stays, data reloads)
```

**Primary path.**
1. Parent logs in; tuition layout renders the student view for a linked child.
2. Child switcher selects the child.
3. Browse progress/assessments/certificates read-only.
4. Act on notifications (view result, view upcoming) and contact teacher.

**Alternate paths.**
- **Multiple children:** switcher (pills) overrides every student screen; context retained per tab.
- **No linked children yet:** relation missing → EmptyState "Ask the school office to link your
  child" (no data leaks).

**Exit states.** Read-only view of each volume; notifications marked read; teacher contact sent.

**Edge cases.**
- **Result withheld (manual release):** parent sees "awaiting release", not the raw score.
- **Child switch mid-view:** subsequent data always reloads to the selected child (no stale rows).
- **Parent at two schools:** school switcher header applies as usual; student view stays scoped.

---

### Flow 12 — FIRST-RUN WIZARD (SYS-06)

**Purpose.** One honest, short wizard (7 screens max) that gets a brand-new Tuition user to a
useful Home without a wall of choices.

```
SYS-06 /tuition/onboarding
   |
   v
(Welcome: "Tuition helps your school teach, learn and assess"  [Continue])
   |
   v
(Account: create or connect school / link existing Decimal account)  (skippable: join later)
   |   sets school context; roles resolve from membership
   v
(Role: "I am a Student / Parent / Teacher / Principal"; students continue here,
    member roles are routed to their space + onboarding ends)
   |
   v
(Student: Grade selection — CBC grade or Form/year; from curriculum level)
   |
   v
(Interests: subjects/topics chips — Math, Sciences, Languages, Tech, Sports, Arts)
   |
   v
(Goals: "What do you want?"  catch-up / stay ahead / exam prep / hobby)
   |
   v
(Recommendations: 3-6 programme cards matched to grade+interests  [Start learning])
   |
   v
STU-01 /tuition -- done flag on profile (wizard shows only once; re-runnable from settings)
```

**Primary path.** Welcome → account → role → grade → interests → goals → recommendations → Home.

**Exit states.** `onboarding_completed_at` set; Home has a recommended-programme strip;
role-routed users land in their space.

**Edge cases.**
- **Organization first (student already in a cohort):** grade pre-filled from `students.class_id`;
  wizard skips grade.
- **Skippable everywhere:** `[Skip]` at any step → still lands on Home; no dead ends.
- **Mid-wizard reload:** progress persisted per step (profile draft); resume where left off.
- **Zero matches:** recommendations EmptyState → "Explore the full catalogue" (STU-02).
- **Rerun:** SYS-05 `/tuition/settings` > Learning prefs → "Run onboarding again".

---

### Flow 13 — PRODUCT SWITCH (School Management ↔ Tuition)

**Purpose.** Instant, state-preserving product switching so a teacher/principal can hop between
running the school and teaching/analysing without friction.

```
[sidebar]  ◉ DECIMAL ▾ --> dropdown: School Management | Tuition
                                     |                     |
                                     v                     v
                           /dashboard              /tuition (role-aware)
                           (user's role portal root)      |
                                                          +--> teacher -> /tuition/teacher
                                                          +--> principal -> /tuition/school
                                                          +--> parent ->/tuition (student view)
                                                          +--> super_admin -> /tuition/network
   Rules (binding, from IA §2):
   - switching is PURE navigation: no logout, no school reset, no filter clear
   - active product also shown in topbar brand label
   - school switch in Header remains a full page reload (existing behavior)
   - tuition draft state survives: a half-built programme is server-side draft -- reappears
     regardless of how many times the user switches products
   - mobile: switcher renders as first item of the slide-over menu
```

**Exit states.** User is on the other product with the same school context and auth; tuition
drafts/enrolments untouched; active nav item updates; `aria-current` moves.

**Edge cases.**
- **User with no student identity:** `/tuition` still resolves by role (teacher/school/network),
  never 404s or bounces to an unskinned screen.
- **Product switch from a student-only route**: moving to School Management uses the member-role
  portal root; a pure student has no member portal — switcher shows only what they may access.
- **Feature gate toggled at switch time:** landing on `/tuition` re-checks `isFeatureEnabled`
  + `requireBillingPlanFeature` at layout; gating UI covers the whole space (not per route).

---

### Flow 14 — OFFLINE flow (PWA: cache lessons → queue submissions → sync)

**Purpose.** Keep learning alive on dodgy networks and expensive data — a first-class concern in
Kenya (schools with 2G/3G coverage, shared hotspots, data bundles). Reuses existing indexDB +
serwist infrastructure.

```
online:  STU-06 lesson page visited
   |
   +-- SW (serwist, NetworkFirst) caches: lesson body, resources, covers, captions;
   |      learn routes + take routes are registered caching targets (route-architecture §5)
   v
(goodbye network: data drops / flight mode)
   |
   v
offline:  SyncIndicator shows [Offline] pill (top bar); SW serves cache
   |
   +-- STU-06 player: plays cached video/lesson; [Mark complete] queues (IndexedDB)
   |      -> queues entry {lesson_complete, lesson_id, programme_id, completed_at}
   |
   +-- STU-12 take: answers autosave locally; palette flags local; submit queues
   |      (attempt kept in_progress server-side; answers safe locally)
   |
   +-- STU-09 assignment: draft/file queues
   |
   +-- browse: Explore works off cached catalogue (STU-02/03 limited to cached content + offline banner)
   |
   v
(reconnect: at least one online event)
   |
   v
sync engine (src/lib/sync.ts pattern) drains queue: POST lesson/complete, POST submit, POST submission
   |
   +--<> (conflict?) --> yes --> SyncConflictBadge; user resolves per item (keep mine / keep server)
   |    no: toast "Synced" + toast each success
   v
clean: attempts & submissions flush; Results/STU-13 fetched fresh; queue badge clears
```

**Primary path.** Cache on normal use → work offline → sync on reconnect → conflict resolution if any.

**Exit states.** Queue drained; progress/submissions/attempts committed server-side; offline
banner clears; conflicts resolved.

**Edge cases.**
- **Submit while offline:** attempt stays `in_progress` server-side only if it started; if the
  *start* itself was offline, it waits until network for a server attempt id — UI says "will
  start when online".
- **Auto-submit while offline:** auto-submit queues like a normal submit (timer still fires);
  no navigation away; toast "Saved offline — auto-submit on reconnect".
- **Cache eviction:** covers/big videos LRU-evicted; lesson body/notes kept (small).
- **Cache stampede after reconnect:** sync batches, no per-item spinner storm.

---

## PART 2 — RESPONSIVE DESIGN RULES (§41 condensed)

**Breakpoints (binding, match existing):**

| Token | Width | Meaning |
|---|---|---|
| `sm` | ≥ 640 | small tablet / phablet landscape |
| `md` | ≥ 768 | tablet portrait |
| `lg` | ≥ 1024 | tablet landscape / small laptop |
| `xl` | ≥ 1280 | desktop |

**Global rules.**
- Rail collapse order: `xl` full rail (icons + labels) → `lg` compact icons → `<lg` hidden;
  mobile finds nav in the bottom tab / drawer.
- Spreadsheet-style tables (`w-full text-sm`, `th p-4`): ≤ `md` they horizontal-scroll inside
  their section card (`overflow-x-auto`), never squeeze.
- Where a row *decision* matters on mobile (grade, approve, enrol), the table becomes stacked
  label/value cards instead of horizontal scroll.
- KPI grids: `grid-cols-2 lg:grid-cols-4 gap-4` (house rule); panels `grid-cols-1 lg:grid-cols-2`.
- Immersive routes (`learn/[...]`, `take`, `classes/[id]`) opt out of the rail entirely
  (PlayerLayout per route-architecture §2).

### Student Home (STU-01)
- **xl/lg:** left rail + KPI `grid-cols-4`, "Continue" strip as 3-up cards, right rail
  (notifications/upcoming) at `xl` only.
- **md:** KPI `grid-cols-2`; continue strip becomes horizontal scroller (fade masks).
- **<md (mobile):** bottom tab bar appears (Home/Explore/My Learning e/t/Assessments/Activities,
  center = My Learning elevated); right rail content moves into a collapsible section under the
  header; KPIs stay 2-col; hero text scales (`text-2xl` → `text-xl`). Nothing hidden that is a
  primary task; secondary links move to the profile sheet.

### Learning player (STU-06)
- **xl/lg:** 3-pane — lesson content (center, `max-w-4xl`), collapsible module tree (left),
  resources/notes/discussion tabs (right panel).
- **md:** module tree collapses to an icon rail; right panel becomes a `Sheet` from the right.
- **<md:** single column; module list behind top-left `Sheet` drawer; bottom player bar with
  `[<]> ` lesson nav + play/pause + bookmarks; global nav hidden (PlayerLayout); back
  affordance always present; `[Space]` play/pause; `←/→` skip.

### Assessment take (STU-12)
- **xl/lg:** full-screen focus; question left, `QuestionPalette` right (numbered grid + flags);
  pinned timer in top bar (`AssessmentTimer`).
- **md:** palette collapses to a `Sheet` toggled by a "Questions" button; timer stays pinned.
- **<md:** exam isolation — *all* global chrome removed (no rail, no bottom bar, no search);
  palette as bottom sheet with the current question counter; timer pinned bottom-right;
  touch targets ≥ 40px on palette cells; auto-submit banner full-width.
- Never render a palette as horizontal scroll on mobile (palette cells must be reachable).

### Live class (STU-15) [P1]
- **xl/lg:** video stage (main) + chat right `w-80` + participants drawer.
- **md:** chat hidden behind a right `Sheet`; stage enlarges.
- **<md:** one large video (rotation-sensitive `aspect-video`); chat + Q&A + participants all in
  drawers; controls overlay; no rail; reconnect affordance visible.

### Explore browse (STU-02/03)
- **xl/lg:** category rail (chips) + programme grid `2-3 col` at lg, catalog filters in left
  pane; `ProgrammeCard` horizontal at lg, vertical at xl.
- **md:** grid `2-col`; filters collapse to a top "Filters" `Sheet`.
- **<md:** category chips horizontal-scroll (reuse search-input pattern with fade masks);
  grid `1-col` (or 2 compact cards); search box pinned at top; filter state chips persist as
  removable pills above the grid; no orphan horizontal scroll inside cards.

### Notifications (SYS-03) [P1]
- **xl/lg:** two-pane — filter segments (All/Assessments/Activities/Learning) + list; rows
  `w-full` with `deep_link` targets.
- **md:** same list, filters as top scrollable chips.
- **<md:** full-width rows, stacked meta (title + body + "2h ago"); tap = deep link; mark-read
  via row action; bulk "mark all" pinned in header. No compact multi-column squeeze.

### Teacher builder steps (TCH-03..07)
- **xl/lg:** stepper (1–5) horizontal at top + two-pane (main form + live `ProgrammePreview`
  `Sheet` for publish step).
- **md:** stepper compresses to a progress bar ("Step 2 of 5") + current step label; preview
  opens as `Sheet`.
- **<md:** single column form; stepper becomes a small progress + `Sheet` step-jump list;
  **sticky bottom action bar** (`[Save draft] [Save and continue]`) so the primary action stays
  thumb-reachable; `FileDropzone` and cover upload stay usable full-width; reorder via
  up/down buttons on mobile (drag is an enhancement, not the only path).

### Admin tables (SCH-01/02/06/07, SCH-09, NET-02..06)
- **xl/lg:** dense sortable tables (house sectioned-table-card), bulk action toolbar.
- **md:** tables scroll horizontally inside cards; segment controls stay; filter inputs condense.
- **<md:** decision-worthy tables (approve/release/adopt) become stacked label/value row cards
  with the action button on each card; view-only aggregate tables keep horizontal scroll;
  **bulk bar becomes a bottom sheet**; export/download moves to a header icon (never lost).

### Network benchmarks (NET-06, SCH-11)
- **xl/lg:** `BenchmarkCard` grid (school vs network, percentile, topics) + Recharts in
  `grid-cols-1 xl:grid-cols-2`; legend + filters in left pane.
- **md:** charts `grid-cols-1`; benchmark cards 2-up.
- **<md:** single column, charts full-width stacked (Recharts `ResponsiveContainer` handles
  width); KPIs 2-col; cohort/term filters become top chips. Small-screen percentiles never
  truncate: show `86th pct` inline, not in a hover tooltip.

### Shared
- Product switcher: remains a menu item at the top of the mobile slide-over (IA §2); header
  brand + hamburger `lg:hidden`; `SyncIndicator`/`SyncConflictBadge` never hide on mobile
  (offline is a mobile-reality feature).

---

## PART 3 — STATE STANDARDS ROUND-UP (§38:38–40 condensed cross-reference)

> This is a **cross-reference checklist**, not a rewrite of **FILE 08 — State & Reactive
> Standards**. Component source: `03-design-system.md` §10 (`EmptyState`, `DataState`,
> `Skeleton`, `ScoreDial`, `BenchmarkCard`, `StatusPill`) and `_context.md` §3 patterns.
> **Rule: every screen ships these six states; a missing one is a bug.**

| State type | Screen MUST show | Standard component | Student example | Teacher example | School example | Network example |
|---|---|---|---|---|---|---|
| **Loading** | Non-blocking skeletons in the exact final layout; no layout shift; controls disabled, inputs dimmed | `DataState` + `Skeleton` (`animate-pulse rounded-lg bg-muted`) | STU-06 player: header + body skeleton; video stage `h-64` | TCH-01: 4×`Skeleton h-20` KPI + action grid | SCH-01: KPI row + table rows | NET-06: chart-area skeleton fixed 260px (Recharts no-reflow) |
| **Empty** | Icon + 2-line copy + ONE actionable CTA; contextual message under filters | `EmptyState` (`icon`, `title`, `action`, `actionLabel`) | STU-05 "Nothing here yet — explore programmes" → glow CTA | TCH-02 "No programmes found" → `+ Create programme`; "No X match your search" under filter | SCH-02 school has no programmes → "Browse network or create" → adopt/create CTAs | NET-06 "No benchmark data yet — not enough participants" |
| **Error** | Inline banner + retry; never a dead end; destructive banner pattern | Alert banner (`rounded-lg border-destructive/30 bg-destructive/10`) + `[Retry]` | STU-04 programme load fail → retry → back to Explore | TCH-04 module save fail → banner + draft kept, `[Retry]` | SCH-06 bulk enrol fail → row-level roleback message with item list | NET-05 aggregate query fail → retry, benchmark undisclosed |
| **Permission-denied** | Inline (not full-page), explains WHY + how to get access; no 404 | Inline alert + link to the granting screen | STU-04 trying a `private` programme → "Ask your teacher for access" → contact TCH-08 | TCH-08 edit of another teacher's programme → "Only the owner/principal can edit"; request-access CTA | SCH-04 viewing teachers outside own school → blocked inline | Publishing without `network_publish` flag → upgrade/moderator CTA |
| **Not found / deleted** | Full state, not error-red; graceful recovery route | `EmptyState` + back/explore CTA | STU-06 deleted lesson → "Lesson no longer available" → back to My Learning | TCH-16 deleted assessment → back to TCH-14 | SCH-09 deleted school assessment → back to SCH-07 | NET-08 rejected publication → "Contact the publisher" |
| **Offline** | Always-visible pill; cached content usable; mutations queued, never lost | `SyncIndicator` offline pill (top bar) + offline banner on data views | STU-06 cached video plays; completion queued | TCH-09 upload queued; library read from cache | SCH-01 aggregate cached; enrol queued | NET-06 benchmark from last sync + "Data may be stale" |
| **Success / transient** | 3s bottom-right pill for transient confirms; full-screen card on flow completion | `toast(message)` / full-screen success card (`CheckCircle` in `rounded-full bg-emerald-100`) | STU-04 "Enrolled" toast; STU-06 completion banner | TCH-07 publish → "Published" + school visibility summary | SCH-08 "Adopted" toast | NET-08 approve → "Published to schools" |
| **Sync conflict** | Badge + per-item resolution; never silently overwrites | `SyncConflictBadge` + resolution sheet ("Keep mine / Keep server") | STU-12 offline attempt conflicts on reconnect | TCH-13 offline grade conflicts | SCH-06 offline bulk-enrol conflicts | NET-08 offline moderation queue conflicts |
| **Data chunked / paginated** | Debounced search + segmented status control + bulk bar (platform pattern) | `super-admin/users` recipe (server-paginated list) | STU-03 browse paginated with grade/subject segments | TCH-02 programmes paginated with status segments | SCH-06 enrolments paginated with cohort bulk bar | NET-02 schools searchable/paginated; bulk adopt bar |
| **Zero data + zero access distinction** | Empty vs permission-denied are different states — never conflate | EmptyState vs inline alert (see above rows) | "No programmes for Grade 8" (empty) vs "Request access" (denied) | "No programmes found" (empty) vs "Cannot edit Y" (denied) | "School has no enrolments" (empty) vs "No visibility into other schools" (private) | "Not enough sample" (empty) vs "Moderation permission required" (denied) |

**Composition defaults.** `DataState` wraps every async fetch and is required to render
`loading | empty | error` without layout shift (fixed-height skeletons for chart panels —
Recharts must never reflow). Immersive screens (player/take) reuse the same states but with
immersive chrome: the offline pill moves inline into the player top bar, and errors inside a
player keep the content frame visible while showing the banner.

---

## PART 4 — MVP CUT (Part 12 of the brief)

### 4.1 MVP definition (strict)

MVP ships **P0 screens** from `04-screen-inventory.md`, **plus** the four additions the brief
explicitly pulls forward: teacher Content Library (TCH-09/TCH-10 read+link), Question Bank
already on the P0 list (TCH-17/TCH-18), school Enrolments (SCH-06), and **Network
benchmarking READ-ONLY** (NET-06 read views + SCH-11 read hub). The full network
create/moderate/publish machine is **Phase 2**, not MVP.

**MVP scope (one line):** Student explore → enrol → learn → assignments → basic-MCQ assessment
→ progress · Teacher programme builder + content library + question bank + assignments + MCQ
assessment + results · School dashboard/overview/enrolment · Network benchmarking READ-ONLY ·
Product switcher + auth + tuition shell.

**Powered by (binding gating):**
- `feature_flags` key **`decimal_tuition`** (school-scoped master switch), AND
- `plans.features.tuition` entitlement (`requireBillingPlanFeature(schoolId, 'tuition')`,
  checks active/trialing/past_due sub then entitlement). Plan slugs `free, starter, pro,
  enterprise`; KES monthly / pesas annual.
- Gate is enforced at the `(tuition)/layout` boundary: unentitled school sees a gating screen
  (upgrade CTA), the space never partially renders.
- Every mutation behind `requirePermission(userId, schoolId, <tuition resource>, <action>)`.

**Out of MVP (explicit):** live classes, activities, network publish/moderate/adopt flows,
certificates, teacher analytics v1, mobile bottom-tab polish, notes/annotations, global search
overlay, profile hub, settings tabs (only account basics), onboarding wizard (P1, but a minimal
first-run "pick grade + interests" is pulled in as the seeding step below).

### 4.2 Slice plan (deterministic order, each slice shippable behind the flag)

Each slice: **ID, user story, screens, backend, RLS/data notes, acceptance, powered by**.
Slices build vertically; later slices assume earlier ones. Suggested order 0→8.

### Slice 0 — Shell, auth, identity, gating (foundation)
- **Story:** "As any Decimal user I can switch into Tuition and land in my space; unentitled
  schools see the upgrade gate."
- **Screens:** SYS-01 product switcher; new `(tuition)` layout (`TuitionShell` + `SpaceRail` +
  breadcrumbs); role-aware `/tuition` dispatch; gating screen; minimal first-run grade picker
  for student identity.
- **Backend:** migration 028 foundations (curriculum spine tables + `programmes` empty-capable
  shape), `tuition_student_users` bridge, `protectedPaths` += `/tuition` + `routeRoleMap` add.
- **RLS/data:** read boilerplate `(school_id IN (select get_user_school_ids()) or is_super_admin())`;
  `tuition_student_users` resolved before rendering student views; never call
  `get_user_school_ids()` inside `school_members` policies.
- **Acceptance:** switch School Management ↔ Tuition and back with auth + active school intact;
  per-role dispatch lands correctly (teacher → /tuition/teacher, principal → /tuition/school,
  parent → student view, super_admin → /tuition/network); disabled school sees gate; student
  with no student row gets the grade picker → STU-01.
- **Powered by:** `decimal_tuition` flag + `plans.features.tuition`.

### Slice 1 — Curriculum spine + teacher programme builder
- **Story:** "As a teacher I can build a programme in 5 steps, autosave drafts, resume, and
  publish."
- **Screens:** TCH-02, TCH-03 (`?step=1`), TCH-04 (`?step=2`), TCH-05 (`?step=3`), TCH-06
  (`?step=4`), TCH-07 (`?step=5`), TCH-08 (manage: overview/students tabs only), TCH-01 reads.
- **Backend:** `programmes`, `programme_modules`, `programme_lessons`, `lessons_resources`,
  `programme_instructors`, publish endpoint with validation; seed CBC strands for core subjects.
- **RLS/data:** teacher+principal manage; members read own school; `is_preview` lessons public.
- **Acceptance:** create → draft autosaves each step; resume at "step 2 of 5"; publish blocked
  by red checklist rows when module/lesson/access incomplete; published programme shows in
  TCH-02 with `published` pill and in SCH-02.
- **Powered by:** `decimal_tuition`; publish writes `published_at`.

### Slice 2 — Student learn journey
- **Story:** "As a student I can explore, enrol, open a programme, and complete lessons."
- **Screens:** STU-01, STU-02, STU-03 (`?grade=&subject=`), STU-04, STU-05, STU-06, STU-07
  (resource states incl. locked/offline/completed).
- **Backend:** `programme_enrolments` (+ unique), `lesson_progress`, `POST /api/tuition/enrol`,
  `POST /api/tuition/lessons/[id]/complete`, `GET /api/tuition/my-learning`.
- **RLS/data:** student owns own rows; teacher/principal read class rows; `is_preview` shown pre-enrol.
- **Acceptance:** browse filters by grade/subject; enrol → active (or invited for private);
  programme appears in My Learning with progress; completing lessons advances `progress_pct`
  and unlocks next lesson.
- **Powered by:** `decimal_tuition`; enrol respects plan feature (no plan → gate).

### Slice 3 — Teacher content library + student manager
- **Story:** "As a teacher I can upload content once, reuse it across lessons, and see the
  students enrolled in my programmes."
- **Screens:** TCH-09 (`/tuition/teacher/content`), TCH-10 (preview/replace), TCH-11, TCH-08
  `[Enrol students]` sheet.
- **Backend:** `lessons_resources` with `lesson_id` nullable (library asset vs linked asset),
  storage bucket, `GET/POST` library API; TCH-11 reads enrolments + lesson progress.
- **RLS/data:** school-scoped read for members; teacher create/update/delete own rows; delete
  blocked while linked to a published lesson (returns link count).
- **Acceptance:** upload 2 assets; link one into a lesson in Slice 1 content step; preview
  plays PDF/video; student appears in TCH-11 after enrolling; teacher can enrol a class in
  TCH-08; storage meter moves.
- **Powered by:** `decimal_tuition`.

### Slice 4 — Question bank + MCQ assessments (teacher + student)
- **Story:** "As a teacher I can build auto-graded MCQ assessments from my question bank; as a
  student I can take them and see a result."
- **Screens:** TCH-17, TCH-18, TCH-14, TCH-15, TCH-16 (results: participation + per-question +
  distribution), STU-10, STU-11, STU-12, STU-13.
- **Backend:** `questions`, `assessment_sections`, `assessments`, `assessment_questions`,
  `assessment_attempts`, auto-grader for `mcq|true_false|multi_select`; `result_visibility`
  = `immediately` for MVP (manual/hybrid grader + release UI = Phase 2).
- **RLS/data:** teacher read/write own school question bank; student writes own attempt only;
  attempts unique per (assessment, student) with attempt_limit.
- **Acceptance:** create 6 MCQs → build assessment → publish → student takes with timer +
  palette + flags + autosave → auto-submit at timeout → instant result with review and strand
  breakdown; TCH-16 shows participation + per-question bars; manual question types render but
  are excluded from auto-marking.
- **Powered by:** `decimal_tuition`; attempt/score never cross school boundaries.

### Slice 5 — Assignments
- **Story:** "As a teacher I can set an assignment and grade submissions inline; as a student I
  can submit (draft/text/file) and see my grade."
- **Screens:** TCH-13, STU-08, STU-09.
- **Backend:** `assignments`, `submissions` (unique(assignment_id, student_id), status
  `draft|submitted|late|graded`), inline grade + feedback write, auto-close on due date.
- **RLS/data:** student writes own submission; teacher reads class submissions; late computed
  server-side from `due_at` + `allow_late` + `late_penalty_pct`.
- **Acceptance:** teacher publishes open assignment; student drafts then submits; due date
  auto-closes to `grading`; teacher grades inline with feedback → student sees grade in STU-09;
  late submissions flagged `late`.
- **Powered by:** `decimal_tuition`.

### Slice 6 — Progress + school admin dashboard/enrolment
- **Story:** "As a student I see streaks, subject progress and weak topics; as a principal I
  see adoption, engagement, assessment participation and can bulk-enrol."
- **Screens:** STU-18, SCH-01, SCH-02, SCH-07, SCH-06, SCH-09 (basic results read).
- **Backend:** `tuition_enrolment_daily_activity` rollup (cron-fed), progress aggregate APIs;
  school aggregate endpoints (enrolments, engagement, participation) — all `school_id` grouped.
- **RLS/data:** school aggregates only inside own school; benchmarks still N/A (Slice 7).
- **Acceptance:** streak + per-subject % + weak-topic chips on STU-18; SCH-01 KPIs reflect real
  enrolments; SCH-06 bulk-enrols a whole class into a programme in one action; SCH-07/SCH-09
  read assessment participation/results.
- **Powered by:** `decimal_tuition`; school analytics respect manual result release (no early scores).

### Slice 7 — Network benchmarking READ-ONLY + notifications spike + gating polish
- **Story:** "As a principal I see my school's anonymized position vs the network (safe,
  aggregate-only); as any user I get key tuition notifications."
- **Screens:** NET-06 (read-only benchmark view), SCH-11 (read-only network hub), SYS-03
  (notifications center wiring — existing notifications table + tuition deep links).
- **Backend:** `network_benchmarks` seed/aggregate (service-role/cron), read-only API; notify
  on enrol, lesson-complete milestones, assessment release, grade posted.
- **RLS/data:** benchmarks = aggregated rows only (`metric_type avg|percentile|participation|per_strand`,
  `sample_size`); no student-level cross-school data, enforced in policy and UI copy
  ("Anonymized — we only show your students").
- **Acceptance:** benchmark table/cards show school vs network avg + percentile + per-strand
  with sample_size; zero-sample states show "Not enough participants yet"; notifications arrive
  for the four MVP triggers; disabled plan upgrade gate reached before entire Tuition space.
- **Powered by:** `decimal_tuition` + `plans.features.tuition`.

### Slice 8 — MVP hardening & release
- **Story:** "The MVP is demonstrable end-to-end with no dead ends and no data leaks."
- **Backend:** empty/error/permission/offline states audited per PART 3 checklist; accessibility
  pass (WCAG 2.2 AA, keyboard nav, live regions on timer/autosave); PWA cache targets confirmed
  for `learn` + `take`; analytics rollup cron; seed data for demo school.
- **Acceptance:** each of the ten state standards verified on every P0+ screen via a checklist
  (from PART 3); a fresh student completes Flow 1 and Flow 3 with a mid-session offline drop
  with zero data loss; a fresh school completes Flow 8 adopting a programme; lighthouse
  performance/mobile sanity pass.

> **Slice order that works without guessing:**
> 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.
> Parallelizable pairs (after the dependency edges hold): (3 ∥ 4-backend), (5 ∥ 6-data),
> 7 can start as soon as 4 produces benchmarkable attempts. Do NOT ship 4 before 2 (students
> must be able to take what a school adopts). Every slice lands behind the `decimal_tuition`
> flag, so partial release is safe.

---

## PART 5 — PHASE 2 (Part 13 of the brief) — important, soon after MVP

Everything here maps to P1 screens in `04`. Minimum one P1 per item below, in rough dependency order.

### 5.1 Live classes
- **Value:** synchronous teaching (catch-up/revision), the strongest teacher-engagement lever
  and a differentiator vs offline-only tools.
- **Prerequisite:** Slice 1 programmes exist for context; students can enrol (Slice 2).
- **Screens added:** STU-14 `/tuition/classes`, STU-15 `/tuition/classes/[id]` (waiting room →
  room), TCH-19 `/tuition/teacher/classes` (schedule/replay).
- **Backend:** `live_classes` (provider placeholder: meet/zoom/livekit token), `live_class_attendees`,
  attendance count, recording URLs.
- **Risk:** provider coupling + bandwidth — a poor video experience lands worse than a good
  recorded lesson; ship waiting room + chat + Q&A + polls before betting on video quality; keep
  recordings as a graceful fallback.

### 5.2 Activities with teams, fixtures and results
- **Value:** co-curricular lifecycle (sports/music/drama/clubs) — the "Activities" space that
  makes Tuition feel like school life, not just coursework.
- **Prerequisite:** school shell + students (Slices 0/2/6); principal approval gates.
- **Screens added:** STU-16, STU-17, TCH-20, SCH-10.
- **Backend:** `activities`, `activity_registrations`, `activity_teams`, `activity_matches`
  (scores, walkover/cancelled), leaderboard jsonb derivation.
- **Risk:** fixture/team data entry is fiddly — keep bulk "add match" and a simple
  home/away score form; avoid full tournament engines until P2.

### 5.3 Network adopt flows (full)
- **Value:** cross-school assessment/programme adoption turns single-school Tuition into a
  networked product — where the real retention story lives.
- **Prerequisite:** benchmarking read-only (Slice 7) proven; moderation staffing understood.
- **Screens added:** NET-01, NET-02, NET-03, NET-04, NET-05, NET-08 (moderation), SCH-08
  (adopt-with-source), SCH-11 (full hub).
- **Backend:** `network_publications` (pending/approved/rejected/published), `network_adoptions`
  (+ `adoption_count`), publish permission resource (`tuition_network`.`publish`) gated by
  `network_publish` school flag.
- **Risk:** moderation quality + adoption friction — keep the reviewer checklist binary
  (content/scope/privacy) and make adopting a school a two-click action.

### 5.4 Benchmarking depth
- **Value:** the reason principals renew — cohort filtering, per-strand drill-down,
  term-over-term deltas.
- **Prerequisite:** Slice 7 + enough participating schools.
- **Screens added:** NET-06 enrichment (filters: grade, term, cohort, strand), SCH-12 (school
  analytics), SCH-03 (programme analytics).
- **Backend:** richer `network_benchmarks` (per-strand, percentile bands, participation),
  filters pipeline.
- **Risk:** privacy misuse — percentile science is easy to leak; enforce "never below
  school-aggregate" in policy AND UI.
- **Certificates** (STU-20) — see 5.7.

### 5.5 Teacher analytics v1
- **Value:** completion trends, score distribution, struggling-student list — moves the teacher
  from "I can see the class" to "I know who to help".
- **Prerequisite:** Slices 2/4/5 produce progress + attempts + submissions.
- **Screens added:** TCH-21 `/tuition/teacher/analytics`.
- **Backend:** reuse `tuition_enrolment_daily_activity` + attempt/submission aggregates; Recharts
  (Area/Bar/Radar).
- **Risk:** chart overload — ship Completion · Engagement · Weak topics · "Needs attention"
  list; hide the rest behind tabs.

### 5.6 Mobile bottom-tab
- **Value:** thumb-reachable student navigation; learning is a mobile activity in Kenya.
- **Prerequisite:** PART 2 responsive rules applied; PWA caching (Slice 8).
- **Screens added:** mobile nav per IA §7 (Home/Explore/My Learning center/Assessments/Activities);
  teacher keeps sidebar drawer; no new routes.
- **Risk:** scope creep onto immersive screens — bottom tab must never appear on player/take
  (exam isolation stays).

### 5.7 Certificates
- **Value:** completion proof (parent + student pride; usable in the Network for league/level
  recognition).
- **Prerequisite:** enrolment completion (Slice 2) + assessment results (Slice 4).
- **Screens added:** STU-20 `/tuition/certificates`; certificate view + print/PDF; issuance tied
  to completion criteria.
- **Risk:** certificate forgery/permissions — server-side issue + verify token; keep design
  parametric; full certificate subsystem (templates/branding/verification) is P2 (see PART 6).

### 5.8 Notes & annotations
- **Value:** student lesson notes and teacher-side intervention notes deepen both learner agency
  and teacher actionability.
- **Prerequisite:** Slice 2 (player) + Slice 3 (teacher student view).
- **Screens added:** notes panel inside STU-06 (player); TCH-12 `/tuition/teacher/students/[id]`
  (progress + strengths/weaknesses + notes + interventions).
- **Backend:** student notes per lesson (existing `notes` concept → tuition lesson-notes rows);
  `teacher_student_notes` (add/pin/history).
- **Risk:** notes drift into a CRM — keep them per-lesson/per-student, plain text, pinned API
  stable for P2 AI to consume.

### 5.9 Onboarding wizard (SYS-06), search overlay (SYS-02), profile hub (SYS-04), settings (SYS-05)
- **Value:** first-run activation (grade + interests + recommendations), global `/tuition/search`,
  public profiles, user settings — all rounding out the shell.
- **Prerequisite:** everything above; screens are P1 in `04`.
- **Risk:** polish scope creep; each is a bounded single-screen effort.

---

## PART 6 — FUTURE (Part 14 of the brief) — later, with hooks reserved

> **AI guardrail (binding, from `01-product-vision.md` §5.15):** AI is a future hook, not an MVP
> requirement, and **must never dominate the Tuition UI**. The AI features below are deliberately
> de-scoped until the MVP data model, RLS and benchmark integrity are proven. All listed AI
> capabilities are **hooks in the data model (explanation text, attempt details, strand
> taxonomy, notes, transcript)** that later models can consume without schema rewrites.

### 6.1 Live teaching depth
- Real-time assessments, live polls→reports, breakout rooms, co-teaching, recordings→lessons
  (reuse `live_classes` provider slot + `recording_url`).
- **Hooks:** `live_class_attendees`, polls stored on attempts/answers, `join_links`.

### 6.2 Network marketplace
- Programmes and assessments as a published catalogue with quality ratings, adoption analytics,
  highlighted publishers; per-school "favourite adopters" and league tables.
- Requires full moderation (Phase 2) to be reliable enough to surface.

### 6.3 AI — future hooks only
| Capability | Hook in current model | Later UX |
|---|---|---|
| Assistant (guided help) | tuition shell + notification deep links | Conversation surface in `/tuition` bottom bar (never floats over player/take) |
| Lesson generation | `programme_lessons.body` jsonb (paragraphs/embeds) + curriculum strands | "Draft lesson from strand" in TCH-05 (teacher approves everything) |
| Assessment/question generation | `questions.stem/options/correct_answers/explanation/strand` | "Generate 5 MCQs from strand" in TCH-18; human review before publish |
| Personalized learning paths | `lesson_progress`, `assessment_attempt_details`, strand taxonomy | "Suggested next" ribbon on STU-01 / recommendations in SYS-06 |
| Weak-topic detection | per-strand % from attempts (`assessment_results`) | STU-18 weak-topic chips + TCH-21 breakdown |
| Revision recommendations | weak strands + `curriculum_strands` + module map | "Revise these 3 lessons" block on STU-01 |
| Automated feedback on work | `submissions.feedback`, `questions.explanation`, teacher notes | Teacher-suggested feedback in TCH-13 (teacher approves) |
| Lesson summaries | `programme_lessons.body` + transcripts | "Summary" tab in STU-06 right panel |
> **Never auto-submit AI output to students; every generated artefact lands in a teacher/student
> review state first.**

### 6.4 Advanced analytics
- Cohort-of-cohort, term-longitudinal, cross-strand confusion matrices, attendance→attainment
  correlation with school `exams`/`exam_results`. Read-only, aggregate-only at network level.

### 6.5 Certificates subsystem
- Template/branding per school/network, verified issuance (server-side issue + verify token),
  QR + PDF, auto-issue on programme completion + network level milestones (`STU-20`/`STU-19`
  achievements).

### 6.6 Monetization
- **School-paid (base):** subscription `plans.features.tuition` tiers KES/pesas.
- **Network marketplace (future):** per-programme/per-assessment sales between schools, revenue
  share, publisher payouts — requires split gateway + tax (KRA) handling; clearly out of MVP.
- **Per-programme:** optional à-la-carte premium programmes sold to schools/individuals.
- MVP stays on **school-paid subscriptions only**; monetization decisions do not block Slice 0–8.

### 6.7 Offline learning depth
- Managed download packs (`[Download programme]` → lesson + captions bundle), progress merging
  rules, peer-share of packs over LAN, offline activity/attendance where the SW-cache model is
  insufficient. Reuses Flow 14 sync engine.

---

**Cross-file integrity:**
- Screen IDs/routes are verbatim from `04`/`02`; statuses verbatim from `_context.md` §7.
- RLS/PII rules from `11-data-model.md` §7/§11 — never breached by any flow above.
- Gating (`decimal_tuition` + `plans.features.tuition`) from `_context.md` §4 — enforced from
  Slice 0.
- This file is the ordering/rationale layer on top of `05/06/07` (wireframes) and `08` (states).