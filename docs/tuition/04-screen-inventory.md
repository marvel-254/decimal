# DECIMAL TUITION — SPEC FILE 04 — Screen Inventory (master table)

> P0 = MVP · P1 = important soon after · P2 = later. Roles: S=student, T=teacher, D=school admin/principal, N=platform/network, P=parent (read-only views).
>
> **Recounted (post-review).** This file is now the **authoritative enumeration** for T1
> resolution, reconciled against the screen IDs actually written in Volumes 05–08. Exact totals:
> **75 screens** — SYS **6** · STU **20** · TCH **21** · SCH **12** · NET **8** · AUTH **7**
> (pattern specs) · BILL **1** (pattern spec). Per priority: **P0 = 48 · P1 = 25 · P2 = 2**.
> Priorities follow the MVP cut in `09-user-flows-and-phases.md` §4; screens marked `*` were
> reclassified on recount (see footnote). The earlier "≈57" / "22+26+9" counts are superseded.

## A. Shared / system screens

| ID | Screen | Role | Route | Priority |
|---|---|---|---|---|
| SYS-01 | Product Switcher (School Mgmt ↔ Tuition) | all | sidebar | P0 |
| SYS-02 | Tuition global search overlay | all | `/tuition/search` | P1 |
| SYS-03* | Notification center (tuition-aware) — notifications wiring is MVP Slice 7 | all | `/tuition/notifications` | P0 |
| SYS-04 | Profile hub + student/teacher/school public profiles | all | `/tuition/profile`, `/tuition/profile/[type]/[id]` | P1 |
| SYS-05 | Settings (tabs: account, notifications, privacy/security, learning prefs, accessibility) | all | `/tuition/settings` | P1 |
| SYS-06 | Student onboarding wizard (welcome→connect→grade→interests→goals→recommendations→done) | S | `/tuition/onboarding` | P1 |

## B. Student experience (Learn space)

| ID | Screen | Role | Route | Priority |
|---|---|---|---|---|
| STU-01 | Student Home dashboard | S | `/tuition` | P0 |
| STU-02 | Explore home (featured/recommended/trending, category rail) | S | `/tuition/explore` | P0 |
| STU-03 | Explore filtered browse + search results | S | `/tuition/explore?grade=&subject=` | P0 |
| STU-04 | Programme detail (hero, curriculum, modules, reviews, CTA) | S | `/tuition/programmes/[id]` | P0 |
| STU-05 | My Learning (enrolled programmes + progress list) | S | `/tuition/my-learning` | P0 |
| STU-06 | Learning player (lesson view, resource view) | S | `/tuition/learn/[pid]/[lid]` | P0 |
| STU-07 | Lesson resource states (video loading/error/offline/locked/completed) | S | (within 06) | P0 |
| STU-08 | Assignment list (mine) | S | `/tuition/assignments` | P0 |
| STU-09 | Assignment detail + instructions + submit (file/text, draft, late) | S | `/tuition/assignments/[id]` | P0 |
| STU-10 | Assessment dashboard (upcoming/available/finished) | S | `/tuition/assessments` | P0 |
| STU-11 | Assessment instructions + start confirmation | S | `/tuition/assessments/[id]/instructions` | P0 |
| STU-12 | Assessment-taking interface (timer, palette, flags, autosave, submit) | S | `/tuition/assessments/[id]/take` | P0 |
| STU-13 | Assessment result (score dial, review answers, topic analysis) | S | `/tuition/assessments/[id]/result` | P0 |
| STU-14 | Live classes dashboard (upcoming/live/replays) | S | `/tuition/classes` | P1 |
| STU-15 | Live classroom (waiting room ⇒ room: video/chat/Q&A/polls/part/wb/recording) | S | `/tuition/classes/[id]` | P1 |
| STU-16 | Activities discovery | S | `/tuition/activities` | P1 |
| STU-17 | Activity detail + registration + schedule/fixtures/results | S | `/tuition/activities/[id]` | P1 |
| STU-18 | Progress (streaks, subject progress, completion, weak topics) | S | `/tuition/progress` | P0 |
| STU-19 | Achievements | S | `/tuition/achievements` | P2 |
| STU-20* | Certificates — basic issue/view is Phase 2; full subsystem later | S | `/tuition/certificates` | P1 |

## C. Teacher experience (Teach space)

| ID | Screen | Role | Route | Priority |
|---|---|---|---|---|
| TCH-01 | Teacher dashboard | T | `/tuition/teacher` | P0 |
| TCH-02 | My Programmes (list, status filters, stats) | T | `/tuition/teacher/programmes` | P0 |
| TCH-03 | Programme builder Step 1 — Details | T | `/tuition/teacher/programmes/new?step=1` | P0 |
| TCH-04 | Programme builder Step 2 — Structure (modules/lessons tree, reorder) | T | `...?step=2` | P0 |
| TCH-05 | Programme builder Step 3 — Content (lesson + resource editor) | T | `...?step=3` | P0 |
| TCH-06 | Programme builder Step 4 — Access (visibility scopes) | T | `...?step=4` | P0 |
| TCH-07 | Programme builder Step 5 — Review & Publish | T | `...?step=5` | P0 |
| TCH-08 | Manage programme (manage tabs: overview/students/content/assess/results) | T | `/tuition/teacher/programmes/[id]` | P0 |
| TCH-09* | Content Library (folders, uploads, search) — pulled into MVP (Slice 3) | T | `/tuition/teacher/content` | P0 |
| TCH-10* | Content/Resource detail + preview — pulled into MVP (Slice 3) | T | `/tuition/teacher/content/[id]` | P0 |
| TCH-11 | Students (my enrolled students, progress overview) | T | `/tuition/teacher/students` | P0 |
| TCH-12 | Teacher student profile (progress, strengths/weaknesses, notes, interventions) | T | `/tuition/teacher/students/[id]` | P1 |
| TCH-13 | Assignments (create/manage, submissions review & grade) | T | `/tuition/teacher/assignments` | P0 |
| TCH-14 | Assessments (create/manage list) | T | `/tuition/teacher/assessments` | P0 |
| TCH-15 | Assessment Builder (settings + question selection + sections/reorder + publish) | T | `/tuition/teacher/assessments/new` | P0 |
| TCH-16 | Assessment results (participation, scores, per-question, topic analysis, export) | T | `/tuition/teacher/assessments/[id]/results` | P0 |
| TCH-17 | Question Bank (list, filters, editor, preview, usage) | T | `/tuition/teacher/question-bank` | P0 |
| TCH-18 | Question editor (all types + metadata + markup) | T | `/tuition/teacher/question-bank/new` | P0 |
| TCH-19 | Live classes (schedule/manage, replay library) | T | `/tuition/teacher/classes` | P1 |
| TCH-20* | Teacher Activities (organize, teams, registrations) — Phase 2 activities | T | `/tuition/teacher/activities` | P1 |
| TCH-21 | Teacher Analytics (completion, scores, engagement, struggling students) | T | `/tuition/teacher/analytics` | P1 |

## D. School admin experience

| ID | Screen | Role | Route | Priority |
|---|---|---|---|---|
| SCH-01 | School Tuition dashboard | D | `/tuition/school` | P0 |
| SCH-02 | Programmes (all school programmes, adoption status) | D | `/tuition/school/programmes` | P0 |
| SCH-03 | Programme analytics (enrolments, completion, assessment mean) | D | `/tuition/school/programmes/[id]` | P1 |
| SCH-04 | Teachers (tuition teachers, workload) | D | `/tuition/school/teachers` | P1 |
| SCH-05 | Students (tuition students, engagement) | D | `/tuition/school/students` | P1 |
| SCH-06 | Enrolments (bulk enrol class→programme, manage cohorts) | D | `/tuition/school/enrolments` | P1 |
| SCH-07 | Assessments (school + adopted, participation) | D | `/tuition/school/assessments` | P0 |
| SCH-08 | Adopt network assessment | D | `/tuition/school/assessments/adopt` | P1 |
| SCH-09* | Assessment participation + results (school view) — basic results read is MVP (Slice 6) | D | `/tuition/school/assessments/[id]` | P0 |
| SCH-10 | Activities & events (approve, schedule, results) | D | `/tuition/school/activities`, `/tuition/school/events` | P1 |
| SCH-11* | Network hub (programmes, assessments, benchmark) — read-only view is MVP (Slice 7); full hub P1 | D | `/tuition/school/network` | P0 |
| SCH-12 | School analytics (engagement, assessment, network) | D | `/tuition/school/analytics` | P1 |

## E. Network experience

| ID | Screen | Role | Route | Priority |
|---|---|---|---|---|
| NET-01 | Network dashboard (participation, active assessments, leagues) | N/D | `/tuition/network` | P1 |
| NET-02 | Network schools | N | `/tuition/network/schools` | P1 |
| NET-03 | Network programmes (discovery, participation) | N/D | `/tuition/network/programmes` | P1 |
| NET-04 | Network assessments (published common assessments) | N/D/T | `/tuition/network/assessments` | P1 |
| NET-05 | Assessment detail + adopt/participate + results benchmark | N/D/T | `/tuition/network/assessments/[id]` | P1 |
| NET-06* | Benchmarking dashboard (school vs network, percentile, topics; anonymized) — READ-ONLY view is MVP (Slice 7); depth enrichment P1 | N/D | `/tuition/network/benchmarking` | P0 |
| NET-07 | Activities network (leagues, festivals, standings) | N/D | `/tuition/network/activities` | P2 |
| NET-08* | Moderation queue — network publish/moderate machine (Phase 2) | N | `/tuition/network/moderation` | P1 |

## F. Volume 08 pattern specs — AUTH + BILL (+ modal/drawer systems)

> These are specced in `08-wireframes-system.md` but are **pattern specs / vertical slices, not
> full routed screens**. They are tracked here so auth, shell and billing gating stay inside the
> enumeration. AUTH + BILL are counted in the totals below; Parts D/E (modal/drawer systems) are
> not screens and sit **outside** the totals.

### F.1 Authentication (AUTH) — Volume 08 Part B · all P0 (“auth” is MVP Slice 0; screens reuse the shared Decimal `(auth)`)

| ID | Screen | Role | Route | Priority |
|---|---|---|---|---|
| AUTH-01 | Login (shared `(auth)`; tuition return path + student identity resolution) | all (pre-auth) | `/login?next=/tuition` | P0 |
| AUTH-02 | Post-login role/school selection (multi-role/multi-school) | all (pre-auth) | `/tuition/role-select` | P0 |
| AUTH-03 | Forgot password | all (pre-auth) | `/auth/forgot?next=/tuition` | P0 |
| AUTH-04 | Reset password | all (pre-auth) | `/auth/reset?token=…&next=/tuition` | P0 |
| AUTH-05 | Email verification | all (pre-auth) | `/auth/verify?token=…&email=…&next=/tuition` | P0 |
| AUTH-06 | School invitation acceptance | all (pre-auth) | `/tuition/invite/accept?token=<jwt>` | P0 |
| AUTH-07 | Session expired handling | all | modal / middleware redirect to `/login` | P0 |

### F.2 Billing gating (BILL) — Volume 08 Part C · P0 (“billing gating” is MVP Slice 0)

| ID | Screen | Role | Route | Priority |
|---|---|---|---|---|
| BILL-01 | Tuition upgrade gate (upsell sheet on tuition screens for gated schools) + billing line item | D | gating layer at `(tuition)` boundary; `/principal/billing` + `/principal/billing/plans` | P0 |

### F.3 Modal / drawer systems — Volume 08 Parts D & E (pattern specs, not screens; counted separately = 25)

D-01…D-18 (18 modals: Create/Edit/Delete Programme, Enrol Student, Invite/Assign Teacher, Create/Publish/Submit Assessment, Create Activity, Join/Leave Programme, Upload/Share Resource, Publish Programme, Adopt Network Assessment, Create/Cancel Event) · E-01…E-07 (7 drawers: Filters, Student Details, Teacher Details, Programme Preview, Notifications, Quick Actions, Resource Preview). Also in Volume 08 but out of scope for the screen count: Part F table system, Part G states canon, Part H responsive, Part I global navigation consolidation.

## Summary counts (recounted — authoritative)

| Family | Screens | P0 | P1 | P2 |
|---|---|---|---|---|
| SYS | 6 | 2 | 4 | 0 |
| STU | 20 | 14 | 5 | 1 |
| TCH | 21 | 17 | 4 | 0 |
| SCH | 12 | 6 | 6 | 0 |
| NET | 8 | 1 | 6 | 1 |
| AUTH (pattern specs) | 7 | 7 | 0 | 0 |
| BILL (pattern spec) | 1 | 1 | 0 | 0 |
| **Total** | **75** | **48** | **25** | **2** |

Total = **75 screens** = SYS 6 + STU 20 + TCH 21 + SCH 12 + NET 8 + AUTH 7 + BILL 1.
Per priority: **P0 = 48 · P1 = 25 · P2 = 2**. The previous "≈57" and "22+26+9" prose is superseded.
`*` = priority reclassified in this post-review recount (see the Recounted note at the top).

## Cross-cutting states (every screen): loading skeleton, empty state, error state, permission-denied inline, offline banner, success feedback (defined once in design-system + reactive standard).