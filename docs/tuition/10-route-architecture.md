# DECIMAL TUITION — SPEC FILE 10 — Route Architecture

> Implementation blueprint matching Next.js 16 App Router + existing middleware/auth.

## 1. Route group placement

Tuition lives inside the existing `(platform)` auth gate as a new route group so it inherits `(platform)/layout.tsx` (auth + role + school resolution) AND can diverge where needed:

```
src/app/(platform)/
├── layout.tsx            # existing — resolves user, role, active school
├── (tuition)/
│   ├── layout.tsx        # NEW TuitionShell (product switcher + space rail + breadcrumbs)
│   ├── page.tsx          # /tuition  → student Home (or role-aware redirect)
│   ├── explore/page.tsx
│   ├── my-learning/page.tsx
│   ├── programmes/[id]/page.tsx
│   ├── learn/[programmeId]/[lessonId]/page.tsx
│   ├── assignments/page.tsx
│   ├── assignments/[id]/page.tsx
│   ├── assessments/page.tsx
│   ├── assessments/[id]/instructions/page.tsx
│   ├── assessments/[id]/take/page.tsx
│   ├── assessments/[id]/result/page.tsx
│   ├── classes/page.tsx
│   ├── classes/[id]/page.tsx
│   ├── activities/page.tsx
│   ├── activities/[id]/page.tsx
│   ├── progress/page.tsx
│   ├── achievements/page.tsx
│   ├── certificates/page.tsx
│   ├── onboarding/page.tsx
│   ├── teacher/...        # Teach space (TCH-01..21)
│   ├── school/...         # Admin space (SCH-01..12)
│   ├── network/...        # Platform space (NET-01..08)
│   ├── profile/...
│   ├── notifications/page.tsx
│   ├── search/page.tsx
│   └── settings/page.tsx
```

Dynamic segments follow existing conventions: `[id]` for programmes/assessments/classes/activities; teacher management routes mirror `(platform)` flat style.

## 2. Layout responsibilities

`(tuition)/layout.tsx` (client shell, same pattern as `PlatformShell`):
- Reads the resolved `role` (passed down from `(platform)/layout` via server-rendered props or re-fetch of context).
- Renders `ProductSwitcher` (top) → `SpaceRail` (Learn/Teach/Assess/Activities/Network) → `<main>`.
- The tuition layout is the identity bridge: middleware never resolves `student`/`parent`, it only gates member-role portals. Inside the layout, if the auth user resolves to a `students` row (via `tuition_student_users.user_id` or `students.parent_user_id`), render the student shell → `/tuition` student Home.
- For users with **no student identity who are member-role users**, the `/tuition` root is a role-aware dispatch:
  - teacher + timetable_manager → `/tuition/teacher`
  - principal, super_admin → `/tuition/school`
  - finance, admissions_officer, secretary → `/tuition` read-only view of their school (RBAC `read` + `view_results`; never create/edit/publish/grade/enrol)
  - super_admin (platform) → `/tuition/network`
  - parent → `/tuition` student view of their linked children **read-only**
- Immersive routes opt OUT of the rail: `learn/[...]`, `assessments/[id]/take`, `classes/[id]` use a `PlayerLayout` (full-bleed, no left rail, minimal top chrome, optional offline banner).

## 3. Auth-config (`src/lib/auth-config.ts`) changes

```ts
// Add to protectedPaths:
"/tuition",

// Add to routeRoleMap (prefix → allowed member_role values only:
// super_admin, principal, teacher, finance, admissions_officer, secretary, parent).
// `student`/`parent` identities are NOT in the map — they are resolved in the
// tuition layout's identity bridge (`tuition_student_users.user_id`,
// `students.parent_user_id`), not middleware:
"/tuition/teacher":   ["teacher", "timetable_manager", "principal", "super_admin"],
"/tuition/school":    ["principal", "super_admin", "finance", "admissions_officer", "secretary"],  // read-only for finance/admissions_officer/secretary
"/tuition/network":   ["super_admin", "principal", "teacher"],                                     // teacher = read + participate; adopt/publish = principal+; moderate = super_admin
// "/tuition" base: auth-gated only (NOT role-mapped) — the tuition layout dispatches
// member roles, parents, and students after resolving identity.
```

Middleware intentionally stays coarse: it blocks unauthenticated users and role misfits at the *space* level for member-role portals only. `student`/`parent` identity resolution is deliberately NOT middleware's job — it lives in the tuition layout's identity bridge. Fine-grained checks (is this teacher allowed to edit THIS programme?) happen in the layout + API via `requirePermission(userId, schoolId, "tuition_programme", "update")` and ownership checks.

## 4. API surface (new route handlers under `src/app/api/`)

```
/src/app/api/tuition/
├── programmes/            GET list · POST create (builder saves as draft)
│   └── [id]/              GET detail · PATCH update · DELETE (ownership check)
│       ├── modules/       GET/POST (structure saved whole as JSON steps then normalized)
│       ├── lessons/[lid]/ GET · PATCH (content, resources)
│       └── publish/       POST (validates → sets published)
├── enrol/                 POST (join a programme) · DELETE (leave)
├── my-learning/           GET (student enrolled programmes + progress)
├── progress/              GET (per-student aggregate for current school)
├── lessons/[id]/complete  POST (mark complete → lesson_progress)
├── notes/                 GET/POST/DELETE (per-lesson student notes)
├── assignments/           GET list · POST create
│   └── [id]/submissions/  POST create/update draft · POST submit · GET (teacher)
├── assessments/           GET list · POST create
│   └── [id]/attempts/     GET resume · POST start · POST answer(autosave) · POST submit
├── question-bank/         GET search · POST create · PATCH · DELETE
├── activities/            GET · POST (register participant)
├── classes/               GET (live class schedule)
├── network/               GET (aggregated benchmarking READ-ONLY)
└── analytics/             GET (teacher/school aggregations)
```

All handlers wrap `createRoute`; every mutation behind `requirePermission` with tuition resources; every read scoped to `requireSchoolContext`.

Network guard tiers: `GET` reads + participation (enrol in school-adopted assessments/programmes) for teacher+ (teacher, principal, super_admin); adopt/publish network content for principal+ (principal, super_admin); moderation (approve/reject/feature) for super_admin only. `finance`/`admissions_officer`/`secretary` get `read` + `view_results` only on `/api/tuition/*` paths — they can read data inside their school but never create/edit/publish/grade/enrol.

## 5. Key route-level rules

- `/tuition/learn/[programmeId]/[lessonId]` and assessment `take` must be reachable offline on PWA → they are the caching targets for the service worker + IndexedDB.
- All routes respect `profiles.active_school_id`; switching school in the header remains a full-page reload (existing behavior).
- Student-Home `/tuition` shows the active school's curricula + network tabs; cross-school aggregation only via network routes (aggregated).
- 404/not-found and error boundaries inherit `(platform)/error.tsx`; `(tuition)` can add its own `not-found.tsx` + `loading.tsx` (skeletons).