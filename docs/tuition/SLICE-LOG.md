# Tuition MVP — Slice Log & Resume Point

> Purpose: record exactly where Decimal Tuition stands so work can pause (for the
> Supabase → Convex + WorkOS migration) and resume without losing context.
> Last updated: 2026-09-12 (commit `685ac1f`).

## Status bar

| Slice | Scope | Status |
|-------|-------|--------|
| 0 | Shell, auth, identity, gating, onboarding | **DONE — tested live** |
| 1 | Curriculum spine + 5-step teacher programme builder | **IMPLEMENTED, deployed, PARTIALLY tested** |
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
- Data: **Supabase** Postgres, migrations `001–029` APPLIED to remote project
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

## Slice 1 — implemented + deployed; test half-finished (PAUSE point)
Ships: `supabase/migrations/029_tuition_slice1.sql` (strand col + CBC seed: 1 curriculum,
8 subjects, 37 strands — verified in DB) + programme builder backend/frontend. Commit
`685ac1f`.

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

### Verified live this session
- TCH-02 `/tuition/teacher/programmes` renders: "My Programmes", New programme button,
  filter pills (All/Draft/Published/Archived), empty state. ✓
- "New programme" → POST creates draft → redirects to `/new?step=1` (TCH-03). ✓
- Native `<select>` comboboxes render for type/curriculum/subject/grade/difficulty. ✓
- Builder **resume**: draft survives navigation; `/tuition/teacher/programmes/
  d16cfae6-db00-4eb9-8c3f-6902c68d50b3/edit?step=1` preloads the tree (titled
  "Grade 7 Maths — Algebra Foundations"). ✓
- TCH-08 manage page renders header + tabs (Overview/Content/Access/Students/Assess/
  Results). ✓

### NOT yet tested (finish these to close Slice 1)
1. Step 1 Continue → step 2; add module + lessons; reorder; step 3 content editor
   (strand picker, body blocks, preview toggle); step 4 access (visibility, classes,
   instructors); step 5 checklist red/green + Publish success → status=published in DB.
2. Publish gate negative path (missing module/content/instructor → red rows, 400).
3. Curriculum/subject/grade values persist (subject=Mathematics, grade=Grade 7, CBC).
4. Published pill + row appears TCH-02; `/tuition/school` SCH-02 shows it.
5. Playwright session `slice1-teacher-1` was in this builder mid-edit (may be stale —
   reopen with a fresh session if refs drift).

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
- CBC seed: curriculum `2d3f1688-e457-4410-8748-65d15fed801d` = CBC — Competency Based
  Curriculum (8 subjects, 37 strands).

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
1. Close Slice 1 test (list above), fix any bugs, then mark Slice 1 DONE.
2. Continue Slices 2–8 per `docs/tuition/09-user-flows-and-phases.md` (Part 4).
3. NOTE: a platform migration to **Convex + WorkOS** has been initiated (see
   `docs/migration/PLAN.md`). Tuition currently lives on Supabase; the migration plan
   defers Tuition data until the auth+tenant-core wave proves out. Keep Tuition on
   Supabase until told otherwise.