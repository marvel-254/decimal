# Decimal Tuition — Shared Design Context (source of truth)

> Every file in this spec **MUST** follow this context. It reflects a real audit of
> `/home/marvel/decimal/decimal-app` (Next.js 16.3.4, React 19, Tailwind CSS v4,
> shadcn/ui `base-nova` on `@base-ui/react`, Supabase, Geist fonts, Recharts, Serwist PWA).

---

## 1. Non-negotiable engineering conventions

- **NO `asChild` prop.** Primitives are `@base-ui/react`, not Radix. Link+Button wrapper:
  ```tsx
  <Link href="/path"><Button>Action</Button></Link>
  ```
- Use `cn()` from `@/lib/utils` everywhere for class composition.
- Geist Sans (`--font-geist-sans`) and Geist Mono (`--font-geist-mono`), applied via CSS vars.
- Dark mode: `.dark` class on `<html>` (next-themes), CSS custom-property tokens, **not** Tailwind dark: prefixes (tokens swap automatically).
- Data fetching: **no SWR / React Query / axios.** Pattern A = thin async server component (SSR supabase client) → client child component owning local state. Mutations → browser supabase client or custom `/api/` routes wrapped in `createRoute`.
- Charts: **Recharts only** (`ResponsiveContainer`, stroke `hsl(var(--border))`, tick fill `hsl(var(--muted-foreground))`, tooltip `backgroundColor: hsl(var(--card))`).
- Toasts: `toast(message)` from `@/components/platform/toast` (string-only, 3s, bottom-right pill).
- Page wrapper convention: `<div className="space-y-6">`; page header = `h1 text-2xl font-bold text-foreground` + `p text-muted-foreground mt-1`.
- Grid rhythm: KPI `grid-cols-2 lg:grid-cols-4 gap-4`; panels `grid-cols-1 lg:grid-cols-2 gap-6`; forms `grid-cols-1 sm:grid-cols-2 gap-4`.
- Search input class (canonical): `w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary` with `<Search>absolute left-3` icon.

---

## 2. Existing design tokens (exact — reused as-is)

| Token | Light value | Dark value |
|---|---|---|
| `--background` | oklch(1 0 0) | oklch(0.145 0 0) |
| `--foreground` | oklch(0.145 0 0) | oklch(0.985 0 0) |
| `--card` / `--popover` | oklch(1 0 0) | oklch(0.205 0 0) |
| `--primary` | oklch(0.398 0.237 264.376) (#0325C3) | oklch(0.498 0.237 264.376) |
| `--primary-foreground` | oklch(0.985 0 0) | oklch(0.985 0 0) |
| `--secondary` / `--muted` / `--accent` | oklch(0.97 0 0) | oklch(0.269 0 0) |
| `--secondary-foreground` | oklch(0.205 0 0) | oklch(0.985 0 0) |
| `--muted-foreground` | oklch(0.556 0 0) | oklch(0.708 0 0) |
| `--destructive` | oklch(0.577 0.245 27.325) | oklch(0.704 0.191 22.216) |
| `--border` | oklch(0.922 0 0) | oklch(1 0 0 / 10%) |
| `--input` | oklch(0.922 0 0) | oklch(1 0 0 / 15%) |
| `--ring` | = primary | = primary |
| `--success` | oklch(0.648 0.15 160) | same |
| `--warning` | oklch(0.768 0.164 85) | same |
| `--info` | oklch(0.623 0.16 255) | same |
| `--chart-1..5` | = primary, success, warning, info, destructive | same mapping |
| `--radius` | 0.5rem (radius-sm = 0.6x, md = 0.8x, lg = 1x, xl = 1.4x, 2xl = 1.8x, 3xl = 2.2x, **4xl = 2.6x = pill**) | — |
| `--sidebar` | oklch(0.985 0 0) | oklch(0.145 0 0) |
| `--sidebar-foreground/accent/border` | derivations of above | — |

Spacing = **Tailwind default scale** (no custom spacing tokens).

Exposed utilities: `bg-primary`, `text-primary`, `bg-muted`, `text-muted-foreground`, `bg-card`, `text-success/ warning/ info`, `bg-primary/10`, `border-border`, `bg-background`, `font-heading`, `text-foreground`.

### Brand gradient (the "glow" button)
`from-primary via-[oklch(0.52_0.21_280)] to-[oklch(0.62_0.16_215)]` with `bg-[length:200%_auto]`, hover shifts position. Violet → cyan. This is Decimal's signature accent. Tuition uses a **drawn-down derivative** (see Design System file).

---

## 3. Component inventory (what exists, reuse before building)

**UI primitives (`src/components/ui/` — all on @base-ui/react):**
- `Button`: variants `default | glow | outline | secondary | ghost | destructive | link`; sizes `xs (h-6) | sm (h-7) | default (h-8) | lg (h-9) | icon | icon-sm | icon-lg`. Exports `buttonVariants`.
- `Card` + `CardHeader` + `CardTitle` (`font-heading text-base font-medium`) + `CardDescription` + `CardAction` + `CardContent` + `CardFooter`; `size="sm"`. Default `rounded-xl ring-1 ring-foreground/10`.
- `Badge`: variants `default | secondary | destructive | outline | ghost | link`; base `rounded-4xl px-2 py-0.5 text-xs font-medium h-5`.
- `Avatar` + `AvatarImage` + `AvatarFallback` + `AvatarBadge` + `AvatarGroup` + `AvatarGroupCount`; sizes `sm|default|lg`.
- `Tabs` + `TabsList` (variant `default`=bg-muted pill, `line`=underline) + `TabsTrigger` + `TabsContent`.
- `DropdownMenu` + full sub-component set (items, checkbox, radio, separator, sub, shortcut).
- `Sheet` + `SheetContent` (side: top/right/bottom/left; `sm:max-w-sm`; light overlay `bg-black/10 backdrop-blur-xs`).
- `Tooltip` (inverted: `bg-foreground text-background`), `Separator`.
- `Button`, `Card`, `Badge`, `Avatar`, `DropdownMenu` are actively used. **`Tabs`, `Sheet`, `Tooltip`, `Separator` exist but are unused — Tuition can adopt them freely.**

**Platform shell (`src/components/platform/`):**
- `shell.tsx`: `PlatformShell` — `flex h-screen overflow-hidden bg-muted/30`; fixed `Sidebar` (w-64) + `Header` (h-16 sticky, `bg-background/80 backdrop-blur-md`) + `<main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">`.
- `sidebar.tsx`: **static flat per-role arrays** in `navConfig: Record<string, NavItem[]>`; active = `pathname === href`; `disabled: true` dims item; mobile = off-canvas + backdrop (`lg:hidden`). Order: logo header, nav items, footer.
- `header.tsx`: mobile hamburger (`lg:hidden`) → Search (modal → cmd/ctrl+K) → SchoolSwitcher → SyncIndicator → SyncConflictBadge → ThemeToggle → bell dropdown (top 8 notifications, unread count) → avatar dropdown (Profile / Settings / Sign out). School switch = full page redirect.
- `search-modal.tsx`: modal, debounced 300ms, min 2 chars, currently searches `students` + `staff` only.
- `toast.tsx`: string-only `toast(message)`.
- `notification-center.tsx`: dashboard card listing top 10 notifications + mark-all-read.

**Data/UX conventions already proven:**
- KPI stat block: `rounded-xl border border-border bg-card p-5`, label `text-xs font-medium text-muted-foreground uppercase tracking-wide`, value `mt-2 text-2xl font-bold` with semantic color (`text-green-600/amber-600/blue-600/red-600`).
- Sectioned table card: `rounded-xl border border-border bg-card overflow-hidden` → header `p-4 border-b border-border bg-muted/30` + `h2 text-sm font-semibold` → `overflow-x-auto` → `table w-full text-sm`; th `p-4 text-left font-medium text-muted-foreground`; tr `border-b border-border/50 last:border-0 hover:bg-muted/30`.
- Empty row: `<td colSpan={N} className="p-8 text-center text-muted-foreground">No X found. Add your first one to get started.</td>` (contextual message: `query ? "No X match your search." : default`).
- Empty card: `py-12 text-center` + faded lucide icon (`h-8 w-8 text-muted-foreground/40 mx-auto mb-2`) + 2-line copy.
- Alert tiles: data-driven arrays `{icon,title,description,color,href}` in `grid sm:grid-cols-2 gap-3`.
- Progress bar: `h-2 rounded-full bg-muted overflow-hidden` + fill `bg-primary` (or color) width %.
- Status pill map: `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium` + tinted bg (green/amber/blue/red/gray soft).
- Switch pills (parent child-switcher): `bg-primary text-primary-foreground` active vs `bg-muted hover:bg-muted/80`.
- Initials avatar chip: `flex h-8 w-8 items-center justify-center rounded-full bg-primary/10` + `text-xs font-bold text-primary`.
- Server-paginated list with debounce + segmented status control + bulk bar: see `super-admin/users/page.tsx`.
- Modal form recipe: `fixed inset-0 z-50 flex items-center justify-center` → `absolute inset-0 bg-black/50` → panel `relative bg-card rounded-xl shadow-xl w-full max-w-md mx-4 ring-1 ring-foreground/10` → header + X → fields `space-y-4` → footer `flex justify-end gap-2`.
- Form section card: `rounded-xl border border-border bg-card p-6 space-y-5` + `h2 text-sm font-semibold uppercase tracking-wide`.
- Success/error banners: `rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive` (and emerald/amber variants).

---

## 4. Auth, roles, tenancy (exact)

- `member_role` enum: `super_admin, principal, teacher, finance, admissions_officer, secretary, parent, timetable_manager`.
- Membership rows: `school_members(user_id NOT NULL, school_id, role, is_active, joined_at)`, `UNIQUE(user_id, school_id, role)`. A user can hold several roles per school.
- Active school: `profiles.active_school_id` (validated by DB trigger 009) → `requireSchoolContext(userId)` returns `{schoolId, role, isActive}` (5-min Redis cache).
- RBAC: `requirePermission(userId, schoolId, resource, action)` → Postgres RPC `has_permission`. Permissions are `(resource, action)` strings. New tuition permission resources must be inserted into `permissions` + `role_permissions` (migration).
- Route protection: `src/middleware.ts` → `updateSession` (`src/lib/supabase/middleware.ts`) using `src/lib/auth-config.ts`: `portalRoutes`, `roleRouteMap`/`routeRoleMap`, `getAllowedRoles(pathname)` (first prefix match), `protectedPaths` array, `isProtectedPath`. Any new tuition prefix must be added to `protectedPaths` and given a role map.
- Roles → portal roots: super_admin→`/super-admin`, principal→`/principal`, teacher+timetable_manager→`/teacher`, finance→`/finance`, admissions_officer→`/admissions-officer`, secretary→`/secretary`, parent→`/parent`, shared→`/dashboard`.
- Super admin "Enter School": temporarily becomes principal in that school (`decimal_school_mode` cookie), banner shown (`SchoolModeBanner`).
- Feature gating: `feature_flags`/`school_feature_flags` (`isFeatureEnabled`, `requireFeature`) AND billing `plans.features` JSON + `requireBillingPlanFeature(schoolId, feature)` (checks active sub trialing/active/past_due, then entitlement). Plan slugs: `free, starter, pro, enterprise`; prices in KES (monthly) / pesas (annual). Use **feature_flags key `decimal_tuition` (school-scoped)** as the master switch + `plans.features.tuition` for plan gating.

---

## 5. Existing DB (reuse; no tuition tables exist yet)

58 tables. Reuse spine: `schools → academic_years → terms (is_current) → grades → classes (grade+stream) → subjects`; `students(id, school_id, class_id, ...)`, `staff(id, user_id nullable, ...)`; `class_teachers`, `teacher_subject_assignments`; `parent_student_relationships`; `exams`/`exam_results`/`grading_systems` (school exams — tuition assessments are separate); `notifications(user_id, school_id, title, message, type, is_read, deep_link)`; `announcements` (target_roles array).

**Zero name collisions** — `programmes, modules, lessons, assessments, activities, questions, question_bank` are ALL free. Next migration number: `028`.

House patterns: `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`, snake_case, `school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE` on every tenant table, `created_at timestamptz NOT NULL DEFAULT now()`, `updated_at` via `update_updated_at()` trigger where mutable, `is_active boolean DEFAULT true` for soft-delete, `is_published boolean` for content, natural key `UNIQUE(school_id, ...)`.

RLS boilerplate (copy verbatim):
- Read: `(school_id IN (select get_user_school_ids()) or is_super_admin())`
- Manage (role gate): `school_id IN (select sm.school_id from school_members sm where sm.user_id = auth.uid() and sm.role in ('principal','super_admin') and sm.is_active = true)`
- NEVER call `get_user_school_ids()` inside a `school_members` policy (recursion).
- Write-only service-role for `domain_events`/`audit_logs`.

---

## 6. Tuition product decisions (fixed — do not contradict)

1. **Route prefix:** `/tuition` (student-facing), `/tuition/teacher`, `/tuition/school`, `/tuition/network`. New route group `(tuition)` under `(platform)` — but every page resolves school context + role like existing pages. Must add prefixes to `protectedPaths` + `routeRoleMap`.
2. **Role model:** Tuition permission resources: `tuition_programme`, `tuition_lesson`, `tuition_assessment`, `tuition_activity`, `tuition_live`, `tuition_network`, `tuition_content`. Actions: `read, create, update, delete, publish, enrol, grade`. Map to built-in roles (teacher/principal can create; students/parents read-only; finance read-only).
3. **Product switcher:** new top-of-sidebar component "Decimal ▾" dropdown listing **School Management** and **Tuition**; switching navigates to `/dashboard` vs `/tuition`. State = simple path routing (no cookie needed), auth retained.
4. **Priority marks:** `P0` = MVP, `P1` = important (soon after), `P2` = later. MVP cut is strictly: Student explore/enrol/learn/assignments/MCQ assessments; Teacher builder/content/assign/monitor/MCQ; School admin overview; network benchmarking READ-ONLY; billing gating = feature flag + plan features.
5. **Programme is the core object.** `Programme → Modules → Lessons (+Resources/Assignments/Quizzes/Assessments)`, plus `ProgrammeEnrolment`, `LessonProgress`, `Cohort`, `Instructor`, `LiveSession`, `Activity/Event`, `NetworkAssessment`.
6. **Tuition look**: same tokens/shell as Decimal, plus a small set of new semantic tokens (learn/assess/activity/network/live/progress tints) and one-brand accent derived from the glow gradient. No orphan design.
7. **Steps/labels:** "Learn / Teach / Assess / Activities / Network" are the five Tuition spaces. Student nav: Home, Explore, My Learning, Classes, Assessments, Activities, Progress; Teacher: Dashboard, My Programmes, Content, Students, Assessments, Question Bank, Live Classes, Activities, Analytics; School: Dashboard, Programmes, Teachers, Students, Assessments, Activities, Network; Platform: full control.

---

## 7. Statuses that recur in tuition (define once, reuse everywhere)

- **Programme status:** `draft, published, archived`; publication scope: `private, school, classes, students, schools, network, public`.
- **Enrolment status:** `invited, active, completed, dropped`.
- **Lesson state:** `locked, available, in_progress, completed`.
- **Assignment status:** `draft, open, grading, closed`; submission: `none, draft, submitted, late, graded`.
- **Assessment status:** `draft, scheduled, open, closed, published_results`; attempt: `not_started, in_progress, submitted, graded`.
- **Activity status:** `draft, registrations, in_progress, results, completed, cancelled`.
- **Content types (resource):** `video, pdf, document, audio, image, presentation, link, embed`.
- **Difficulty:** `beginner, intermediate, advanced` (all content).
- **Network benchmark privacy:** only aggregated, anonymized cross-school data (school shows own students, never other schools' student identities).

All wireframe volumes must use these exact labels/statuses.

---

## 8. Settled consistency decisions (folded from audit — T1–T11)

> These items were debated across the spec suite and are now **locked**. Future readers
> treat them as authoritative alongside §1–§7.

### 8.1 Role resolution (T2, T3)

`student` and `parent` are **product user types**, not `member_role` values. Neither appears in middleware or `routeRoleMap`. Student/parent tuition identities are resolved at the tuition **layout** level via `tuition_student_users.user_id` / `students.parent_user_id`; middleware only protects member-role portals. The layout dispatches student → student shell, parent → read-only mirror of linked children.

**Read-only roles in school scope** — `finance`, `admissions_officer`, `secretary` have read-only tuition access inside their school: RBAC `read` + `view_results` on tuition resources (dashboard, programmes, assessment statistics, activities, network aggregates). They **never** create, edit, publish, grade, or enrol.

**Network guard tiers** — teacher has `read` + participate on `/tuition/network`; adopt/publish requires `principal` or `super_admin`; moderation (approve/reject/feature) is `super_admin` only.

(Owner files: `02-information-architecture.md` §8, `10-route-architecture.md` §2–§3, `04-screen-inventory.md`)

### 8.2 Notification deep-link rule (T10)

A `deep_link` starting with `/tuition` **MUST** render as `<Link>` into the tuition routes (product-aware) — never a raw anchor or `window.location` jump. The active product persists in `localStorage` under the key **`decimal:lastProduct`** (hydrated on boot for header, bell, and badge state); when the key is unset, SYS-01 derivation `activeProduct = pathname.startsWith("/tuition") ? "tuition" : "school"` is the fallback.

If the linked tuition route requires a role the current user lacks, or student/parent identity resolution fails, show the standard permission/error state ("You don't have permission to do that here.") rather than a dead link.

(Owner file: `08-wireframes-system.md` SYS-03 §Deep-link resolution)

### 8.3 Live class provider (T8)

`live_classes.provider` defaults to **`'decimal'`**: Decimal replay + chat room, no WebRTC in P1. `LiveRoom` renders the replay video + chat/Q&A/polls for `provider='decimal'` and surfaces an optional external `meeting_url` (Google Meet / Zoom) embed as a **"Join via video link"** fallback. `recording_url` holds the replay after the class ends (moves into the STU-14 / TCH-19 replay list). First-party WebRTC rooms are **Phase 2** and out of scope for P1; `join_links jsonb` is retained for that future provider slot.

(Owner file: `11-data-model.md` §5, `12-component-and-implementation-map.md` Part 1.4 LiveRoom + Part 5 T8 note)

### 8.4 Assignment permissions (T9)

Assignments reuse the **`tuition_assessment`** resource entirely. An assignment **is** a manual-grade assessment scoped to a programme module — there is no `tuition_assignment` resource and no `tuition_lesson`/`tuition_activity` mapping. Create/update/publish → `tuition_assessment.create` / `.update` / `.publish`; grade/submissions → `tuition_assessment.grade`; students view own submissions via the identity link (no permission row).

(Owner file: `12-component-and-implementation-map.md` Part 6.3 + Part 5 rows 15–16)

### 8.5 Button variant tuition spec (T7)

`Button` gains `variant: "tuition"` → `bg-tuition-accent text-white hover:bg-tuition-accent/90 focus-visible:ring-tuition-accent/50`, inheriting existing size/geometry/loading/disabled rules from `@/components/ui/button`. Prerequisites: `--tuition-accent` token in `globals.css` §1.1 **and** the `tuition` variant added to `button.tsx`. Must land **before any tuition component**.

(Owner file: `12-component-and-implementation-map.md` Part 1.4 button row + Part 7 T7)

### 8.6 Canonical screen totals (T1, T4–T6)

The authoritative screen enumeration is **`04-screen-inventory.md`**: **75 screens** total — SYS **6**, STU **20**, TCH **21**, SCH **12**, NET **8**, AUTH **7** (pattern specs), BILL **1** (pattern spec). Per priority: **P0 = 48 · P1 = 25 · P2 = 2**. The earlier "≈57" and "22+26+9" counts are superseded. All future derivations must reference this file as the source of truth for screen counts and priority assignments.

The settled data-model table names are `programme_modules` / `programme_lessons` (endpoints pluralise); `programme_reviews` is in migration 032; `assessment_attempts` carries `attempt_no` on all attempts with a partial unique index `UNIQUE(assessment_id, student_id) WHERE attempt_no = 1` for limit=1.

(Owner files: `04-screen-inventory.md`, `11-data-model.md`, `10-route-architecture.md`)