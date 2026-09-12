# Tuition MVP — Slice Log & Resume Point

> Purpose: record exactly where Decimal Tuition stands so work can pause (for the
> Supabase → Convex + WorkOS migration) and resume without losing context.
> Last updated: 2026-09-12 (Slice 1 closed — publish flow verified live; save-path +
> FK fixes `064bfb4`/`abae799`/`0ec15b3`).

## Status bar

| Slice | Scope | Status |
|-------|-------|--------|
| 0 | Shell, auth, identity, gating, onboarding | **DONE — tested live** |
| 1 | Curriculum spine + 5-step teacher programme builder | **DONE — verified live (publish flow end-to-end)** |
| 2 | Student learn journey (explore/enrol/lessons/progress) | pending |
| 3 | Teacher content library + student manager | pending |
| 4 | Question bank + MCQ assessments | pending |
| 5 | Assignments? (leaderboards/streaks/flashcards per Part 4) | pending |
| 6 | Live classes | pending |
| 7 | Activities + network | pending |
| 8 | School/student/network dashboards + polish | pending |

Slice order + acceptance per `docs/tuition/09-user-flows-and-phases.md` (Part 4, lines 1132+).

## Stack (as of pause)
- Next.js 16.3.4 (App Router, React 19), Tailwind v4, shadcn/ui on `@base-ui/react`.
- Data: **Supabase** Postgres, migrations `001–030` APPLIED to remote project
  `pgiytpbrnyxnnfupvaiv` (`https://pgiytpbrnyxnnfupvaiv.supabase.co`). RLS enforced.
- Auth: Supabase Auth (email/password + Google OAuth + Turnstile). Demo roles in Supabase.
- Deploy: push to `main` → GitHub Actions CI/CD (`lint-and-build` + deploy) →
  `npx vercel@latest --prod --yes` → `https://decimal-app.vercel.app`.
  Repo origin: `https://github.com/marvel-254/decimal.git`.
- Local: NO local dev/test/Docker (limited machine). Test via **agent-browser
  (Playwright)** against the deployed app.

## Slice 0 — complete (verified production via agent-browser)
- Migration `028_tuition_foundation.sql` shipped: curriculum spine, programmes/modules/
  lessons/resources/instructors/cohorts/enrolments/progress/reviews, tuition_student_users,
  assignments, assessments, live classes, activities, network tables + RLS.
- `src/app/tuition/**` real route group (NOT a `()` group — that broke `next build`).
- Identity: tuition **students are not school_members**; resolved via
  `tuition_student_users` bridge (`src/lib/tuition/identity.ts`). Middleware passes
  non-members on `/tuition*`.
- Gate: feature flag `decimal_tuition` + `plans.features.tuition`; preview mode (gate
  open) when a school has no subscription row. Upgrade screen for paid-lock; disabled
  screen for flag-off. No subscription rows on the demo school → gate open.
- School-picker onboarding for fresh accounts (`/tuition/onboarding?school=<id>` →
  grade/class → create student + bridge). Verified end-to-end live.
- Acceptance (all verified this session against production):
  - unauth `/tuition` → `/login` ✓
  - teacher member → `/tuition` teacher space; `/tuition/school` → middleware → `/teacher` ✓
  - fresh student → welcome → connect school → pick grade → class → submit → `/tuition`
    "Welcome back" + DB row `students` + bridge row ✓
  - principal member → `/tuition/school` "School dashboard" ✓

## Slice 1 — DONE — verified live end-to-end
Ships: `supabase/migrations/029_tuition_slice1.sql` (strand col + CBC seed: 1 curriculum,
8 subjects, 37 strands — verified in DB) + programme builder backend/frontend. Commit
`685ac1f`. Closed by the verification round on 2026-09-12.

New modules:
- `src/lib/tuition/programmes.ts` — contract + server impl (list/create/get/save/publish/
  staff/classes/curriculum + `validateProgrammeForPublish` 6 checks).
- API routes: `/api/tuition/programmes` (+`/[id]`, `+[id]/publish`),
  `/api/tuition/staff`, `/api/tuition/classes`, `/api/tuition/curriculum`
  (auth: member role `teacher|timetable_manager|principal`, school-scoped, 404/403 guarded).
- `src/lib/tuition/current-school.ts` — server `getCurrentSchoolId()`.
- Pages: `/tuition/teacher/programmes` (TCH-02), `/new` (TCH-03..07), `/[id]` (TCH-08 manage),
  `/[id]/edit` (builder resume).
- Components: `programme-list`, `programme-builder`, `programme-builder-step-2`,
  `programme-builder-step-3`, `programme-manage`; teacher `/tuition/teacher` card updated.

### Bug fixes shipped this round (all deployed + verified)
1. **PGRST100 single-element `not.in` filters** (`064bfb4`): saveProgramme built invalid
   PostgREST `not.in.<value>` for single-item arrays (supabase-js → PostgREST bug), aborting
   module/lesson/instructor/cohort sync when a programme had exactly 1 module. Fix in
   `src/lib/tuition/programmes.ts`: branch `length===1 → .neq/.eq`, `>1 → .not/.in` (lesson
   deleters, module deleters, instructor removal, cohort removal, classes-add validation).
   Same single-element-in hazard exists elsewhere (platform.ts, message.ts, sync.ts,
   analytics.ts, billing, parent/platform routes) but arrays there come from multi-row
   queries — latent, not fixed.
2. **programmes.subject_id FK → legacy `subjects`** (`abae799` + `030_tuition_programme_subject_fk.sql`):
   the step-1 picker uses global `curriculum_subjects` ids, but the FK pointed at empty
   per-school `subjects` → `23503 `Key (subject_id)=... not present`. Migration drops the
   old FK and adds it to `curriculum_subjects(id) ON DELETE SET NULL`.
   NOTE: `assessments.subject_id`/`questions.subject_id` still reference legacy `subjects(id)`
   — the same mismatch will bite future assessment slices.
3. **Migration execution path** (`0ec15b3` + `.github/workflows/migrate.yml`): no local DB
   password; SQL is applied through a temporary `workflow_dispatch` ACTION via psql +
   `SUPABASE_DB_PASSWORD` secret. Direct host `db.<ref>.supabase.co` is IPv6-only and
   unreachable from GH runners; **session pooler** `postgresql://postgres.<ref>:<pw>@aws-0-eu-central-1.pooler.supabase.com:5432/postgres` works (run 34692928564 ✓). Keep `migrate.yml`
   for future migrations.

### Verified live this session (closes Slice 1)
- TCH-02 `/tuition/teacher/programmes` renders: "My Programmes", New programme button,
  filter pills (All/Draft/Published/Archived), empty state. ✓
- "New programme" → POST creates draft → redirects to `/new?step=1` (TCH-03). ✓
- Native `<select>` comboboxes render for type/curriculum/subject/grade/difficulty. ✓
- Builder **resume**: draft survives navigation; step=1 preloads the tree. ✓
- Save draft persists title + subject (Mathematics `16ba55be…`) + grade (Grade 7
  `3b8bf81f…`) in DB (post-FK-fix). ✓
- Step 2 Structure: module rename ("Numbers & Operations") + lesson create/rename
  ("Integers on the number line", 30 min, pos 0) persist; 1-lesson programme no longer
  aborts the module sync (fix 1). ✓
- Step 3 Content: strand=Number and Algebra (`edde5292…`), summary/intro, 2-paragraph
  body (blank-line split → jsonb array) all persist. ✓
- Step 4 Access: visibility=This school, class Grade 7 East, staff "Teacher Demo"
  (seeded `92065e90…`, user_id=teacher@decimal.app) set as **Lead**; `programme_instructors`
  persisted. Instructor autosave after a role toggle intermittently DOESN'T fire a PATCH
  (coalesce/saving-lock) — Save draft then re-verifies; latent, note for builder polish. ✓
- Step 5 Review checklist (6 gates) → Publish → **status=published, published_at set**;
  redirect to manage page shows "published" pill. ✓
- TCH-02 list now shows **All 1 / Draft 0 / Published 1 / Archived 0** with "1 module ·
  1 lesson". ✓
- Student identity + RLS: `tustudent@decimal.app` → "Terry Demo" (bridge row exists) lands
  on `/tuition` StudentHome. Published-programme catalog for students is **Slice-2** scope
  (SCH-02 view cannot render yet — no student list page exists; RLS policy for students
  exists in `028`). ✓ identity only.
- Publish gate **negative** path (missing module/content/instructor → red rows + 400):
  NOT yet exercised — quick follow-up if time permits.

### Known latent issues (future polish)
- Instructor role-toggle autosave race (above); direct API PATCH with explicit
  `instructors` works reliably (verified 200 + DB row + idempotent Save draft).
- One Gateway Timeout (504) observed on a PATCH (~cold start); Retry with backoff would
  harden `persist`.
- Recurring auth-session flake: teacher session dropped to /login mid-verification round
  then re-signed-in cleanly; uninvestigated (Suspect: supabase SSR cookie refresh under
  rapid client-nav).

## Demo/seed data (post-028/029, persists — "Demo Video Auto-Update" workflow fails per push)
- School `91c5ec0d-56ce-4ea6-a6ed-b20d408e25b3` = **Playwright Test Academy** (TEST school)
  - Grade `3b8bf81f-54f6-40c8-abaa-c43c9e8a987d` = "Grade 7"
  - Class `53f9bc11-3e5b-4c27-b15f-7c60176882e1` = "Grade 7 East"
  - members seeded: teacher/principal/finance/secretary/admissions_officer/parent
- School `bf197e21` = "Phikila Platform" (owner `kipkiruigideon890@gmail.com`, super_admin,
  no subscriptions).
- Demo accounts (`/ Demo1234!`): `principal@decimal.app`, `teacher@decimal.app`,
  `parent@decimal.app`, `finance@...`, `secretary@...`, `admissions@...`.
  `admin@decimal.app` / `Dec1m@lAdm!n2026`.
- Onboarding-created student: `tustudent@decimal.app` (id `4ea67b82-1840-44e6-a315-d65565589458`)
  → student "Terry Demo" `3c6ed455-7162-4440-a232-41a7769770da`, admission `T-489WSR`, class Grade 7 East.
  Login redirects to the platform "No School Access" screen (no school_member row) — go to
  `/tuition` explicitly to reach the student space.
- CBC seed: curriculum `2d3f1688-e457-4410-8748-65d15fed801d` = CBC — Competency Based
  Curriculum (8 subjects, 37 strands). Curriculum subject Mathematics id
  `16ba55be-a351-4328-9792-b89d759d0a34`; strand "Number and Algebra" `edde5292-6385-4eec-bb25-409e0f0fa097`.
- Staff seed for instructor gate: `programme_staff`? No — instructor sync uses `staff` list
  seeded row `92065e90-9034-4004-ae91-9d2800e8672a` (name "Teacher Demo", user_id `1b2e3952…`
  = teacher@decimal.app, school 91c5ec0d, role teacher, is_active true).
- PUBLISHED test programme (Slice-1 verification): `d16cfae6-db00-4eb9-8c3f-6902c68d50b3`
  "Grade 7 Maths — Algebra Foundations" — status **published** (2026-09-12), 1 module
  "Numbers & Operations" (`1314f2d6…`) · 1 lesson "Integers on the number line"
  (`82d7104d…`, strand Number and Algebra, 2 body blocks) · cohort Grade 7 East · lead
  instructor Teacher Demo. Test data can be reset/re-archived anytime.

## Playwright / agent-browser gotchas (learned)
- After opening a `<select>` dropdown, snapshot refs SHIFT — re-snapshot before clicking.
- Portal `<option>` clicks can fail (`Could not compute box model`); use native setter:
  `eval` set `select.value` via `HTMLSelectElement.prototype.value` descriptor then dispatch `change`.
- Fill values with `\n` inside a single `fill` can misbehave; do them separately.
- Wait for `networkidle` after each navigation; `agent-browser open <url>` for hard navs.

## Deploy / ops
- CI deploy uses `npx vercel@latest --prod --yes` (replaced the old vercel-action whose
  pinned CLI was rejected). Secrets set: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Vercel env: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` must stay in sync
  with remote (a stale anon key broke login once). Production base URL
  `https://decimal-app.vercel.app`.

## Next steps when resuming
1. Slice 1 is **DONE**. Optional follow-ups: publish-gate negative path + instructor
   toggle autosave race (see latent issues).
2. Start Slice 2 (student learn journey): Explore/My Learning/list pages + learn view +
   enrolment — build on the student RLS policy that already exists (`028`, published &
   visibility in school/public). SCH-02 published pill becomes verifiable once the student
   catalog page exists.
3. Continue Slices 2–8 per `docs/tuition/09-user-flows-and-phases.md` (Part 4).
4. NOTE: a platform migration to **Convex + WorkOS** has been initiated (see
   `docs/migration/PLAN.md`). Tuition currently lives on Supabase; the migration plan
   defers Tuition data until the auth+tenant-core wave proves out. Keep Tuition on
   Supabase until told otherwise.