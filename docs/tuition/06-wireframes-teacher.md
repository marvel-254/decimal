# DECIMAL TUITION — SPEC FILE 06 — Teacher Wireframes (TCH-01 → TCH-21)

> Source of truth: `_context.md` (tokens, statuses, roles), `03-design-system.md` (Tuition tokens,
> components, responsive + a11y rules), `02-information-architecture.md` (routes + teacher nav),
> `04-screen-inventory.md` (TCH rows), `11-data-model.md` (entities).
> Priorities: TCH-01, 02, 03–08, 11, 13, 14, 15, 16, 17, 18 = **P0** · TCH-09, 10, 12, 19, 21 = **P1** · TCH-20 = **P2**.

---

## 0. Conventions used across every screen

- **Teacher Shell** (per screen below, "Layout" shows it compactly). From IA §4: nav order = Dashboard → My
  Programmes → Content → Students → Assignments → Assessments → Question Bank → Live Classes → Activities →
  Analytics, with a pinned `+ New` button under the nav (New Programme · New Assessment · New Lesson). Header =
  hamburger (`lg:hidden`) → Search (`⌘K`) → SchoolSwitcher → SyncIndicator → SyncConflictBadge → ThemeToggle →
  bell (top 8, unread count) → avatar menu. ProductSwitcher ("◉ DECIMAL ▾") sits above the nav.
- **Hero CTA colour:** Tuition primary action = `variant="tuition"` → `bg-tuition-accent text-tuition-accent-foreground hover:bg-tuition-accent/85`. Neutral actions keep `default`. Destructive keeps `destructive`.
- **Semantic tints** used only where they answer a question: Learn=blue (`--tuition-learn`), Teach=violet
  (`--tuition-accent`), Assess=violet (`--tuition-assess`), Activities=green (`--tuition-activity`),
  Network=amber (`--tuition-network`), Live=blue (`--tuition-live`), Progress=green (`--tuition-progress`).
  Applied at low-opacity surfaces: `bg-tuition-assess/10 text-tuition-assess`.
- **Status pills are canonical:** `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium` +
  tinted bg (green/amber/blue/red/gray soft), driven by the `_context.md` §7 status maps:
  - Programme: `draft`(gray) · `published`(green) · `archived`(red); scope `private|school|classes|students|schools|network|public`.
  - Enrolment: `invited`(gray) · `active`(blue) · `completed`(green) · `dropped`(red).
  - Lesson: `locked`(gray) · `available`(green) · `in_progress`(blue) · `completed`(green).
  - Assignment: `draft`(gray) · `open`(green) · `grading`(amber) · `closed`(red); submission `draft`(gray) · `submitted`(blue) · `late`(red) · `graded`(green). (`none` = never displayed as a stored row; shown UI-side as "Not started".)
  - Assessment: `draft`(gray) · `scheduled`(blue) · `open`(green) · `closed`(red) · `published_results`(green); attempt `not_started`(gray) · `in_progress`(blue) · `submitted`(amber) · `graded`(green).
  - Activity: `draft`(gray) · `registrations`(blue) · `in_progress`(amber) · `results`(blue) · `completed`(green) · `cancelled`(red).
  - Content type chips: `video`(blue) · `pdf`(red) · `document`(gray) · `audio`(violet) · `image`(green) · `presentation`(amber) · `link`(info) · `embed`(violet). Difficulty: `beginner`(green) · `intermediate`(amber) · `advanced`(red).
- **Sectioned table card** (from `_context.md` §3): `rounded-xl border border-border bg-card overflow-hidden` →
  header `p-4 border-b border-border bg-muted/30` + `h2 text-sm font-semibold` → `overflow-x-auto` →
  `table w-full text-sm`; `th p-4 text-left font-medium text-muted-foreground`; `tr border-b border-border/50 last:border-0 hover:bg-muted/30`. **Mobile:** tables collapse to stacked label/value rows (see Mobile Behavior per screen).
- **KPI stat block:** `rounded-xl border border-border bg-card p-5`, label `text-xs font-medium text-muted-foreground uppercase tracking-wide`, value `mt-2 text-2xl font-bold`.
- **Charts — Recharts only** (`ResponsiveContainer`, stroke `hsl(var(--border))`, tick fill `hsl(var(--muted-foreground))`, tooltip `backgroundColor: hsl(var(--card))`, series coloured with `--tuition-*` tokens). Every chart carries a **caption** stating the question it answers and its **empty state**.
- **States required per screen:** loading skeleton, empty, error (with retry), success, permission-denied inline, offline banner (reuse `SyncIndicator` pattern). Dark mode resolves automatically through CSS custom-property tokens — never `dark:` prefixes.
- Page wrapper `space-y-6`; page header `h1 text-2xl font-bold text-foreground` + `p text-muted-foreground mt-1`.

---

## TCH-01 Teacher Dashboard (ID: TCH-01)

### Purpose
The daily cockpit for a teacher. Answers: "What do I need to teach, mark, set up, and check today?" —
quick actions to create content, today's + upcoming live classes, grading backlog, at-risk students, and a
snapshot of active programmes — plus a "needs attention" feed.

### User
Teacher (`member_role = teacher`; also timetable_manager, principal and super_admin in school mode for read).

### Route
`/tuition/teacher` (also the role-aware redirect target for teachers landing on `/tuition`).

### Navigation
Teacher Shell. Breadcrumb: `Tuition / Teach / Dashboard`. Left nav item **Dashboard** is `aria-current="page"`.
ProductSwitcher shows **Tuition** active. Reached from `/tuition` dispatch when role resolves to teacher.

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ ◉ DECIMAL ▾  Dash│Prog│Cont│Stud│As#│Asm│Qb│Live│Act│Any │ +New▾│
├────────────┬──────────────────────────────────────────────────┤
│ ▸ Dashboard│  Tuition / Teach / Dashboard     ⌕ ⌘K  🔔9 ☀ ⍙   │
│ ▸ Program.s│──────────────────────────────────────────────────│
│ ▸ Content  │  Jambo, Mr. Otieno                 [Autumn Term]  │
│ ▸ Students │  Kijani Ridge Academy · Mon 11 Sep · 7 things     │
│ ▸ Assigns  │  need you today.                                   │
│ ▸ Assessmts│  ┌──────────────────────────────────────────────┐ │
│ ▸ Q-Bank   │  │ Quick actions · Teach                        │ │
│ ▸ Live Cls │  │ [+Programme][+Lesson][+Assessment]           │ │
│ ▸ Activiti │  │ [+Assignment][+Class][+Activity]             │ │
│ ▸ Analytics│  └──────────────────────────────────────────────┘ │
│            │  ┌──────────────┬──────────────┬──────────────┐  │
│  + New ▾   │  │ Active progs │ Students     │ Pending grade│  │
│            │  │ 7 · 4 live   │ 128 · 42/wk │ 34 submissions│  │
│            │  └──────────────┴──────────────┴──────────────┘  │
│            │  ┌────────────────────────────────────┐          │
│            │  │ Teach today · Live classes          │          │
│            │  │ [Algebra Mastery · F1M] 9:40 → Join│          │
│            │  │ [Amoeba & Ecology · Bio F2] 2hr    │          │
│            │  └────────────────────────────────────┘          │
│            │  ┌──────────────────────┬───────────────────────┐ │
│            │  │ Needs attention      │ My programmes         │ │
│            │  │ • 34 to grade (Asn…  │ [Algebra Mastery █75%]│ │
│            │  │ • 5 low prog alerts  │ [Amoeba… █42%]  → All │ │
│            │  │ • 2 tests close today│ [CBC Eng █ 8%]        │ │
│            │  └──────────────────────┴───────────────────────┘ │
└────────────┴──────────────────────────────────────────────────┘
```

Two-pane: fixed sidebar (12–14 cols) + scrollable main. Main = `space-y-6` stack of (welcome,
quick-actions card, KPI grid `grid-cols-2 lg:grid-cols-4 gap-4`, two `lg:grid-cols-2 gap-6` panels).

### Components
`TuitionShell`, `ProductSwitcher`, `SpaceRail`, `StatusPill`, `ProgressBar`, `Button` (`tuition`, `outline`, `ghost`, icon), `Badge`, `Card`+`CardHeader`/`CardContent`, `Avatar`, `DropdownMenu`, `Sheet` (mobile quick-actions), `DataState`, `Skeleton`, notification bell + `SyncIndicator` from platform header.

### Content & data
- **Welcome:** teacher first/last name (`staff` joined to `profiles`), school name from active school, current `terms` label (`is_current`), date, count of pending items ("7 things need you today").
- **Quick actions (6):** Create Programme → `/tuition/teacher/programmes/new?step=1`; Create Lesson → opens programme picker then `/tuition/teacher/programmes/[id]/edit?step=3`; Create Assessment → `/tuition/teacher/assessments/new`; Create Assignment → `/tuition/teacher/assignments?create=1`; Schedule Class → `/tuition/teacher/classes?create=1`; Create Activity → `/tuition/teacher/activities?create=1`.
- **KPIs:** Active programmes (`status = published` + one `draft` count breakout), Students enrolled (sum of `programme_enrolments` where `status != dropped`, distinct students), Pending grading (submissions `submitted|late` across assignments in `grading` or `open`), Assessments to schedule (assessments `draft` with availability set).
- **Teach today:** `live_classes` where `starts_at` in current day or next 7 days; `Join` for `live`, countdown for `scheduled`, `Replay` when `ended`.
- **Needs attention:** data-driven alert tiles (icon, title, description, colour, href) — grading backlog, low-progress alerts (`lesson_progress` < 25% after 7 days), assessments closing soon (`close_at` within 48h), dropped-enrolment spike.
- **My programmes:** top 3 `programmes` by own students, cover, title, `ProgressBar` avg, tile → link-step to Manage programme.

### Primary CTA
**Create Programme** (`variant="tuition"`) in Quick actions — top-left of the action grid; the single most-likely daily nav.

### Secondary Actions
Create Lesson / Assessment / Assignment / Class / Activity (outline buttons in Quick actions grid); "View all" on My programmes → TCH-02; per-alert `href`; mark-notifications-read on bell.

### Filters / Search / Sort / Pagination
None on dashboard (aggregation). Global `⌘K` bangs to `/tuition/search`. "Needs attention" is the implicit filter.

### Permissions
`tuition_programme:create | update`, `tuition_assessment:create`, `tuition_activity:create`, `tuition_live:create` for action CTAs (hide/disable without). Read of KPIs via `requireSchoolContext(userId)`. Principal read-only in school mode. Missing permission → action button disabled + tooltip "Ask a principal to enable creating".

### Empty State
First-run teacher: welcome card as `EmptyState` (`GraduationCap` icon) — "Welcome to Teaching. Create your first programme to start engaging your students." with one `+ Create first programme` CTA; Quick actions grid still visible; KPI tiles show `–`; "Teach today" is empty.

### Loading State
`DataState` skeletons: KPI row = 4 `Skeleton h-20`, action grid = 6 `Skeleton h-10`, panel skeletons `h-40`; welcome line `Skeleton h-6 w-64`. No layout shift.

### Error State
Alert banner at top of main: `rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm` + RotateCcw Retry button re-running the dashboard query (server component → client child on local state, Pattern A). If feature flag `decimal_tuition` off → fullscreen "Tuition is not enabled for your school" + link to principal.

### Success State
Transient only: `toast("Programme created — continue building")` after quick-action submission returns. No permanent banner.

### Mobile Behavior
Sidebar becomes off-canvas drawer (`lg:hidden`, hamburger in header). Quick actions wrap to `grid-cols-2` with `grid-cols-1` on the KPI row; "Teach today" join buttons full-width; bottom spacing to clear. Tables (none here) absent. Touch targets ≥40px on join buttons.

### Accessibility
`aria-current="page"` on Dashboard nav; icon-only head icons `aria-label`; alert regions `role="status"` for "7 things need you today"; contrast: KPI values use 700 weight on `--foreground`; focus ring `focus-visible:ring-3 ring-ring/50` on quick actions; motion via transitions only (reduced-motion safe).

### Related Screens
TCH-02 (My Programmes) · TCH-08 (Manage programme) · TCH-13 (Assignments grading) · TCH-19 (Live classes) · TCH-21 (Analytics).

---

## TCH-02 My Programmes (ID: TCH-02)

### Purpose
Full inventory of a teacher's programmes with status filtering, per-programme stats (enrolments, students,
completion, rating) and one-click actions (edit builder, manage, preview, archive). "Which programme needs my attention next?"

### User
Teacher. Principal (read). super_admin in school mode (read).

### Route
`/tuition/teacher/programmes`

### Navigation
Teacher Shell, breadcrumb `Tuition / Teach / My Programmes`. Left nav **My Programmes** active. Entry points: dashboard "View all", quick action "Create Programme", manage-programme back-link.

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│ ◉ DECIMAL ▾  Dash│Prog│Cont│Stud│As#│Asm│Qb│Live│Act│Any │+New▾ │
├────────────┬───────────────────────────────────────────────────┤
│ ▸ Dashboard│  My Programmes                    [+ New programme] │
│ ▸Programmes│  Search programmes | All ▾ | Sort: Updated ▾      │
│ ▸ Content  │  All▼ Draft(3) Published(4) Archived(2)          │
│ ▸ Students │  ┌────────────────────────────────────────────┐  │
│ ▸ Assigns  │  │ KPI strip: Total · Published · Draft · Sden.│  │
│ ▸ Assessmts│  │          · Avg completion                     │  │
│ ▸ Q-Bank   │  └────────────────────────────────────────────┘  │
│ ▸ Live Cls │  ┌────────────────────────────────────────────┐  │
│ ▸ Activiti │  │ Sectioned table · Your programmes          │  │
│ ▸ Analytics│  │ Thumb | Title · type | Grade | Sudts| %cmp │  │
│            │  │ [▣]│Algebra Mastery    │F1 Math │42   │ 75%│  │
│            │  │    │Form1 · Str 1-4    │beginner│     │ ███│  │
│            │  │    │[published]                    │ ⋯    │  │
│            │  │ [▣]│Amoeba & Ecology…   │Bio F2  │28   │ 42%│  │
│            │  │ [▣]│CBC Grade 6 Eng…    │Eng G6  │ 0   │  — │  │
│            │  │    │[draft] Add content               │ ⋯    │  │
│            │  │  · 1 of 4 rows · 8 total · ← →        │    │  │
│            │  └────────────────────────────────────────────┘  │
│  + New ▾   │                                                  │
└────────────┴──────────────────────────────────────────────────┘
```

Main = `space-y-6`: header + primary action, toolbar (search, scope/sort, status segments), KPI strip
(`grid-cols-2 lg:grid-cols-5 gap-4`), sectioned table card.

### Components
`Button` (`tuition` + icon), `Card`/`Kpi` block, `StatusPill` (programme + difficulty), `ProgressBar`, `AvatarGroup` (student avatars), `Badge` (type chip), `DropdownMenu` (row actions), `Search` input (canonical), segmented status control (switch pills `bg-primary` active), `DataState`, `EmptyState`, `ProgrammeCover` thumb.

### Content & data
- **KPI strip:** Total programmes; Published; Draft; Students enrolled (sum non-dropped); Avg completion (`avg(programme_enrolments.progress_pct)` over active).
- **Rows:** `programmes` where `owner_staff_id` = current staff (or creator). Columns: cover (`ProgrammeCover aspect-video h-12`), Title + type badge (`course|revision|remedial|exam_prep|club…`) + curriculum code, Grade · Subject · difficulty chip, Students (count + `AvatarGroup` up to 3), Completion `ProgressBar` + %, Status pillar (`draft|published|archived`), updated-at (Geist Mono `text-xs`).
- **Row menu (⋯):** Edit plan → builder (`?step=2`), Manage → TCH-08, Preview (student view), Duplicate, Archive/Restore, Delete (draft only, dedicated confirm modal).

### Primary CTA
**+ New programme** — `variant="tuition"`, top-right of header → TCH-03 step 1.

### Secondary Actions
Per-row ⋯ (Edit / Manage / Preview / Duplicate / Archive / Delete); status segment taps; pagination; per-row quick "Add content" chip for drafts (`outline`).

### Filters / Search / Sort / Pagination
- Search: canonical input, debounced 300ms, min 2 chars, matches title/slug/subject/topic tags.
- Status segments: `All | Draft | Published | Archived` (switch pills).
- Sort dropdown: Updated (newest) · Created · Title A→Z · Most students.
- Pagination: server-side, 10/page, page numbers + Prev/Next; `colSpan` empty-row message is `query ? "No programmes match your search." : "No programmes yet. Create your first one to get started."`

### Permissions
Read: own + school programmes where RLS passes (staff of school). Write gate `tuition_programme:update|delete` must match ownership (`owner_staff_id`) or principal. Archive requires `update`. Delete allowed on `draft` only.

### Empty State
`EmptyState` (`Library` icon): "No programmes found. Add your first one to get started." → CTA `+ Create programme`. Under a filter: "No programmes match your search." Clears filter action.

### Loading State
KPI skeletons (`h-20`) + 5 row skeletons (`h-16`) with `animate-pulse rounded-lg bg-muted`; search bar remains interactive.

### Error State
Inline banner in card header: destructive tinted box "Couldn't load your programmes." + `Retry` (re-query local client state). 403 → permission-denied inline card.

### Success State
`toast("Programme published")` on publish-from-here; `toast("Programme archived")`; delete → `toast("Programme deleted")`. Row updates in place.

### Mobile Behavior
Sectioned table collapses to stacked cards per programme: cover 16:9 across top, title + status row, meta rows as `label: value` pairs (Students, Completion as ProgressBar), actions as row of icon buttons; segment pills scroll horizontally (`overflow-x-auto`, no snap required). Programmes are interaction-critical → stacked not horizontally scrolled.

### Accessibility
Caption element on table (`scope="col"`); segment control as radiogroup with keyboard arrows; ⋯ menu arrow-key navigable + Escape close; touch targets ≥ 32px icon rows, ≥40px on touch; `aria-current="page"` on My Programmes; status pill colour always paired with an icon or label so it isn't colour-only.

### Related Screens
TCH-01 (dashboard) · TCH-03 (builder step 1) · TCH-08 (manage) · TCH-11 (students by programme) · TCH-21 (analytics).

---

## TCH-03 — TCH-07 Programme Builder (multi-step flow) (IDs: TCH-03–TCH-07)

> One flow, five steps, one route: `/tuition/teacher/programmes/new?step={1..5}`. Edits reuse
> `/tuition/teacher/programmes/[id]/edit?step={n}`. All steps render in a single stepper layout below;
> progress persists as a `draft` programme row so a teacher can leave and resume.

### Stepper layout (shared TCH-03…07)

```
┌────────────────────────────────────────────────────────────────┐
│ ◉ DECIMAL ▾  Dash│Prog│Cont│Stud│As#│Asm│Qb│Live│Act│Any │+New▾ │
├────────────┬───────────────────────────────────────────────────┤
│ ▸Dashboard │  Tuition / Teach / My Programmes / New programme  │
│ ▸Programmes│───────────────────────────────────────────────────│
│ ▸ Content  │  Stepper:  1 Details ─ 2 Structure ─ 3 Content ─  │
│ ▸ Students │           4 Access ─ 5 Review & publish            │
│ ▸ Assigns  │  ●───○───○───○───○     [step title + helper]      │
│ ▸ Assessmts│───────────────────────────────────────────────────│
│ ▸ Q-Bank   │  <STEP BODY — varies below>                        │
│ ▸ Live Cls │                                                    │
│ ▸ Activiti │  ┌──────────────────────────────────────────────┐  │
│ ▸ Analytics│  │ footer: Save draft | Back | Continue ▶tuition│  │
│            │  └──────────────────────────────────────────────┘  │
│  + New ▾   │  Autosaved just now · draft id 3f9c…2b             │
└────────────┴────────────────────────────────────────────────────┘
```

Stepper = clickable numbered pills; complete steps get `✓`; current step `bg-tuition-accent text-tuition-accent-foreground`; visited steps `bg-muted`. Footer `Continue` = `variant="tuition"`, `Back` = `outline`, `Save draft` = `ghost`. Autosaves on blur + every 30s via browser supabase client; `role="status"` live region "Autosaved just now". Discard = confirm modal when dirty.

---

## TCH-03 (Step 1) — Programme Builder: Details (ID: TCH-03)

### Purpose
Capture the identity of the programme: title, type, curriculum alignment (subject, grade, curriculum,
strands), difficulty, duration, cover, description, learning outcomes and prerequisites. Autosaves as a
`draft` programme row so work is never lost.

### User
Teacher (author). Principal read. super_admin school-mode read.

### Route
`/tuition/teacher/programmes/new?step=1` · edit: `/tuition/teacher/programmes/[id]/edit?step=1`

### Navigation
Stepper layout; **Step 1** active. Up next → Step 2 (Structure). Back/Cancel to TCH-02.

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│ ◉ DECIMAL ▾  Dash│Prog│Cont│Stud│As#│Asm│Qb│Live│Act│Any │+New▾ │
├────────────┬───────────────────────────────────────────────────┤
│ ▸Dashboard │  Tuition / Teach / My Programmes / New programme  │
│ ▸Programmes│───────────────────────────────────────────────────│
│ ▸ Content  │  Stepper  1 Details ●─── 2 ─── 3 ─── 4 ─── 5     │
│ ▸ Students │  Tell students what this programme is about       │
│ ▸ Assigns  │  ┌─────────────────────────────────────────────┐  │
│ ▸ Assessmts│  │ Programme details  (form grid 2-col)        │  │
│ ▸ Q-Bank   │  │ Programme name*    [Algebra Mastery        ]│  │
│ ▸ Live Cls │  │ Type*   [course ▾]  Curriculum* [CBC ▾]    │  │
│ ▸ Activiti │  │ Subject* [Mathematics ▾]  Grade* [Form 1 ▾]│  │
│ ▸ Analytics│  │ Difficulty [beginner ▾]  Duration [6 weeks]│  │
│            │  │ Strands  [Numbers ▾]+[Algebra ▾]+[+ strand]│  │
│            │  └─────────────────────────────────────────────┘  │
│  + New ▾   │  ┌─────────────────────────────────────────────┐  │
│            │  │ Cover  [▣ drop/upload cover 16:9]  Optional │  │
│            │  └─────────────────────────────────────────────┘  │
│            │  ┌─────────────────────────────────────────────┐  │
│            │  │ Description*  (textarea)                    │  │
│            │  │ "Master algebraic expressions, linear eqs & │  │
│            │  │  word problems for Form 1 Mathematics…"     │  │
│            │  │ Learning outcomes (list, one per line)      │  │
│            │  │  ✓ solve linear equations in one variable   │  │
│            │  │  ✓ factorise simple quadratic expressions   │  │
│            │  │  [+ Add outcome]                            │  │
│            │  │ Prerequisites (optional)                    │  │
│            │  └─────────────────────────────────────────────┘  │
│            │  footer: Discard · Save draft · Continue ▶        │
└────────────┴────────────────────────────────────────────────────┘
```

Form sections as `Form section card` (`rounded-xl border border-border bg-card p-6 space-y-5`, header
`h2 text-sm font-semibold uppercase tracking-wide`). Grid `grid-cols-1 sm:grid-cols-2 gap-4`. Cover on the
right of section 1 (`lg:grid-cols-[1fr,220px]` for the cover dropzone).

### Components
Canonical inputs/selects (`appearance-none` + chevron), `MultiSelect` strand chips, `FileDropzone` cover,
dynamic outcome list (input + remove `X`, `+ Add`), `Button` (`tuition` / `outline` / `ghost`), `Badge`,
`DataState`, live "Autosaved" chip (Geist Mono).

### Content & data
- **Fields exact** (`programmes`): `title`(Programme name*), `type` (course|revision|remedial|exam_prep|club|sports|music|drama|debate|science|technology|competition|leadership|holiday|custom), `subject_id` (from `subjects` or `curriculum_subjects`), `grade_id` (grades), `curriculum_id` (CBC / 8-4-4 / IGCSE), `difficulty` (beginner|intermediate|advanced), `duration_weeks`, strands multi-select (`curriculum_strands`, e.g. "Numbers — Strand 1", "Algebra — Strand 2"), `cover_url`, `description`, `learning_outcomes` jsonb array, `prerequisites` text.
- Helper text under each label (`text-xs text-muted-foreground`), required fields marked `*`.
- Type field influences badges + Explore filters; strands feed student topic analysis + benchmarking later.
- On first save POST `/api/tuition/programmes` → returns `id` (kept in URL as `/new?step=1&pid=…`).

### Primary CTA
**Continue ▶** (`variant="tuition"`) — validates required fields then advances to Step 2.

### Secondary Actions
Save draft (`outline`); Discard (confirm modal, destructive, only when dirty); Upload cover (dropzone browse); + Add outcome / + Add strand.

### Filters / Search / Sort / Pagination
Strand picker has a search input (canonical, min 2 chars). No pagination.

### Permissions
`tuition_programme:create` to reach this step; subsequent `update` requires `tuition_programme:update` + ownership (creator/programme owner) — principal overrides.

### Empty State
N/A (form itself). Strand picker empty → "No strands for {subject} yet — curriculum sync pending" with link to request curriculum data.

### Loading State
Form skeletons (`Skeleton h-9` per field) while school subject/grade/curriculum lists load; Continue disabled until resolved. Cover skeleton while uploading.

### Error State
Inline validation per-field under inputs (`border-destructive` + `text-xs text-destructive` e.g. "Programme name is required", "Select a grade"). Save failure → destructive banner "Couldn't save — check your connection." + Retry. Duplicate title in same school → `text-sm font-semibold` banner "A programme with this name exists" + link to TCH-02.

### Success State
`toast("Draft saved")` on autosave; `toast("Algebra Mastery draft created — continue to Structure")` on Continue. Cover upload → cover thumbnail swaps in.

### Mobile Behavior
Grid collapses to 1 column; cover dropzone above form; sticky bottom footer (Discard collapses into a `⋯` top-right); outcomes list full-width with large touch removal targets; helper text wraps.

### Accessibility
Labels `for`/`id` on all inputs; required `aria-required` + visual `*`; autosave announced via `role="status"`; strand chips removable with `aria-label`; select chevrons are non-interactive decorations; errors linked via `aria-describedby`; focus visible ring preserved.

### Related Screens
TCH-02 (list) · TCH-04 (structure next) · STU-04 (student programme detail shows these fields) · SCH-02 (school catalogue inherits metadata).

---

## TCH-04 (Step 2) — Programme Builder: Structure (ID: TCH-04)

### Purpose
Build the module → lesson tree: add/reorder/duplicate/rename/delete modules and lessons via drag-and-drop,
attach a quiz/assignment/assessment per module, and preview the resulting curriculum outline.

### User
Teacher (author). Principal read. super_admin school-mode read.

### Route
`/tuition/teacher/programmes/new?step=2` · edit: `/tuition/teacher/programmes/[id]/edit?step=2`

### Navigation
Stepper layout; **Step 2** active. Back → Step 1 (details echo in a rail), forward → Step 3 (Content).

### Layout

```
┌────────────────────────────────────────────────────────────────┐
│ …stepper (1✓ 2● 3○ 4○ 5○)   Structure: modules & lessons        │
│────────────────────────────────────────────────────────────────│
│ Tutorial: drag modules/lessons to reorder · click ⋯ to manage  │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ MODULE 1 · Numbers — Strand 1                        ⋮ ⋯ ⋯  │ │
│ │  1.1 Ordering integers (Algebra Mastery)         [46%]  ⋯  │ │
│ │  1.2 Adding & subtracting integers               [new]  ⋯  │ │
│ │  1.3 Multiples, factors, LCM & GCD                [new]  ⋯  │ │
│ │  [+ Lesson]  [+ Quick quiz: 5 MCQs]                       │ │
│ ├────────────────────────────────────────────────────────────┤ │
│ │ MODULE 2 · Algebra — Strand 2                         ⋯ ⋯  │ │
│ │  2.1 Variables, expressions & substitution          [new]  ⋯ │ │
│ │  2.2 Linear equations in one variable               [new]  ⋯ │ │
│ │  2.3 Word problems                                 [new]  ⋯ │ │
│ │  3.4 (quiz placeholder)  Quiz: Algebra warm-up (10m)  ⋯     │ │
│ │  [+ Lesson]  [+ Assessment: End-of-module 20 marks]        │ │
│ └────────────────────────────────────────────────────────────┘ │
│ [➕ Add module]                                  Preview ▶     │
│ footer: ‹ Back to details · Save draft · Continue to content ▶│
└────────────────────────────────────────────────────────────────┘
```

Main column `max-w-3xl`. Accordion per module (`Tabs`+collapsible rows); lesson rows show title,
quality/status chip (`published` green / `draft` gray), duration. Drag handle `⋮⋮` left, per-row ⋯ right.

### Components
Accordion/`Collapsible`, `SpinButton` reorder-arrows (a11y alternative to dnd), `DropdownMenu` (⋯: Rename /
Duplicate / Delete / Add content / Move to module), `Badge`, `StatusPill`, `Button` (`secondary` add chips),
`Tooltip`, `DataState`.

### Content & data
- Entities: `programme_modules` (title, description, `position`), `programme_lessons` (title, summary,
  `content_type`, `duration_min`, `is_preview`, `status`, `position`), plus module-scoped quiz/assignment/
  assessment placeholder nodes.
- Actions (row ⋯): **Rename** (inline input), **Duplicate** (copies lesson + nested resources with "(copy)"),
  **Delete** (confirm modal with entity name; lessons with progress warn "3 students have progress on this lesson"),
  **Move to module**, **Add content** → Step 3 targeting that lesson.
- **Add quiz** → creates a lightweight quick-quiz (MCQ-only, from Question Bank); **Add assessment** → links/
  creates a full assessment (TCH-15); **Add assignment** → creates linked assignment (TCH-13). All appear as
  nodes in the tree with type icon + marks/duration.
- DnD: HTML5/sensor drag for modules + lessons; reordering map not saved until drop → PATCH positions whole
  (structure saved as normalized JSON via `/api/tuition/programmes/[id]/modules`).
- **Preview** opens a modal student outline (programme detail STU-04 contracted): shows module accordions
  locked, preview lessons unlocked, nested items listed.

### Primary CTA
**Continue to content ▶** (`variant="tuition"`) → Step 3. Requires ≥1 module with ≥1 lesson.

### Secondary Actions
+ Add module (top); + Add lesson / + Quick quiz / + Assessment / + Assignment per module (secondary chips);
Preview ▶ (`outline`); Rename/Duplicate/Delete via ⋯; Save draft; Back.

### Filters / Search / Sort / Pagination
None (tree is the full structure). Optional collapse-all/expand-all in toolbar.

### Permissions
`tuition_lesson:create|update|delete`, `tuition_assessment:create`, `tuition_programme:update` — all require programme ownership (or principal). Delete on module cascades lessons after confirm.

### Empty State
No modules yet: `EmptyState` (`FolderTree` icon) "Start building — add your first module, then add lessons inside it." + `+ Add module` CTA. Step 2 reached by skipping step 1 shows a "Back to details" hint.

### Loading State
Accordion skeletons (module header `h-12` ×2 + lesson rows `h-8` ×3); drag disabled during load; Continue disabled.

### Error State
Banner "Couldn't load the structure." + Retry; reorder PATCH failure → rolls back UI to server order + `toast("Reorder failed — try again.")`; delete conflicts surface the progress-warning modal unchanged.

### Success State
`toast("Module added")` / `toast("Lesson duplicated")` / `toast("Structure saved")` on drop/continue; reorder animates (transform transition).

### Mobile Behavior
DnD replaced with up/down chevrons (`SpinButton`) on touch; accordions single-open; ⋯ opens bottom Sheet with full-width actions; footer sticky; preview modal becomes bottom Sheet.

### Accessibility
Drag fallback: chevrons + listbox semantics (`role="list"`/`listitem`, arrow keys move focus then Alt+Up/Down reorder); rename via inline `input aria-label="Lesson name"`; visual position indicator for SR Users (announce "Moved lesson 2.2 to position 3"); delete modals trap focus; `aria-current="step"` stepper.

### Related Screens
TCH-03 (details) · TCH-05 (content) · TCH-08 (structure tab reuses tree read-only+editable) · TCH-13/15 (linked assignment/assessment) · STU-06 (player module list).

---

## TCH-05 (Step 3) — Programme Builder: Content (ID: TCH-05)

### Purpose
Attach teaching content to the lessons built in Step 2: video, PDF, document, audio, image, presentation, link, embed, and text paragraphs; manage per-lesson resources and lesson `is_preview` visibility.

### User
Teacher (author). Principal read. super_admin school-mode read.

### Route
`/tuition/teacher/programmes/new?step=3` · edit: `/tuition/teacher/programmes/[id]/edit?step=3`

### Navigation
Stepper layout; **Step 3** active. Left pane = structure summary (read-only mirror of Step 2, modules/lessons). Lesson picker at top ("Lesson: 1.2 What is an Amoeba?"). Up next → Step 4.

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ …stepper (1✓ 2✓ 3● 4○ 5○)          Content for each lesson      │
│───────────────────────────────────────────────────────────────│
│ Lesson ▾ [1.2 What is an Amoeba? · Biology F2]   [+ text blk]  │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Add content  ▶ [video][pdf][doc][audio][image][pres][link] │ │
│ │                  [embed][text]                          📤 │ │
│ │ ──────────────────────────────────────────────────────── │ │
│ │ █▌VIDEO  Introduction to Amoeba (mp4)   6:42 · 84 MB     ⋯ │ │
│ │ █▌PDF    Amoeba Structure sheet.pdf     1.2 MB            ⋯ │ │
│ │ █▌LINK   National Geographic - Amoeba post                ⋯ │ │
│ │ █▌TEXT   Paragraph: "An amoeba is a single celled…"        ⋯ │ │
│ │ ▸ [expand] Lesson intro video · transcript line            │ │
│ │ ──────────────────────────────────────────────────────── │ │
│ │ [➕ Add resource block]           dropzone: drag & drop    │ │
│ │                                  or browse · mp4/pdf/mp3…  │ │
│ │  Preview flag:  ☐ Preview before enrol                    │ │
│ └───────────────────────────────────────────────────────────┘ │
│ video options: [caption .vtt ▾] [transcript auto ▾] duration  │
│ footer: ‹ Back · Save draft ·  Continue ▶ (needs ≥1 resource) │
└───────────────────────────────────────────────────────────────┘
```

Single main column, `max-w-4xl`. Lesson selector (DropdownMenu) top; resource list as ordered cards; upload dropzone card `border-dashed rounded-xl`; footer consistent with stepper layout.

### Components
`Button` chips (type add), `FileDropzone`, resource row card (type icon chip + meta + ⋯), `DropdownMenu`, canonical inputs, `Switch` for preview flag, `Skeleton`/`DataState`, `ProgressBar` (upload progress), `StatusPill` (lesson status), `Badge` (type chip).

### Content & data
- **Content types + metadata** (`lessons_resources`): `video`(mp4/webm, duration, `caption_url` vtt, transcript, thumbnail), `pdf`, `document`(docx/txt), `audio`(mp3, duration), `image`(png/jpg), `presentation`(pptx), `link`(title+url, fetch title), `embed`(iframe/script url, sandbox warn), text blocks (`programme_lessons.body` paragraphs).
- Each resource: title, `resource_type`, `file_size` (Geist Mono), upload progress (`ProgressBar` `--tuition-progress` on successful, `--destructive` on failed), created_by.
- Resource row ⋯: Rename, Replace file, Edit meta (title/caption/transcript), Move to another lesson, Remove (warn if used elsewhere: "Used in lesson 2.1 too").
- Per-lesson settings: `is_preview` toggle (available without enrolment), lesson `duration_min` derived or manual.
- Text block editor: plain textarea first (MVP), `min-h-24 resize-y`, inline formatting toolbar disabled until TipTap decision (future).
- Shows lesson status (`draft|published` derived from programme publish preview toggles).

### Primary CTA
**Continue ▶** (`variant="tuition"`) — validates ≥1 lesson has ≥1 resource OR text; else inline warning. Primary within-step action for upload is the **Browse files** browse button.

### Secondary Actions
Back (step 2); Save draft; Add text block; per-resource ⋯; Preview lesson (opens player in new tab, locked unless lesson `is_preview` + programme public — otherwise a modal explains "Preview shows after publish; use Save draft + step 5 preview").

### Filters / Search / Sort / Pagination
None within step. Lesson picker is the "filter". Resource list ordered by `position` (drag handle `⋮⋮`), no search needed at this scale.

### Permissions
`tuition_content:create|update|delete` + `tuition_lesson:update`. Owner check: creator_staff or programme-owner; principal overrides. Upload quota enforced by plan feature (show banner "Storage limit reached at {plan}").

### Empty State
Inside lesson pane: dashed dropzone `EmptyState` (`UploadCloud` icon) "No resources yet. Add your first video, document or link for this lesson." + browse button. Different empty message per lesson with none.

### Loading State
Lesson pane skeleton (resource cards `h-14 animate-pulse`), dropzone disabled, stepper intact (no full-page spinner).

### Error State
Upload fail = per-card destructive banner (`border-destructive/30 bg-destructive/10`) "Upload failed — {filename}. Retry"; transport error above pane with Retry; validation: `Continue` disabled + inline `text-xs text-destructive` "Add at least one resource to a lesson before continuing."

### Success State
Per-upload `toast("Video 'Introduction to Amoeba' uploaded")`; transcript auto-generated `toast("Transcript ready")`; on Continue from step 3 → goes to step 4 with `toast("Content saved")`. Upload rows show green `ProgressBar` 100%.

### Mobile Behavior
Lesson selector full-width; resource rows stack with meta under file name; dropzone is full-bleed tap target; add-content chips wrap to 2 columns; footer `Back`/`Continue` become sticky bottom bar with `h-14` touch targets; keyboard-accessible upload fallback (browse input) first-class.

### Accessibility
Upload cards `role="button"` + Enter activates; progress bars have `role="progressbar"` + `aria-valuenow`; icon-only ⋯/expand have `aria-label`; live region `role="status"` for autosave and transcript-ready; video must accept caption files (WCAG): requirement surfaced in video options; contrast of type chips paired with label text.

### Related Screens
TCH-03 (details) · TCH-04 (structure) → TCH-06 (access) · TCH-10 (resource detail) · TCH-09 (library: "Save to library as well" checkbox).

---

## TCH-06 (Step 4) — Programme Builder: Access (ID: TCH-06)

### Purpose
Choose who can see and join the programme (publication scope), control enrolment, and set which lessons are previewable before enrolling.

### User
Teacher (author). Principal read. super_admin school-mode read.

### Route
`/tuition/teacher/programmes/new?step=4` · edit: `/tuition/teacher/programmes/[id]/edit?step=4`

### Navigation
Stepper layout; **Step 4** active. Step 3 content summary shown as rail ("Built: 3 modules · 11 lessons · 14 resources"). → Step 5 Review.

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ …stepper (1✓ 2✓ 3✓ 4● 5○)       Who can access this programme? │
│───────────────────────────────────────────────────────────────│
│ Visibility  (radio list of scopes)                          📶 │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ (●) School only     everyone at Kijani Ridge Academy      │ │
│ │ ( ) Private         only you and other staff you invite   │ │
│ │ ( ) Selected classes  → pick classes (multi-select chips) │ │
│ │ ( ) Selected students → pick students (search+multi-select)│ │
│ │ ( ) Selected schools  → network share proposals (approval)│ │
│ │ ( ) Network          publish to tuition network (moderate) │ │
│ │ ( ) Public           anyone with the link (no enrol signup)│ │
│ └───────────────────────────────────────────────────────────┘ │
│ Enrolment mode:  open(auto-approve) | invite(by staff) | link │
│ Preview lessons:  ☑ 1.1 1.2 previewable before enrolling      │
│ Prerequisites:    [text: e.g. complete Algebra 1 module]      │
│ footer: ‹ Back · Save draft · Continue ▶                      │
└───────────────────────────────────────────────────────────────┘
```

Main column `max-w-2xl`. Scope radios with expanding sub-panels (inline `Sheet` on mobile).

### Components
Radio group (canonical styled), `MultiSelect` chips (classes/students/schools), `Switch` list for preview lessons, canonical text input, `DropdownMenu`, `Badge` chips, `StatusPill` (publication scope label), `DataState`.

### Content & data
- Scopes exact from `_context.md` §7: `private|school|classes|students|schools|network|public`.
- `classes`/`students` panels: searchable pickers (`debounced 300ms`, min 2 chars) with chip output `Kijani Loves · Form 1A ▸`, `Wanjiku M. · F2 ▸`; list safe-count `142 students in 4 classes`.
- `schools` panel: multi-select school list → creates `network_publications` proposal at publish (status `pending` until moderated).
- Enrolment mode drives `programme_enrolments.status` semantics: open→`active` on self-enrol; invite→rows created `invited` until staff approves; link→enrol via token.
- Preview lessons: list of curriculum lessons with `is_preview` toggles; hint "Previewing students see lesson without enrolling."

### Primary CTA
**Continue ▶** (`variant="tuition"`) → Step 5 Review. For `network|schools` scopes, button label becomes "Continue to review (will be submitted for approval)".

### Secondary Actions
Back; Save draft; Reset to School-only (revert scope); Help tooltip per scope; Cancel & discard.

### Filters / Search / Sort / Pagination
Search inside class/student/school pickers only. No pagination on this step.

### Permissions
Reading classes/students/schools gated by `requirePermission(schoolId, "tuition_programme", "read")` + school context. `network|public` publication requires `tuition_network:publish`; if absent the option is disabled with tooltip "Your school isn't enabled for network sharing".

### Empty State
No classes created: "No active classes yet — create classes in School Management first." with link `/dashboard/classes`. No students: informational, cannot proceed on `students` scope → inline warning to pick another scope.

### Loading State
Scope radios skeleton (`h-12` ×7); sub-panel skeletons while fetching class/student lists; buttons disabled until query settles.

### Error State
Inline banner: "Couldn't load access options." + Retry. Validation: Continue requires a scope (default `school` preselected so normally safe) and ≥1 class when `classes` chosen — inline destructive `text-xs`. Network submission failure surfaces destructive banner with the conflict detail.

### Success State
Moving forward = `toast("Access settings saved")`. Publish-from-network later shows approval state. Scope change + autosave live region "Autosaved just now".

### Mobile Behavior
Sub-panels (class/student pickers) open as bottom `Sheet` (`side=bottom`, `sm:max-w-sm`); radio list full-width; preview-lesson switches stacked; continue bar sticky bottom with back; chips wrap.

### Accessibility
Radio group = native inputs (screen-reader friendly); scope change doesn't auto-advance (no focus trap surprises); chip remove buttons `aria-label="Remove Form 1A"`; warnings paired with icons + text; contrast maintained on tinted scopes.

### Related Screens
TCH-05 (content) · TCH-07 (review/publish + network submission) · SCH-06 (school bulk enrol) · NET-03 (network programmes).

---

## TCH-07 (Step 5) — Programme Builder: Review & Publish (ID: TCH-07)

### Purpose
Final validation checklist, full student-facing preview, visibility summary, and the publish action that flips the programme to `published` (or submits to network moderation).

### User
Teacher (author, publish). Principal (publish override). super_admin (school mode).

### Route
`/tuition/teacher/programmes/new?step=5` · edit: `/tuition/teacher/programmes/[id]/edit?step=5`

### Navigation
Stepper layout; **Step 5** active. Back → Step 4; Publish resolves to TCH-08 (success) or stays with blockers.

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ …stepper (1✓ 2✓ 3✓ 4✓ 5●)        Review before publishing      │
│───────────────────────────────────────────────────────────────│
│ Invalid (1/9)  Validity checklist                          ⚠ │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ ✓ Title & description present                              │ │
│ │ ✓ ≥1 module with ≥1 lesson                                │ │
│ │ ✓ Every lesson has ≥1 resource OR text                     │ │
│ │ ✓ No lesson marked missing-duration (optional)             │ │
│ │ ✓ No broken/insecure links (scanned)                       │ │
│ │ ! Access scope = school only (recommend ≥classes)          │ │
│ │ ────────────────────────────────────────────────────────  │ │
│ │ Preview   [▶ Open student view]  (programme detail as 4th  │ │
│ │  Ssa looks for a Grade 6 student)                          │ │
│ └───────────────────────────────────────────────────────────┘ │
│ Visibility summary                      Who can see this      │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Programme: Algebra Mastery · Form 1 Mathematics 2026       │ │
│ │ Scope............ School (4 classes · 142 students)       │ │
│ │ Preview lessons.. 1.1 · 1.2 (complete for non-enrolled)   │ │
│ │ Enrolment........ Open — students self-enrol and start    │ │
│ │ Duration......... 6 weeks · 11 lessons · 1 assessment      │ │
│ └───────────────────────────────────────────────────────────┘ │
│ footer: ‹ Back · Save draft · [Publish programme ▶ tuition]   │
└───────────────────────────────────────────────────────────────┘
```

Two-column `lg:grid-cols-2 gap-6`: left = checklist + preview; right = visibility summary + extra toggles (enrolment notification on). Footer publish.

### Components
`CheckList` (✓/! rows, green/destructive tints), `StatusPill`, `ProgrammeCover`, `Button` `tuition` big, `Card`, `Switch` (notify on publish), `Sheet` (preview embed), `DataState`.

### Content & data
- Checklist runs `/api/tuition/programmes/[id]/publish` **validate** path (idempotent, no write): returns per-rule ok/blockers. Rules: title+description, ≥1 module≥1 lesson, each lesson≥1 resource/text, durations present (warn), link-scan result (http/https-check; strip `javascript:`), scope recommendation warning.
- Visibility summary: title, type, grade/subject, scope label, preview lessons list, enrolment mode, duration (`duration_weeks`+lesson count), assessment count, resource type totals (e.g. "14 resources · 5 video · 4 pdf").
- Publish action: POST createRoute → sets `status=published`, `published_at=now()`, respects scope; `network|schools` scope creates `network_publications` row (`pending`) instead of publishing only.
- After publish: emits `notifications` to school principal + targeted `announcements` for hosted scope.

### Primary CTA
**Publish programme** — `variant="tuition"`, disabled until all `✓` except warnings (warnings block only if mandatory). While posting: `Loader2 spin` + "Publishing…". Labels adapt: network → "Submit for approval".

### Secondary Actions
Save draft; Back; "Open student view" preview (`Sheet` with STU-04 contracted version); "Notify enrolled students" switch; Archive (post-publish, in manage).

### Filters / Search / Sort / Pagination
None.

### Permissions
`tuition_programme:publish` required. Without: publish button disabled + tooltip "Only programme owners or principals can publish." Role check on publish route backs this (not just UI).

### Empty State
N/A (step only reachable with content). If all modules deleted server-side: checklist shows single blocker "No modules" and a "Back to Structure" inline action.

### Loading State
Checklist rows as `Skeleton h-5` while `/publish` validate runs (fast, <400ms); publish button spinner; visibility summary skeleton.

### Error State
Checklist blocker rows tinted destructive with explanation + per-blocker inline fix link ("+ Add a lesson" jumps to step 2). Publish failure → destructive banner + `toast("Publish failed — validation blocked")`, stays on step.

### Success State
Dedicated success card (per design-system §9): full-screen `CheckCircle` in `rounded-full bg-emerald-100` + "🎉 *Algebra Mastery* is live!" + lines (scope, students reachable) + buttons "Go to Manage programme" (`tuition`) and "View as student" (`outline`); auto-redirect 3s to TCH-08. For network scope: "Submitted for approval" + "Track in Network".

### Mobile Behavior
Grid collapses to single column (checklist above summary); footer `Back`+`Publish` sticky bottom; preview `Sheet` bottom; long checklist scrollable with sticky header.

### Accessibility
Checklist as list with `aria-label` per rule; live region "Publishing" during post; success screen focus-steals to card (`tabIndex=-1` + focus on mount) for SR announce; contrast green=✓ uses `--success`; `aria-current="step"` on stepper 5.

### Related Screens
TCH-03…06 (earlier steps) · TCH-08 (manage, arrive post-publish) · STU-04 (student view) · SCH-02/SCH-03 (school visibility) · NET-03 (network moderation).

---

## TCH-08 Manage Programme (ID: TCH-08)

### Purpose
Day-to-day management of a single programme after creation: view health, manage enrolments/students,
curate content, monitor linked assessments and results — all in one tabbed screen.

### User
Teacher (owner/co-instructor). Principal read. super_admin school-mode read.

### Route
`/tuition/teacher/programmes/[id]`

### Navigation
Teacher Shell; breadcrumb `Tuition / Teach / My Programmes / [title]`. Entry: TCH-02 row "Manage", dashboard programme tile, post-publish redirect of TCH-07. Tabs swap content in place (no route change, query `?tab=` deep-linked).

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ …nav…                       Manage programme: Algebra Mastery  │
│───────────────────────────────────────────────────────────────│
│ ▣ cover  Algebra Mastery · Form 1 Mathematics   [Published]    │
│          by Mr. Otieno · 6 wks · beginner · CBC               │
│          [Preview] [Edit builder] [Archive ⋯]                 │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ KPI: Students 42 · Active 38 · Completed 6 · Avg 75%      │ │
│ └───────────────────────────────────────────────────────────┘ │
│ Tabs[line]:  Overview | Students | Content | Assessments |    │
│              Results                                          │
│───────────────────────────────────────────────────────────────│
│ ▸ OVERVIEW (default):                                        │
│  ◢ Description + outcomes ·  ◢ Instructor(s) + co-teachers   │
│  ◢ Recent activity ·          ◢ Scope & access card          │
│ ▸ STUDENTS:      student table (TCH-11 subset, per-programme)│
│ ▸ CONTENT:       module/lesson tree (read-only + edit ctas)  │
│ ▸ ASSESSMENTS:   linked assessments table (status, attempts) │
│ ▸ RESULTS:       recent assessment results summary (TCH-16)  │
└───────────────────────────────────────────────────────────────┘
```

Header band (`bg-card rounded-xl`) with cover + meta + action row. KPI strip. `Tabs` variants `line` (underline indicator `bg-tuition-accent`, active text `text-tuition-accent`). Each tab content scrolls independently.

### Components
`Tabs` (`line`), `Card`, `StatusPill`, `ProgressBar`, `AvatarGroup`, `ProgrammeCover`, `Button` (`tuition`/`outline`/`destructive`), `DropdownMenu`, `DataState`, `Sheet` (enrol students), `tooltip`.

### Content & data
- **Header:** title, type+grade+subject chips, status (`published`/`draft`/`archived`), instructor avatar + name, rating (`rating_avg` ★), `students_count`, duration, difficulty chip.
- Actions: Preview (student view, external tab), Edit builder (`.../edit?step=`), ⋯ Archive / Restore / Duplicate / Delete (draft only) / Change scope.
- **Overview tab:** full description + `learning_outcomes` checklist; instructors (`programme_instructors` lead/assistant, invite co-teacher); recent activity (`lesson_progress` events + submissions last 7 days); access card (scope pill, enrolment mode, preview-lesson count); "Enrol students" quick action.
- **Students tab:** table of `programme_enrolments` for this programme — student, class, status pill `invited|active|completed|dropped`, `progress_pct` ProgressBar, last active, ⋯ (View profile / Change status / Drop). Bulk bar for invite/drop. `+ Enrol students` opens Sheet (class/student picker, bulk).
- **Content tab:** read-only mirror of Step 2 tree with per-lesson edit (`pencil` → Step 3), add lesson/module, lesson status chips, linked quiz/assignment/assessment nodes.
- **Assessments tab:** linked `assessments` table — title, section/module, `StatusPill` (`draft|scheduled|open|closed|published_results`), attempts count, avg score, ⋯ (Open builder, Results, Unlink).
- **Results tab:** condensed TCH-16 for linked assessments: recent attempts, avg, distribution sparkline; link to full results.

### Primary CTA
Contextual per tab: Overview → **Enrol students**; Students → **+ Enrol**; Content → **Edit content**; Assessments → **Open builder**; Results → **View full results**. Global header: **Edit builder** (`variant="tuition"`).

### Secondary Actions
Preview; Archive/duplicate/delete via ⋯; invite co-teacher; bulk drop/invite in students tab; publish (if draft) top-right; change scope.

### Filters / Search / Sort / Pagination
Students tab: search + status segment (All/Active/Completed/Dropped) + 10/page pagination. Assessments: none. Content: collapse-all/expand-all.

### Permissions
`tuition_programme:update` + ownership to mutate; `tuition_programme:read` to view; enrol requires `tuition_programme:enrol`; archive = update; principal read-only unless overrides; archived programmes read-only with top banner.

### Empty State
Per-tab `colSpan` messages: Students "No students enrolled yet — invite your first class."; Content "No modules — open the builder to add structure."; Assessments "No assessments linked to this programme yet."; Results "No results yet — results appear after students submit." (with CTAs to the corresponding builder).

### Loading State
Header skeleton + tab skeletons; per-tab `DataState` with `Skeleton` rows; KPI `Skeleton h-20`.

### Error State
Tab load failure: "Couldn't load students." + Retry within tab card. Programme not found/archived: `not-found` presentation with back link. Permission denied inline card.

### Success State
`toast("Students enrolled")`; `toast("Programme archived")`; `toast("Co-teacher invited")`; publish → green banner + status pill flips; bulk drop → toast + row removed.

### Mobile Behavior
Cover collapses to 16:9 top; KPI `grid-cols-2`; tabs scroll horizontally with `overflow-x-auto` (sticky under header); student table → stacked cards; ⋯ opens bottom Sheet; enrol Sheet full-width.

### Accessibility
Tabs = `role="tablist"` + arrow-key nav + `aria-selected`; tab panels `role="tabpanel"` labelled; status pills paired w/ text; bulk bar `role="toolbar"`; progress bars `role="progressbar"`; deep-link `?tab=` honored.

### Related Screens
TCH-02 (list) · TCH-03…07 (builder) · TCH-11/12 (students/profiles) · TCH-13/15/16 (assignments/assessments) · STU-04/05 (student side).

---

## TCH-09 Content Library (ID: TCH-09)

### Purpose
A reusable resource library across programmes: folders, uploads, search, and every resource type. Teachers
reuse assets created anywhere (upload once, attach in any lesson).

### User
Teacher. Principal read. super_admin school-mode read.

### Route
`/tuition/teacher/content`

### Navigation
Teacher Shell; breadcrumb `Tuition / Teach / Content`. Left nav **Content** active. Deep links from step-3 uploader ("Save to library as well") and TCH-10 back-links.

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ …nav…                    Content Library       [+ Upload ▾]    │
│───────────────────────────────────────────────────────────────│
│ Search resources… ⌕      | All types ▾ | Sort: Updated ▾      │
│ [video][pdf][document][audio][image][press][link][embed] chips │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ ☰ Folders (left rail)      Resource grid (right)          │ │
│ │  ▾ My uploads  (12)        ┌────────┐ ┌────────┐          │ │
│ │    ▸ Algebra F1  (5)       │ ▣ video │ │ 📕 pdf │          │ │
│ │    ▸ Bio F2      (4)       │ Intro…  │ │ Struct..│          │ │
│ │    ▸ English G6  (3)       │ 6:42 84M│ │ 1.2M   │          │ │
│ │  ▾ Shared        (8)       └────────┘ └────────┘          │ │
│ │    ▸ + New folder …        ┌────────┐ ┌────────┐          │ │
│ │                            │ 🔗 link │ │ 🎧 audio│          │ │
│ │  [+ Upload]  [+ New folder]│ NatGeo..│ │ F1 vocal│          │ │
│ └───────────────────────────────────────────────────────────┘ │
│ footer grid: 21 assets · 132 MB · storage 16% of plan         │
└───────────────────────────────────────────────────────────────┘
```

`lg:grid-cols-[220px,1fr] gap-6`: folders rail (accordion tree) + asset grid/table. Type chips as segmented
filter row. Toolbar: search, type, sort, storage meter.

### Components
`DropdownMenu` (+ Upload ▾ = Upload files / New folder / New link / New embed), `FileDropzone`, asset card
(icon or thumbnail by type + title + meta + ⋯), `Badge` type chip, storage meter `ProgressBar` (`--tuition-progress`), `DataState`, `EmptyState`, `Input` search canonical, folder tree (collapsible, click-row select).

### Content & data
- Asset grid cards: type icon chip (colour per type), thumbnail for images/videos (poster), title (truncated 2 lines), meta line `type · size (Geist Mono) · folder`, updated; row ⋯: Preview, Rename, Move to folder, Duplicate, Download, Delete (confirm modal; blocks if referenced).
- Usage counts shown in list: "Used in 3 lessons" (from `lessons_resources` join).
- Upload path: `+ Upload ▾` → modal dropzone (accept `video/mp4,video/webm,application/pdf,application/vnd.openxmlformats-officedocument.*,audio/mpeg,image/*,application/vnd.ms-powerpoint`), multi-file, parallel progress rows, `ProgressBar` per file, cancel per file.
- New link: title+URL; New embed: title+embed URL/script (sandbox validation).
- Storage meter: `∑ lessons_resources.file_size` vs plan quota (banner when >90%).

### Primary CTA
**+ Upload ▾** (`variant="tuition"`) in page header.

### Secondary Actions
+ New folder; + New link / + New embed (in dropdown); per-asset ⋯ (Preview/Rename/Move/Duplicate/Download/Delete); Create resource from type chips (jumps to TCH-10 new).

### Filters / Search / Sort / Pagination
Search (title, mime, folder, usage); type chips (multi-select incl. **All**); folder selection acts as filter; sort: Updated/Name/Size; pagination 24/page sticky-load or 12-grid page scroll; empty message toggles by query.

### Permissions
`tuition_content:create|update|delete` reads own+school library; RLS `get_user_school_ids()` read; owner/tracker `created_by` for delete (uploader or principal).

### Empty State
No assets: `EmptyState` (`FolderOpen`): "Your library is empty. Upload a video, document or link to reuse it in any lesson." + `+ Upload first file`. Filtered (type/folder/query): "No assets match." + Clear filters.

### Loading State
Grid of `Skeleton` aspect-video cards (6) + folder rail skeleton; upload button disabled until file picker ready.

### Error State
Upload failures listed per-file with Retry; list failure banner + Retry; storage-limit banner (`--warning`) blocks new uploads; quota exceeded → destructive inline.

### Success State
`toast("Uploaded Introduction to Amoeba")`; `toast("New folder created")`; upload rows animate to grid position; storage meter ticks up; link title auto-fetched `toast("Link title imported")`.

### Mobile Behavior
Grid collapses to 2 columns; folders rail becomes `Sheet` from top toolbar button; chips scroll horizontally; upload modal bottom Sheet; cards stack with meta; storage footer collapses to one line.

### Accessibility
Cards are links with `aria-label`; type chips as toggle buttons with `aria-pressed`; upload dropzone keyboard accessible (Enter opens browse); progress bars `role="progressbar"`; folder tree `aria-expanded`; search `aria-label="Search resources"`; contrast type chips paired with text.

### Related Screens
TCH-10 (detail/preview) · TCH-05 (upload into lesson) · TCH-08 (content tab) · STU-06/07 (student sees resources, respects `is_preview`).

---

## TCH-10 Resource Detail / Preview (ID: TCH-10)

### Purpose
Inspect and manage one resource: preview it in-browser by type, read metadata, see where it is used, replace/
download/delete, and edit captions/transcript for accessibility.

### User
Teacher (owner/library reader). Principal read. super_admin school-mode read.

### Route
`/tuition/teacher/content/[id]`

### Navigation
Teacher Shell; breadcrumb `Tuition / Teach / Content / [title]`. Back arrow → TCH-09 (retains filter state via URL). Direct nav from TCH-09 card click or TCH-05 resource row.

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ …nav…                ← Content  [Edit meta] [⋯ actions]       │
│───────────────────────────────────────────────────────────────│
│ ┌──────────────────────────────┬────────────────────────────┐ │
│ │ Preview pane (by type)       │ Metadata + usage card      │ │
│ │ ┌──────────────────────────┐ │ Title: Amoeba Structure    │ │
│ │ │ ▸▶ video player          │ │ Type: pdf [chip] 1.2 MB    │ │
│ │ │   (mp4 · HLS fallback)   │ │ Folder: Bio F2             │ │
│ │ │   ⏯ 6:42 │ volume │ ⛶   │ │ Uploaded: 2 Sep · T G.Mono │ │
│ │ └──────────────────────────┘ │ By: Mr. Otieno             │ │
│ │ [caption .vtt] [transcript📄]│ Duration: (video/audio)    │ │
│ │ ──────────────────────────── │ ──────────────────────────  │ │
│ │ For pdf/doc: browser embed   │ Used in (lessons):          │ │
│ │ For link: open iframe sandbox│  ✎ 1.2 What is an Amoeba?   │ │
│ │  or "open in new tab" button │  ✎ 2.1 Cell structure       │ │
│ │ For image/audio: rich viewer │ ──────────────────────────  │ │
│ │                              │ [Replace file] [Download]  │ │
│ │                              │ [Move to folder ▾]         │ │
│ └──────────────────────────────┴────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

`lg:grid-cols-2 gap-6` — preview pane (`aspect-video` for video; scroll pane for documents) + metadata card stacking anyway.

### Components
Video `PlayerFrame` (native + HLS), PDF embed, image viewer, audio player, iframe sandbox (`sandbox="allow-same-origin"` with warning), `Badge`, `Button` (`outline`/`default`/`destructive`), `DropdownMenu`, `Tooltip`, `FileDropzone` (replace), `DataState`.

### Content & data (by type)
- `video`: mp4/webm, poster, duration, caption URL (upload/edit .vtt), transcript (auto or manual), download.
- `pdf` / `document` / `presentation`: embed preview or "preview unavailable" with Download fallback.
- `audio`: waveform placeholder + duration + transcript.
- `image`: full-image viewer + dimensions.
- `link`: title, URL, `rel="noopener noreferrer"` external-open; iframe embed only for allowlisted domains.
- `embed`: embed URL/script with sandboxing rubric (no `allow-top-navigation`, no `allow-scripts` unless trusted).
- Metadata: `lessons_resources` fields, `created_by`, `created_at` (Geist Mono), size, mime; usage list = join
  `(lesson_id, module, programme)` with link to TCH-08 content tab.

### Primary CTA
**Edit meta** (`variant="tuition"`, header) — inline form (title, folder, caption/transcript for media).

### Secondary Actions
Replace file (dropzone modal); Download; Move to folder; Duplicate; Delete (confirm; blocked-list shows "Used in 2 lessons" before allowing); Open in new tab (external types); Add caption/transcript.

### Filters / Search / Sort / Pagination
None.

### Permissions
Read: `tuition_content:read` (library RLS). Edit/replace/delete: `tuition_content:update|delete` + ownership; principal overrides. Delete blocked when in use unless ownership accepted in confirm modal.

### Empty State
N/A on load (404 if missing → not-found with "Resource no longer exists" + `Back to library`).

### Loading State
Preview spinner + metadata `Skeleton` lines; player poster placeholder while video loads; replace modal progress row.

### Error State
Player error: poster + destructive `text-xs` "Couldn't play this video — [Download] instead."; embed blocked → sandbox warning tile; fetch fail banner + Retry.

### Success State
`toast("Metadata saved")`; `toast("File replaced")`; `toast("Caption added")`; replace updates thumbnail live.

### Mobile Behavior
Single column: preview first (`aspect-video`), metadata below; player in focused mode; caption/transcript toggles as chips; download/replace become icon buttons; embed falls back to "open in new tab".

### Accessibility
Player has keyboard controls ([Space] play/pause) per design system §12; captions default on; transcripts expandable; iframe embeds announced; file sizes read by SR; icon buttons `aria-label`; focus order preview→metadata.

### Related Screens
TCH-09 (list) · TCH-05 (attach) · TCH-08 (usage) · STU-07 (student resource states reuse player).

---

## TCH-11 Students (ID: TCH-11)

### Purpose
All students the teacher can reach (enrolled or class-based), with per-student progress overview: which
programmes they're on, completion %, last active, and quick jump to profile.

### User
Teacher. Principal read. super_admin school-mode read.

### Route
`/tuition/teacher/students`

### Navigation
Teacher Shell; breadcrumb `Tuition / Teach / Students`. Left nav **Students** active. Entry from dashboard,
programme students tab, class comparison.

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ …nav…                       Students            [+ Enrol ▾]   │
│───────────────────────────────────────────────────────────────│
│ KPI: Total 128 · Active 92 · Need help 14 · Avg 61%           │
│───────────────────────────────────────────────────────────────│
│ Search students… ⌕        Programme ▾ All | Class ▾ All       │
│ Sort: Last active ▾  [All][Active][At risk][Completed][Dropped]│
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Sectioned table · Students                               │ │
│ │ Student         Class    Programmes  Progress   Last     │ │
│ │ ┌￮ Achieng Oduya 4A     2           ██████ 78%   today  ⋯│ │
│ │ │  Wanjiku M.     1B     3           ███░░░ 42%   3d  ⋯ │ │
│ │ │  Brian K.       1A     1           ██████ 90%   1h  ⋯ │ │
│ │ │  Zawadi N.      4A     0  [invited] —        —      ⋯ │ │
│ │ · 128 students · page 3 of 13 · ← →                      │ │
│ └───────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

KPI strip → search+filters → sectioned table. Table collapses to stacked rows on mobile.

### Components
`StatusPill` (enrolment/engagement), `ProgressBar`, `Avatar`, `Badge` (class), `Button`, `DropdownMenu`, canonical search, segmented stat pills, `DataState`, `EmptyState`, `Sheet` (enrol modal).

### Content & data
- Rows = students with any `programme_enrolments` in school (or class roster). Columns: student (avatar + name + inline email-ish id in Geist Mono), class (`grade+stream`), programmes count (active/total), progress (avg `progress_pct` ProgressBar + %), last active (`lesson_progress.updated_at` relative), status pill (Active/Away 7d+/At risk <25%@14d/Needs help/Invited/Completed/Dropped) derived, ⋯ (View profile, Enrol in programme, Send message, Drop from all).
- KPI definitions: Total (distinct students), Active (any enrolment `active`), Need help (avg progress <25% or assessment mean <40%), Avg completion.
- `+ Enrol ▾` → Enrol students (Sheet: pick programme → pick class → rows staged → confirm) / Bulk import (by class or CSV placeholder).

### Primary CTA
**View profile** on row → TCH-12 (secondary-yet-dominant action per row); page-level primary **+ Enrol ▾**.

### Secondary Actions
+ Enrol ▾; ⋯ per-row (View profile / Enrol in programme / Send reminder / Drop); segmented Engagement filter; "Message all at-risk" bulk bar.

### Filters / Search / Sort / Pagination
Search by name/class/id (`debounce 300ms`); Programme dropdown; Class dropdown; status segments All/Active/At risk/Completed/Dropped; sort Last active / Name / Progress / Class; server pagination 10/page.

### Permissions
`tuition_programme:read` + `tuition_programme:enrol` for enrol; student rows scoped to own school classes (`get_user_school_ids()`); teacher sees own enrolment-linked students first, then class lists.

### Empty State
No students: `EmptyState` (`GraduationCap`): "No students yet — enrol a class or import students from School Management." Query miss: "No students match your search." with Clear filter.

### Loading State
Skeletons: KPI `h-20`×4, rows `h-12`×6; filters disabled until loaded; ellipsis spinner under table after filter change.

### Error State
Banner + Retry; enrol failure shows inline destructive in Sheet staging list (e.g. duplicate); permission inline card.

### Success State
`toast("Enrolled 32 students into Algebra Mastery")`; bulk reminders `toast("Reminders sent to 14")`; row status refresh in place without reload.

### Mobile Behavior
Table → stacked student cards (avatar+name+class header; meta rows Progress/Last active/status); segment pills horizontal scroll; ⋯ bottom Sheet; enrol modal full-height Sheet with sticky footer.

### Accessibility
Table `<caption>` + `scope="col"`; rows as links with enter; progress `role="progressbar"` + `aria-valuenow`; at-risk colour not sole indicator (pill icon + text); search announces results via live region; focus visible.

### Related Screens
TCH-12 (profile) · TCH-08 (programme students tab) · TCH-21 (class comparison) · STU-05 (student my-learning mirrors).

---

## TCH-12 Teacher Student Profile (ID: TCH-12)

### Purpose
One student, deeply: learning progress per programme, strengths/weaknesses resolved from topic/strand
analysis of assessment attempts, assignment standing, teacher notes, and recommended interventions.

### User
Teacher. Principal read. super_admin school-mode read. Parent read-only (their children only, grades only).

### Route
`/tuition/teacher/students/[id]`

### Navigation
Teacher Shell; breadcrumb `Tuition / Teach / Students / [Name]`. Entry: TCH-11 row, programme students tab, analytics flag. Back → TCH-11 retaining filters.

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ …nav…          ← Students   Achieng Oduya ☰ [Message] [Notes ▾] │
│───────────────────────────────────────────────────────────────│
│ [Avatar lg] Achieng Oduya · Grade 4A · Kijani Ridge Academy   │
│             Enrolled: Algebra Mastery · CBC Eng · Amoeba&Co    │
│ ┌───────────┬───────────┬───────────┬───────────┐              │
│ │ Avg 78%   │ Lessons   │ Assign 92%│ Assess 74%│   KPIs      │
│ └───────────┴───────────┴───────────┴───────────┘              │
│ ┌───────────────────────────┬───────────────────────────────┐ │
│ │ Programme progress        │ Strengths & weaknesses        │ │
│ │ ▸ Algebra Mastery ██████ 90│  STRONG  (topic attacks)      │ │
│ │ ▸ CBC Grade 6 Eng ████░░ 55│   • Linear equations · 88%    │ │
│ │ ▸ Amoeba & Eco   ██░░░░ 20│   • Reading comprehension 84% │ │
│ │   [Manage enrolment]      │  WEAK   (needs attention)      │ │
│ │                           │   • Essay structure · 41%      │ │
│ │                           │   • Ecology strand · 38%       │ │
│ └───────────────────────────┴───────────────────────────────┘ │
│ ┌───────────────────────────┬───────────────────────────────┐ │
│ │ Topic score trend (chart) │ Teacher notes                 │ │
│ │  ▔▔▔▔  Recharts area      │  • 3 Sep: struggling w/ word  │ │
│ │  (caption below)          │    problems; assigned extra…  │ │
│ │                           │  [➕ Add note]                 │ │
│ └───────────────────────────┴───────────────────────────────┘ │
│ Intervention recommendations                                │
│  Σ Recommended: revisit 'Word Problems' (strand 2) · assign  │
│    Practice Quiz B · pair with study buddy · invite to Fri   │
│    remedial live class  [Apply to programme]                 │
└───────────────────────────────────────────────────────────────┘
```

`grid-cols-1 lg:grid-cols-2 gap-6` panels + full-width intervention card.

### Components
`Avatar` lg, `StatusPill`, `ProgressBar`, `ScoreDial`, Recharts (AreaChart, RadarChart), `Card`, `Textarea`, `Button` (`outline`/`tuition`), `DropdownMenu` (notes menu: add/pin/history), `DataState`.

### Content & data
- KPIs: overall avg across attempts, lessons completed (X/total), assignment avg %, assessment avg %.
- Programme progress: each `programme_enrolments` (status pill + ProgressBar); "Manage enrolment" Sheet (status change `invited|active|completed|dropped`).
- **Strengths/Weaknesses:** derived from `assessment_attempt_details` per `curriculum_strands`/`topic` — sorted list with %; minimum sample note (n<span>≥</span>3 attempts to rank; else "Insufficient data").
- **Chart — Topic score trend** (Recharts `AreaChart`): x=last 8 weeks, y=avg score %; series `--tuition-assess` with gradient fill. Caption: *"Is Achieng's performance improving or declining over time?"*. Empty state: "No assessment history yet — appears after the first graded attempt."
- **Teacher notes:** `teacher_student_notes` list (author, date, pin), add via textarea + `+: Add`; pinned notes first.
- **Intervention recommendations:** rule-driven list (borderline scores <40% → "Revisit {topic}"; low assignment completion → "Assign {name}"; streak gap → "Invite to remedial class"). Each row has "Apply" action (enrol in specific programme/assessment or schedule) + dismiss.
- Permissions gate parent read-only to grades-only fields.

### Primary CTA
**Add note** on Teacher notes card (top action) and **Apply** on the top recommendation (contextual).

### Secondary Actions
Message (`outline`, opens school messaging); Notes ➕/pin/delete; Manage enrolment; Apply interventions; Export profile summary (PDF placeholder P1); View full assignment/assessment detail links.

### Filters / Search / Sort / Pagination
None (single student). Programme list sorted by progress asc/desc toggle.

### Permissions
`tuition_programme:read`; notes write `tuition_programme:update` (owner/instructor); parent scoped read; RLS `get_user_school_ids()`.

### Empty State
No data: strengths panel "Complete a module then take an assessment to see mastery."; notes empty "No notes yet — add observations to track progress."; interventions empty "No interventions needed right now. 🎉".

### Loading State
Header + KPI skeletons; panels `Skeleton h-40`; charts skeleton while aggregate query runs; notes skeleton rows.

### Error State
Aggregate load fail → panel banner + Retry; notes save failure destructive inline; student not found → not-found card.

### Success State
`toast("Note added")`; `toast("Intervention applied — students enrolled")`; status change toast; chart animates in.

### Mobile Behavior
Panels stack; KPIs `grid-cols-2`; charts full-width; notes textarea + sticky add row; intervention cards full-bleed; avatars shrink.

### Accessibility
Radar/Area charts need text fallback (list under chart); charts have `role="img"` + `aria-label`; strengths/weakness lists semantic `ul`; notes use `<time>`; contrast on weakness tint paired with % text; focus order sensible.

### Related Screens
TCH-11 (list) · TCH-16 (assessment results feed this data) · TCH-21 (analytics) · STU-18 (student progress mirror) · SCH-05.

---

## TCH-13 Assignments (ID: TCH-13)

### Purpose
Create and manage assignments, review submissions (~draft/submitted/late), grade inline with point + rubric
feedback, and close/give extensions.

### User
Teacher. Principal read. super_admin school-mode read.

### Route
`/tuition/teacher/assignments` (`?create=1` opens the create modal)

### Navigation
Teacher Shell; breadcrumb `Tuition / Teach / Assignments`. Left nav **Assignments** active. Entry from dashboard quick action + programme course nodes.

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ …nav…                      Assignments          [+ New]  │
│───────────────────────────────────────────────────────────────│
│ KPI: Open 3 · Grading 2 · Due this week 4 · Avg grade 78% ·   │
│───────────────────────────────────────────────────────────────│
│ Search…   | Programme ▾ | Status: All | drafts opened grading │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Sectioned table · Assignments                            │ │
│ │ Assignment      Programme        Due      Subm  Avg   ⋯   │ │
│ │ 📄 Word Problem  Algebra Mastery  14 Sep 32/42 71%  [grade]│ │
│ │    practice     (Mod 2)           [open]                  │ │
│ │ 📄 Essay: Persn. CBC Gr6 English  18 Sep  5/28  —   [draft] │
│ │    Narrative     (Mod 1)          [open]                  │ │
│ │ 📄 Amoeba model Amoeba & Ecology  9 Sep  —    —    [closed] │
│ │    write-up      (Mod 3)          [grading]               │ │
│ │ · 12 assignments · page 1 of 2 ·                          │ │
│ └───────────────────────────────────────────────────────────┘ │
│ ┌── SUBMISSION REVIEW (select row) ──────────────────────────┐│
│ │ Question: Word problem practice · points 20 · due 14 Sep   ││
│ │ Students   /    Status    /  Grade    / actions            ││
│ │ Achieng O. submitted 12:44   [ grade ▾] (14) [save]        ││
│ │ Wanjiku M. late     3 Sep   [ grade ▾] (—)  [save]         ││
│ │ Brian K.   draft    —        —                 [remind]    ││
│ └───────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

Top table (assignments) + expandable submission panel (Sheet on mobile / inline split on desktop `lg:grid-cols-[1fr,auto]` state when a row is selected).

### Components
`Tabs`/segments, `StatusPill` (assignment + submission), `ProgressBar` (grading), `DropdownMenu`, price/grade `Input` number, `Textarea` feedback, `Button` (`tuition`/`outline`/`ghost`), `Dialog` create form, `DataState`.

### Content & data
- Assignment row: title, badge (`initial_points`), programme/module, `due_at` (Geist Mono) + status pill `draft|open|grading|closed`, submissions count (submitted+late/total), avg grade, ⋯ (Edit, Duplicate, Preview as student, Publish, Close, Archive, Delete-draft).
- Create (Dialog): title, programme/module (link), instructions textarea, `open_at`/`due_at` date-time inputs, `points`, `allow_late` toggle + `late_penalty_pct`, `min_words` optional, attachments (reuse library), `attachments` jsonb.
- **Submission panel:** per student: status `draft|submitted|late|graded` (none → "Not started"), submitted_at, grade input (0..points, must be integer; auto marks `grading`→`graded`), feedback textarea, auto-recompute avg. Inline save per row; bulk "Mark all submitted as graded" (then per-row review). "Remind" sends notification to unsubmitted.
- Grading status transitions: while due in future + submissions rolling = `open`; teacher begins grading = `grading`; all graded or after close = `closed` at due or manual.

### Primary CTA
**+ New assignment** (`variant="tuition"`, header). Row-level primary when `grading`: **Save grade** per submission.

### Secondary Actions
Edit/duplicate/preview/close; per-submission Remind, View attempt file; bulk grade; extensions ("Extend due for …"); export grades CSV (P1).

### Filters / Search / Sort / Pagination
Search title; Programme dropdown; status segments; sort Due date / Recently active / % graded; pagination 10/page.

### Permissions
`tuition_programme:update` (assignments belong to a programme) + ownership; grade action `tuition_assessment:grade`; closed assignments read-only to everyone; principal overrides.

### Empty State
No assignments: `EmptyState` (FileText): "No assignments yet — create one to collect and grade student work." Filter miss: "No assignments match." table `colSpan`.

### Loading State
Rows `Skeleton h-12`×5; submission panel skeleton only after row selection; KPI skeletons.

### Error State
List fail banner + Retry; grade save failure → row destructive, value preserved, "Retry"; create fail → inline in dialog.

### Success State
`toast("Assignment published — students notified")`; `toast("Grade saved for Achieng O.")`; `toast("Submission graded · avg now 74%")`; bulk actions toasts.

### Mobile Behavior
Table stacked cards; submission review as bottom Sheet; grade input large touch; sticky save row; create dialog full-height Sheet.

### Accessibility
Grade inputs labelled with student name; status transitions announced (`live region`); feedback textarea labelled; table caption + scope; remind/grade icon buttons aria-label; keyboard traverse submission rows.

### Related Screens
TCH-08 (programme assessments/assignments tab) · TCH-12 (student assignment standing) · STU-08/09 (student side submit) · TCH-21 (assignment completion chart).

---

## TCH-14 Assessments (list) (ID: TCH-14)

### Purpose
Manage all assessments a teacher owns/co-runs: status (`draft|scheduled|open|closed|published_results`),
schedule, participation, mean score, and entry points to builder + results.

### User
Teacher. Principal read. super_admin school-mode read.

### Route
`/tuition/teacher/assessments`

### Navigation
Teacher Shell; breadcrumb `Tuition / Teach / Assessments`. Left nav **Assessments** active. Entry from dashboard quick action, TCH-08 assessments tab.

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ …nav…                 Assessments                [+ New ▾]     │
│───────────────────────────────────────────────────────────────│
│ KPI: In flight 4 · Due 2 · Avg marks 61% · To mark(none) 71%   │
│───────────────────────────────────────────────────────────────│
│ Search… | Programme ▾ | Status: All  draft sched open closed  │
│ Published results ▾                                          │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Sectioned table · Assessments                            │ │
│ │ Assessment        Programme   Open→Close   Att  Mean  ⋯   │ │
│ │ ✎ End-of-Module 2  Alg. Mastery 12–14 Sep   42  68%  [rs] │ │
│ │    (Algebra · 20m · [open])                               │ │
│ │ ✎ Eng. Comp Ass.   CBC Eng 6   18–21 Sep   5    —  [bl]   │ │
│ │    (English · 40m · [scheduled]) [result_visible manual]  │ │
│ │ ✎ KCPE Mock SectB  Alg. Mastery  1–3 Aug   38  54%  [rs]  │ │
│ │    (Revision · [published_results])                       │ │
│ │ · 9 assessments · page 1 of 1 ·                           │ │
│ └───────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

KPI strip → toolbar → sectioned table. `+ New ▾` menu: New assessment (TCH-15) | Adopt network assessment (SCH-08 link).

### Components
`StatusPill` (assessment), `Badge`, `DropdownMenu`, canonical search, segments, `DataState`, `EmptyState`, `Button` (`tuition`/`outline`).

### Content & data
- Row: title, grade/subject chip, programme (or unlinked), duration + marks, availability window (`open_at`→`close_at`, Geist Mono), attempts/participation count, mean score, status pill + context (e.g. "manual results"), ⋯ (Edit builder, Open, Close now, Results, Duplicate, Archive/Delete-draft).
- `[rs]` = quick **Results** button (→ TCH-16) for assessments with attempts; `[bl]` = **Open builder** for drafts.
- Result visibility badge when `result_visibility=manual|after_close` ("results held").
- KPI meanings: In flight (`open`+`scheduled`), Due (window ends ≤48h), Avg marks (mean of `graded` attempts), To mark (manual-graded attempts pending → shows count when `grader=manual`).

### Primary CTA
**+ New ▾** (`variant="tuition"`) → New assessment.

### Secondary Actions
Row ⋯; Open/Close now (status toggle, confirm); Results shortcut; Duplicate ("…(copy)"), Archive, Delete-draft (confirm modal); Adopt network assessment.

### Filters / Search / Sort / Pagination
Search title/programme; Programme dropdown; status segments All/Draft/Scheduled/Open/Closed/Published results; sort Created/Upcoming/Mean; pagination 10/page.

### Permissions
`tuition_assessment:create|update|delete|publish`; results read `tuition_assessment:read`; adoption `tuition_network:read`; ownership checks.

### Empty State
`EmptyState` (ClipboardList): "No assessments yet — build one from your Question Bank."; filtered miss message; per-programme level: "No assessments linked to this programme."

### Loading State
KPI + row skeletons; buttons disabled while list resolves; spinner on filter re-query.

### Error State
Banner + Retry; delete-draft conflict (in-use by programme) shown in confirm modal.

### Success State
`toast("Assessment published")` after builder publish; `toast("Assessment closed — results locked")`; status pills flip in place.

### Mobile Behavior
Table → stacked cards (title+status head, meta rows); segments horizontal scroll; ⋯ bottom Sheet; + New sticky bottom? (header keeps it).

### Accessibility
Caption/scope; status + description not colour-only; `aria-current` on nav; modal focus trap; date read as full text (not only Geist Mono visual).

### Related Screens
TCH-15 (builder) · TCH-16 (results) · TCH-08 (programme assessments) · TCH-17 (question bank source) · SCH-07/08-09 (school participation).

---

## TCH-15 Assessment Builder (ID: TCH-15)

### Purpose
Assemble a full assessment from settings → sections → questions (select from bank or create new), reorder
with per-question marks, preview the student experience, and publish (`draft→scheduled|open`).

### User
Teacher (author; publisher). Principal read. super_admin school-mode read.

### Route
`/tuition/teacher/assessments/new` · edit: `/tuition/teacher/assessments/[id]/edit`

### Navigation
Teacher Shell; breadcrumb `Tuition / Teach / Assessments / New assessment`. Entry TCH-14 + quick action. Left rail = live builder summary; main = stepped internal flow (inline sub-tabs).

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ …nav…              Assessment Builder: End-of-Module 2 (draft) │
│───────────────────────────────────────────────────────────────│
│ Sub-tabs: [1 Settings][2 Sections & questions][3 Preview]     │
│───────────────────────────────────────────────────────────────│
│ ▸ SETTINGS:  Title* [End-of-Module 2 — Algebra Express▸]      │
│  Programme/module ▾ [Algebra Mastery / Mod 2]  Grade F1       │
│  Subject[Math] Curriculum[CBC]  Duration [20 min] Total marks │
│  Availability: Open [11 Sep] Close [14 Sep] Attempts [1]      │
│  Shuffle questions ☑  → Shuffle options ☐                     │
│  Grader: (•)Auto MCQ ( )Manual ( )Hybrid  Grading scheme ▾    │
│  Result visibility: (•)Immediately ( )After close ( )Manual   │
│  Instructions (textarea, shown pre-take)                      │
│ ─────────────────────────────────────────────────────────────│
│ ▸ SECTIONS:  (accordions w/ per-q marks)                      │
│  SECTION A · MCQs (20m)         [+mcq][+mul][+t/f][+create]   │
│   Q1 [bank] Solve 3x+5=20 …                  4m ⤒⤓ ⋯           │
│   Q2 [bank] Which is a variable? …           4m ⤒⤓ ⋯          │
│   ➕ Add from Question Bank (search drawer) · Total: 20/20    │
│  SECTION B · Structured (20m)  [+ structured][+ essay]        │
│   Q1 [new] Solve & justify (practical)      20m ⤒⤓ ⋯          │
│  Total marks balance: auto-synced · 40 ✓                      │
│ ─────────────────────────────────────────────────────────────│
│ ▸ PREVIEW:  student instructions → 8 questions → palette       │
│  (Practice-mode preview, no submission stored)                │
│ footer: Save draft | ‹ back | [Preview] | Publish ▶tuition    │
└───────────────────────────────────────────────────────────────┘
```

Internal sub-tabs (Settings / Sections / Preview). Settings = form section cards. Sections = accordion list with question rows (drag reorder, ⤒⤓ arrows, per-question marks input). Question picker = `Sheet` w/ search of TCH-17 bank + "Create new" inline mini-editor (reuse TCH-18 form modal).

### Components
`Tabs` (`line`), accordions, `Input` number (marks), `SpinButton` reorder, `DropdownMenu`, `Sheet` (bank picker), `Switch`, radio group, `Textarea`, `StatusPill`, `DataState`, `QuestionRenderer` (preview), `QuestionPalette` (preview nav), `AssessmentTimer` (preview countdown).

### Content & data
- **Settings → `assessments`:** title, `description`, `programme_id`/`module_id` (nullable), `grade_id`, `subject_id`, `curriculum_id`, `duration_min`, `total_marks` (derived), `availability` (open/close), `attempt_limit`, `shuffle_questions`/`shuffle_options`, `grader` (auto|manual|hybrid), `result_visibility` (immediately|after_close|manual), `instructions`.
- **Sections → `assessment_sections`:** title, `position`; questions via `assessment_questions` bridge with per-row marks; `marks` editable per question (auto-recount total; warn if ≠ expected).
- **Bank picker:** search + filter by type/grade/subject/topic/strand/difficulty; multi-select add to section; shows usage_count.
- **Create new:** mini question editor (all TCH-18 fields), saves to bank + adds to section.
- **Reorder:** drag/drop + arrows; section reorder too. Auto-balance: sticky "Total 40/40 ✓" chip.
- **Preview:** read-only simulation — instructions screen, question navigator `QuestionPalette`, timer counts; not persisted.
- Publish: POST → `status=scheduled` when window in future (or `open` if window now); if all-auto-graded publish immediate.

### Primary CTA
**Publish ▶** (`variant="tuition"`, footer). Enabled when settings valid AND ≥1 section with ≥1 question AND marks balanced.

### Secondary Actions
Save draft; Preview; Back; Add section; Add questions (bank/create); per-question ⋯ (Edit, Duplicate, Remove, Move to section); Rebalance marks (autofix distractor); Archive/discard.

### Filters / Search / Sort / Pagination
Bank picker search + attribute filters + pagination (reuse TCH-17 controls); date inputs for availability.

### Permissions
`tuition_assessment:create|update|publish` + `tuition_question:read` (bank selection); ownership; principal override.

### Empty State
No sections: "No sections yet — add Section A to start placing questions."; empty section: "This section has no questions. Add from the Question Bank or create a new one."; bank empty → links to TCH-18 create-first.

### Loading State
Settings fields as `Skeleton h-9`; section accordions skeleton; picker Sheet skeleton rows; publish button spinner on post.

### Error State
Validation inline: "Title required", "Set availability", "Question needed", "Marks overflow (total 44 ≠ 40)"; publish conflict (concurrent edit) destructive banner; bank fetch fail → picker inline retry.

### Success State
`toast("Assessment saved")` (draft saves); the **Publish** jump-scare success card reused — "Assessment live for Algebra Mastery" with buttons to TCH-16 results + STU-11 student flow; auto-redirect 3s.

### Mobile Behavior
Settings stack; question rows become cards (marks input prominent); bank Sheet full-height; preview scrolls with sticky timer; publish row sticky bottom; drag → chevrons.

### Accessibility
Sub-tabs `role="tablist"` full semantics; marks inputs labelled; reorder announces positions; preview timer `role="timer"` + aria-live when low; picker focus-trapped; marks balance live region.

### Related Screens
TCH-14 (list) · TCH-16 (results after publish) · TCH-17/18 (bank + editor) · STU-10…12 (student flow) · SCH-08 (network adoption reuse).

---

## TCH-16 Assessment Results (ID: TCH-16)

### Purpose
Deep post-assessment analysis: participation, score distribution, per-question difficulty/performance,
topic/strand analysis, and export (CSV/PDF) — turning raw attempts into next-teaching decisions.

### User
Teacher. Principal read. super_admin school-mode read. (Student sees own via STU-13.)

### Route
`/tuition/teacher/assessments/[id]/results`

### Navigation
Teacher Shell; breadcrumb `Tuition / Teach / Assessments / [Assessment] / Results`. Entry from TCH-14 `[rs]`, TCH-08 results tab, TCH-21 drill-down.

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ …nav…        Results: End-of-Module 2 (Algebra F1)  [Export ▾]│
│───────────────────────────────────────────────────────────────│
│ KPI: Sat 42/42 · Mean 68% · Median 70 · Max 100 · SD 12       │
│───────────────────────────────────────────────────────────────│
│ ┌──────────────────────────────┬────────────────────────────┐ │
│ │ Participation (funnel)       │ Score distribution         │ │
│ │ enrolled 42 · started 42 ·   │  ▁▂▃▅▇█▃▂      Recharts Bar │ │
│ │ submitted 40 · graded 40     │  (buckets 0–100)           │ │
│ │ caption: who actually took it│  caption: where do scores  │ │
│ └──────────────────────────────┴────────────────────────────┘ │
│ ┌──────────────────────────────┬────────────────────────────┐ │
│ │ Per-question analysis        │ Topic analysis (radar)     │ │
│ │ Q1 · 82% · easy    Q5 · 31%  │  Strands of CBC F1 Math    │ │
│ │ Q2 · 74% · medium  Q6 · 12%⚠│  Numbers=82 Algebra=54      │ │
│ │ Q3 · 60% · medium  Q7 · 45%  │  Geometry=71 Measures=76   │ │
│ │ Q4 · 55% · medium  Q8 · 88%  │  caption: which strand     │ │
│ │ caption: which questions were│  needs reteaching?         │ │
│ │ hardest for the class?       │                            │ │
│ └──────────────────────────────┴────────────────────────────┘ │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Attempt table (graded)                                    │ │
│ │ Student      Score  %  Time  Status        Actions        │ │
│ │ Achieng O.   34/40  85  18:12 graded       [review]       │ │
│ │ Wanjiku M.   28/40  70  19:40 graded       [review]       │ │
│ │ Brian K.     12/40  30  20:01 graded       [review]       │ │
│ │ · 40 attempts · export CSV · PDF · · page 1 of 4 ·        │ │
│ └───────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

Panel grid → per-question/topic → attempt table. Charts use Recharts (spec below).

### Components
`KPI` blocks, Recharts (`BarChart`/`RadarChart`/`FunnelChart`/`AreaChart`), `StatusPill` (attempt), `ScoreDial` (row), `DropdownMenu` (export), `Button`, `DataState`, `EmptyState`.

### Content & data
- KPIs: Sat (submitted/graded/total attempts), Mean, Median, Max, Std-dev; participation funnel: `enrolled → started → submitted → graded` from attempts.
- **Charts (Recharts specs):**
  1. Score distribution — `BarChart` (`ResponsiveContainer` height 260): x buckets 0–9…90–100, y students; fill `hsl(var(--tuition-assess))`; clickable bucket → filters attempt table. Caption: *"Where do most of your students' scores fall?"* Empty: "No graded attempts yet — upload results after grading."
  2. Participation funnel — `FunnelChart`: stages with counts; stroke `hsla(var(--tuition-learning))`; caption: *"Who actually completed this assessment?"* Empty: funnel hidden + copy.
  3. Per-question analysis — `BarChart` horizontal: x per-question % correct; bars `--tuition-assess`, sub-40% bars `--destructive`; caption: *"Which questions did the class find hardest?"* Empty: "No attempt data."
  4. Topic/strand analysis — `RadarChart`: strands × avg %; fill `--tuition-accent` at 15% opacity; caption: *"Which curriculum strand needs reteaching?"* Empty: "Strand analysis requires attempts tagged with curriculum strands."
- Attempt table: student, score X/max, %, time taken, status pill (`submitted|graded`), action `review` → STU-13-style answer review modal (per-question right/wrong/blank + explanation); sort; pagination.
- Export: CSV (raw attempts + per-question), PDF (summary + charts), both via `DropdownMenu`.

### Primary CTA
**Export ▾** (`variant="tuition"`) header — CSV / PDF. Row primary: **Review** attempt.

### Secondary Actions
Export CSV / PDF; bucket-click filter clear; per-row review; "Publish results to students" (if `result_visibility=manual`, button flips to `published_results`); Re-run analysis; message low scorers.

### Filters / Search / Sort / Pagination
Attempt table: search student, status segment (all/graded/submitted), sort by score/time; pagination 10/page. Distribution bucket click = filter.

### Permissions
`tuition_assessment:read` + `tuition_assessment:grade` for manual-result publishing; ownership + school scope; students see only aggregated here (their row is in STU-13).

### Empty State
No attempts at all: `EmptyState` (`BarChart3`): "No attempts yet — this assessment hasn't been taken." (charts show their own captions' empty copy). Per-question: "Not enough responses." manual-results: banner "Results hidden until you release them."

### Loading State
KPI skeletons + chart area `Skeleton` (fixed 260px to avoid Recharts reflow); table rows; export button spinner.

### Error State
Aggregate fail banner + Retry; export fail → `toast("Export failed — try again.")`; per-question detail fail inline retry.

### Success State
`toast("CSV exported — 40 attempts")`; `toast("Results published to students")`; bucket filter applies with animation + "Clear bucket filter" chip.

### Mobile Behavior
Charts stack; Radar smaller (`h-200`); attempt table → stacked cards; bucket tapping still works (touch); export Sheet; review modal bottom Sheet; KPIs `grid-cols-2`.

### Accessibility
Each chart: `role="img"` wrapper + `aria-label` (question + caption) + data table fallback in caption expand; colour distinction for sub-40% bars paired with pattern/text; axis ticks `muted-foreground`; table caption; export buttons labelled.

### Related Screens
TCH-14 (list) · TCH-15 (builder) · TCH-12 (feeds topic strengths/weaknesses) · TCH-21 (analytics) · STU-13 (student result) · SCH-09 (school view).

---

## TCH-17 Question Bank (ID: TCH-17)

### Purpose
Home for every question a teacher owns: search/filter across all seven types + metadata (grade, subject,
topic, strand, difficulty, marks, curriculum outcome), quick preview, and usage analytics for reuse.

### User
Teacher (bank owner). Principal read. super_admin school-mode read.

### Route
`/tuition/teacher/question-bank`

### Navigation
Teacher Shell; breadcrumb `Tuition / Teach / Question Bank`. Left nav **Question Bank** active. Reached from TCH-15 picker "Manage bank", TCH-18 after save.

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ …nav…                  Question Bank           [+ New question]│
│───────────────────────────────────────────────────────────────│
│ Search… ⌕  Grade▾ Subject▾ Type▾ Diff▾ Topic▾ Strand▾ Used ▾ │
│ [mcq][mul][t/f][short][struc][essay][practical]  chips        │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Sectioned table · Question Bank (n=86)                   │ │
│ │ Q  Type   Question stem            G m Δ  ✎Used ⋯         │ │
│ │ Q1 MCQ   Solve for x: 3(x+2)=21    F1 4 ▲ 12▪  ✓      ⋯  │ │
│ │ Q2 MCQ   Which is a variable? …    F1 4 ▲  8▪  ✓      ⋯  │ │
│ │ Q3 Strc  Explain cellular resp…    F2 6 ◉  3▪  ✓      ⋯  │ │
│ │ Q4 Essay Describe amoeba loc…      F2 8 ◉  2▪  ✓      ⋯  │ │
│ │ Q5 Multi Fact pairs of 24 — multi  F1 3 ◉ 18▪  ✓      ⋯  │ │
│ │                                      Edit·Preview·Usage    │ │
│ │ · 86 questions · page 1 of 9 ·                            │ │
│ └───────────────────────────────────────────────────────────┘ │
│ Right card: Type mix (doughnut) + Usage leaderboard          │
└───────────────────────────────────────────────────────────────┘
```

Toolbar (search + attribute dropdowns) + type chips; main table; side stats card (`lg:grid-cols-[1fr,260px]`).

### Components
`DropdownMenu` filters, `Badge`, `StatusPill`, chips, `DataState`, `EmptyState`, `Button` (`tuition`/`outline`), `Dialog` (preview), Recharts `PieChart` (type mix), `ScoreDial` not needed here.

### Content & data
- Columns: question, `question_type` chip (7), stem (truncated 2 lines, `min-w`) , grade (G), marks (m), difficulty chip (Δ: green/amber/red = beginner/intermediate/advanced), usage `usage_count` (▪ = assessments using it, "✓" = included), ⋯ (Edit → TCH-18, Preview inline dialog with `QuestionRenderer`, Duplicate, Delete [only if usage_count=0; else disabled w/ tooltip]).
- Filters exact: grade, subject, type, difficulty, topic, strand, usage (used/unused).
- Side stats: `PieChart` type mix (colours per type token) caption: *"What kinds of questions do you tend to reuse?"* (empty: "Add questions to see your mix."); usage leaderboard (top 5 questions by `usage_count`).

### Primary CTA
**+ New question** (`variant="tuition"`, header) → TCH-18.

### Secondary Actions
Row ⋯ (Edit/Preview/Duplicate/Delete); Export bank CSV (P1); Import placeholder (P1); filter chips clear; "Create from assessment" deep-link.

### Filters / Search / Sort / Pagination
All tool-bar filters multi-select; search matches stem/explanation/topic; sort: Updated · Marks · Usage; pagination 10/page; `query ? "No questions match your search." : "No questions yet — create your first question."`

### Permissions
`tuition_question:read` own-school; `tuition_question:create|update|delete` ownership; principal override; super_admin read across network-published bank items.

### Empty State
Full `EmptyState` (Database): "Your bank is empty — add MCQ, structured or essay questions to build assessments faster." + `+ New question`.

### Loading State
Rows skeleton ×6; filter selects disabled while loading; side card skeleton (`h-40`).

### Error State
List fail banner + Retry; delete-in-use shows toast "In use by 3 assessments — cannot delete" + disabled action; picker-context error inline.

### Success State
`toast("Question created")` (from TCH-18) / `toast("Question updated")` / `toast("Question deleted")`; usage count ticks up when added to an assessment.

### Mobile Behavior
Table → stacked cards; chips scroll; side card moves below table; filters collapse into `Filter` button → Sheet; preview dialog bottom Sheet.

### Accessibility
Table caption + scope; type chips with text labels; preview dialog focus trap + Escape; usage count read; delete confirm modal with danger copy.

### Related Screens
TCH-18 (editor) · TCH-15 (picker) · TCH-16 (results feedback to difficulty) · TCH-21 (weak topics tie).

---

## TCH-18 Question Editor (ID: TCH-18)

### Purpose
Create/edit a single question across all seven types with full metadata, live preview, and usage analytics
(read-only view when already in use).

### User
Teacher (author). Principal read. super_admin school-mode read.

### Route
`/tuition/teacher/question-bank/new` · edit: `/tuition/teacher/question-bank/[id]`

### Navigation
Teacher Shell; breadcrumb `Tuition / Teach / Question Bank / New question`. Entry: TCH-17 + New; TCH-15 "Create new".

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ …nav…       Question editor   [Preview] [Usage (12)] [⋯]      │
│───────────────────────────────────────────────────────────────│
│ ┌──────────────────────────────┬────────────────────────────┐ │
│ │ QUESTION FORM                │ Live preview               │ │
│ │ Type* [mcq ▾]   Marks* [4]   │ ┌────────────────────────┐ │ │
│ │ [mcq][mul][t/f][short][stru] │ │ 1. Solve for x: 3(x+2)│ │ │
│ │  [essay][prac]               │ │    = 21                 │ │ │
│ │ Stem* (textarea)             │ │  (•) 5   ( ) 7  ( ) 9  │ │ │
│ │ Options (mcq/multi):         │ │  ( ) 10                │ │ │
│ │  • A [5] ●  ( ) B [7]        │ │  Explain: a=…          │ │ │
│ │  ( ) C [7] ( ) D [10]        │ │ [flagged] [Guess? hide]│ │ │
│ │  [+ option] [mark correct]   │ └────────────────────────┘ │ │
│ │ For t/f: [True][False] ;      │ (renders per type with    │ │
│ │ short: [blank l=20] ;         │  QuestionRenderer)        │ │
│ │ structured: sub-parts editor; │                           │ │
│ │ essay: rubric textarea+max w  │  Recharts: difficulty by  │ │
│ │ practical: prompt + rubric    │  type? (skip) · Usage      │ │
│ │ ─────────────────────────────  │  card: “Used in 12        │ │
│ │ METADATA:                     │  assessments · avg 61%”   │ │
│ │ Grade F1 · Subject Math ·     │                           │ │
│ │ Topic [Linear equations]       │  [Usage: 12 ▪  Avg 62%]  │ │
│ │ Strand [Algebra — Strand 2 ▾] │                           │ │
│ │ Difficulty (Δ beginner▾) ·     │                           │ │
│ │ Curriculum outcome [KENYA CBC  │                           │ │
│ │  F1.3.2 … select from strands] │                           │ │
│ │ Explanation (textarea)        │                           │ │
│ └───────────────────────────────┴───────────────────────────┘ │
│ footer: Cancel · Save to bank ▶tuition                        │
└───────────────────────────────────────────────────────────────┘
```

`lg:grid-cols-[1fr,360px] gap-6`: form (type chips, dynamic fields per type, metadata) + live preview & usage card.

### Components
`QuestionRenderer` (preview), type chip `ToggleGroup`, dynamic inputs, `MultiSelect` strand, difficulty segmented, `Textarea`, `Badge`, `DropdownMenu` (⋯ = Duplicate, Draft state, Delete-if-unused), `DataState`, Recharts (unset usage-miniature).

### Content & data (`questions`)
- **Type-specific fields:** `mcq`: options [{id,text,is_correct}] (≤6, exactly 1 correct); `multi_select`: options (≥1 correct, select-all semantic; "select all that apply"); `true_false`: correct bool; `short_answer`: accepted answers list (or blank input). `structured`: sub-questions array (each with own stem+marks+answer); `essay`: rubric textarea + max words/points; `practical`: prompt, materials, rubric.
- **Metadata:** `marks`, `difficulty` (beginner|intermediate|advanced), `topic` (tag text), `strand` (search tag), `curriculum_strand_id` (select from `curriculum_strands` w/ outcome text), `subject_id`, `grade_id`, `curriculum_id`, `explanation`, `usage_count`.
- Preview live-renders per type; palette affordance for multi-part.
- Usage analytics (edit mode): `usage_count`, list of assessments containing it (link to TCH-16); avg performance when answers exist ("62% correct" note conditional on attempt data).
- Validation: correct-answer must exist for gradable types; marks ≥1; stem non-empty; explanation optional.

### Primary CTA
**Save to bank** (`variant="tuition"`, footer). In edit mode: **Save changes**.

### Secondary Actions
Preview (toggle pane on mobile); Duplicate; Cancel; Delete (usage=0 only); "Save & continue" → TCH-17; Insert from bank (structured picks).

### Filters / Search / Sort / Pagination
Strand picker search; nothing else.

### Permissions
`tuition_question:create|update|delete` + ownership; question in use → update allowed (content change warns "⚠ changes affect 12 assessments"), delete blocked.

### Empty State
N/A (form). Preview pane empty until stem typed (shows `placeholder` copy "Stem preview appears here").

### Loading State
Form `Skeleton` while strands/subjects load; preview skeleton while switching type; usage card skeleton.

### Error State
Inline validation (`border-destructive` + text); bank save network fail → banner + "Save again"; Strand fetch fail → inline.

### Success State
`toast("Question saved to bank")`; if used: `toast("Updated — will apply to next attempt")`; duplication `toast("Duplicated")`.

### Mobile Behavior
Columns stack form→preview; type chips horizontal scroll; preview collapses to a toggle sheet; option rows full-width with `is_correct` radio left; submit sticky bottom.

### Accessibility
Type toggle = radiogroup (not colour-only); option correct-state announced with label "Correct answer"; preview `aria-live="polite"`; marks input labelled; practical/essay rubric linked; keyboard full form travel; focus visible.

### Related Screens
TCH-17 (bank) · TCH-15 (assessment builder integration) · TCH-16 (question performance) · data-model `questions` row.

---

## TCH-19 Live Classes (schedule & manage) (ID: TCH-19)

### Purpose
Schedule and run live lessons: upcoming/live/ended views, recurring options, join links, attendance, and a
replay library — all tied to a programme.

### User
Teacher (host). Principal read. super_admin school-mode read.

### Route
`/tuition/teacher/classes` (`?create=1` opens create dialog)

### Navigation
Teacher Shell; breadcrumb `Tuition / Teach / Live Classes`. Left nav **Live Classes** active. Entry dashboard "Schedule Class".

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ …nav…                     Live Classes          [+ Schedule]  │
│───────────────────────────────────────────────────────────────│
│ KPI: This week 4 · Live now 1 · Avg attend 23 · Replays 3     │
│───────────────────────────────────────────────────────────────│
│ View: [Week grid][List]   Month: Sep 2026 ‹ ›                │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Mon 14  Tue 15  Wed 16  Thu 17  Fri 18                    │ │
│ │ ▓ 09:40 Algebra   ▓ 11:20 Amoeba   ▓ 14:00 Algebra         │ │
│ │    👥 26          │  LIVE 🔴 · join│   (recurring weekly)  │ │
│ │ ░ 13:00 Amoeba   │                 │                       │ │
│ └───────────────────────────────────────────────────────────┘ │
│ ┌── List ────────────────────────────────────────────────────┐ │
│ │ Class             Prog        When         Status   Att ⋯  │ │
│ │ Alg live Q&A      Alg Mastery  14 Sep 09:40  sched  —  ⋯   │ │
│ │ Bio lesson 2.1    Amoeba…      today 11:20  LIVE  ◆ 26 ⋯   │ │
│ │ Eng book talk     CBC Eng 6    today 15:00  sched  —  ⋯    │ │
│ │ ── Replays ── (kick to Library)                            │ │
│ │ ◆ Amoeba lesson 1.1  replay 4 Sep · 42 views · 27 joined   │ │
│ └───────────────────────────────────────────────────────────┘ │
│ Create dialog: title · programme · date+time · recurring      │
│ (once|daily|weekly) · capacity · provider (meet|zoom|livekit) │
└───────────────────────────────────────────────────────────────┘
```

Week grid (compact, clickable) + list; replay library below or tabbed. `Tabs` (`line`) Live / Scheduled / Ended / Replays.

### Components
`Card` grid, `Badge` (LIVE pulse `--tuition-live`), `StatusPill` (scheduled|live|ended|cancelled), `Button` (join/copy), `DropdownMenu`, `Dialog` create, `AvatarGroup` (attendees), `DataState`.

### Content & data
- Rows/`live_classes`: title, programme, `starts_at`–`ends_at`, `recurring` (once|daily|weekly), provider (meet|zoom|livekit placeholder), `meeting_url`, `recording_url`, `capacity`, join_links jsonb, `attendance_count`.
- Actions: **Join** (live, opens provider or `/tuition/classes/[id]` classroom), revisit scheduled ("Copy invite"), ended → **Replay** (watch `recording_url` inline), ⋯ (Edit, Cancel with reason+notify, Duplicate next week, Attendance report, Send reminder).
- Create dialog fields + attendance: `live_class_attendees` coalesced per class ("Expected 28 · Joined 27").

### Primary CTA
**+ Schedule class** (`variant="tuition"`).

### Secondary Actions
Join / Copy invite / Replay; ⋯ (Edit, Cancel, Remind, Attendance, Duplicate); Switch grid/list; prev/next week; "Save to calendar" (ICS link, P1).

### Filters / Search / Sort / Pagination
Week navigator; tabs Live/Scheduled/Ended/Replays; search by title/programme; no pagination (weekly scope + history pagination in replays).

### Permissions
`tuition_live:create|update` + programme ownership; join links resolve per role (students get learner links, teacher host link); cancelled by owner/principal.

### Empty State
No classes: `EmptyState` (VideoOff): "No live classes scheduled — hold your first live Q&A." + `+ Schedule`. "No replays yet — replays appear after a class ends."

### Loading State
Week grid cells skeleton; list rows; LIVE pulse static until data (no fake blink).

### Error State
Provider link failure → "Unable to join — link from provider" + Retry; create conflict (overlap same audience) → warning tile, allow override; banner + retry on list fail.

### Success State
`toast("Live class scheduled — students notified")`; `toast("Invite link copied")`; cancel confirm → `toast("Class cancelled — 26 notified")`; recording ready `toast("Replay available")`.

### Mobile Behavior
Week grid becomes horizontal day-strip + full list below; Live banner sticky top when a class is live; create bottom Sheet; join buttons full-width; replay list stacked.

### Accessibility
Week grid navigable via keyboard (arrow keys move focus); LIVE indicator not colour-only (🔴 icon + "LIVE" text); links revealed to SR; time format localised; cancellations announce affected students.

### Related Screens
TCH-01 (teach today) · TCH-08 (programme context) · STU-14/15 (student view/classroom) · SCH-10 (school schedule).

---

## TCH-20 Teacher Activities (ID: TCH-20)

### Purpose
Organise school activities (sports, music, drama, clubs, debate, competitions, events): create, run
registrations, form teams, publish fixtures and results, and monitor participation.

> Shorter screen — coverage trimmed to the organising essentials. (P2.)

### User
Teacher (organiser). Principal approve. super_admin school-mode read.

### Route
`/tuition/teacher/activities` (`?create=1` opens create dialog)

### Navigation
Teacher Shell; breadcrumb `Tuition / Teach / Activities`. Left nav **Activities** active.

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ …nav…                  Activities                [+ New ▾]    │
│───────────────────────────────────────────────────────────────│
│ KPI: Live 2 · Registrations 4 · Teams 12 · Avg reg 38         │
│───────────────────────────────────────────────────────────────│
│ Search… | Type▾ | Status: All  draft regs in-prog results done│
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ Activity        Type     Date    Regs  Teams  Status ⋯    │ │
│ │ 🏀 Inter-class  sports  20 Sep   42    8    regs     ⋯   │ │
│ │ 🎭 Drama fest   drama   12 Oct   12    4    draft    ⋯   │ │
│ │ 🗣 Debate champ debate  17 Sep   24    6    regs     ⋯   │ │
│ │ 📚 Book club    club     ongoing 18    —    in-progd ⋯    │ │
│ └───────────────────────────────────────────────────────────┘ │
│ Registration drawer (selected): Achieng O.✓ · Wanjiku · …    │
│  [approve][withdraw] · Teams: F1A · F1B · F2 … [+ new team]  │
│ Fixtures (sports): 🆚 F1A vs F1B · Sat 09:00 [enter score]   │
└───────────────────────────────────────────────────────────────┘
```

List + selected-activity drawer (registrations / teams / fixtures per type).

### Components
`Card` list, `StatusPill` (activity), `Badge` (type/team), `DropdownMenu`, `Button` (`tuition`/`outline`), `Dialog` create, `DataState`, `AvatarGroup`.

### Content & data
- Create: name, `type` (sports|music|drama|club|debate|competition|event), description, venue, `starts_at`/`ends_at`, capacity, cover.
- Registration list: `activity_registrations` status `pending|approved|participated|withdrawn`; bulk approve; waitlist when capacity hit.
- Teams (`activity_teams`): name, captain assign, + team, assign registrants.
- Fixtures (`activity_matches`): home/away, venue, `scheduled_at`, enter scores → status `scheduled|finished|walkover|cancelled`.
- Status follows `_context` §7: `draft|registrations|in_progress|results|completed|cancelled`.

### Primary CTA
**+ New ▾** (`variant="tuition"`): New activity | Import from template (P2).

### Secondary Actions
Duplicale/Edit/Cancel; Approve/withdraw registrations; + Team; Enter score; Share signup link; Export roster CSV; Results → publish leaderboard.
- (Activity status pill flips: `registrations→in_progress→results→completed`.)

### Filters / Search / Sort / Pagination
Search; Type dropdown; status segments; sort date/registrations; pagination 10/page.

### Permissions
`tuition_activity:create|update|publish`; principal approves final publish (or teacher for school-scoped); registrations tied to programme enrolments.

### Empty State
"No activities yet — organise your first event or club." + CTA; no registrations: "No sign-ups yet — share the link."

### Loading State
Rows skeleton; drawer skeleton; create dialog disabled until loaded.

### Error State
Banner+Retry; duplicate fixture warn; capacity conflict inline.

### Success State
`toast("Activity created — opened for registration")`; `toast("Score saved — F1A 2–1 F1B")`; `toast("Roster exported")`.

### Mobile Behavior
List stacked; drawer bottom Sheet; fixtures as matchup rows; scores numeric inputs large; approve all sticky.

### Accessibility
Status pill text; fixture rows articulated for SR (home vs away); avatar groups labelled; dialogs trap focus; cancel confirms.

### Related Screens
TCH-01 (quick action) · STU-16/17 (student discovery/registration) · SCH-10 (school approval) · NET-07 (leagues, P2).

---

## TCH-21 Teacher Analytics (ID: TCH-21)

### Purpose
The teacher's evidence wall: completion, engagement, assessment performance, topic weaknesses, assignment
standing and class comparisons — every chart answers a concrete question and every chart has an empty state.

### User
Teacher. Principal read. super_admin school-mode read.

### Route
`/tuition/teacher/analytics`

### Navigation
Teacher Shell; breadcrumb `Tuition / Teach / Analytics`. Left nav **Analytics** active. Entry dashboard "View all", TCH-16 drill-down back.

### Layout

```
┌───────────────────────────────────────────────────────────────┐
│ …nav…                   Analytics        [Range: Term ▾]      │
│───────────────────────────────────────────────────────────────│
│ KPI: Enrolled 128 · Completion 61% · Assessment 68% ·         │
│      Assignment 72% · Engagement 54%                          │
│───────────────────────────────────────────────────────────────│
│ ┌────────────────┬──────────────────────────────────────────┐ │
│ │ What I teach   │ Programme completion · stacked bar       │ │
│ │ Prog ▸ Alg 42  │  █  avg % across programmes by week      │ │
│ │ Prog ▸ Bio 28  │  ▔▔ line   (chart below)                  │ │
│ │ Prog ▸ Eng 55  │  caption: how is each programme pace?    │ │
│ └────────────────┴──────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────┬─────────────────┐ │
│ │ Lesson completion (heat/grouped bars)  │ Topic weakness  │ │
│ │ caption: which lessons stall students? │ radar/bar list  │ │
│ │                                       │ caption: where  │ │
│ │                                       │ should I reteach│ │
│ └────────────────────────────────────────┴─────────────────┘ │
│ ┌────────────────────────────────────────┬─────────────────┐ │
│ │ Assessment performance (line, classes) │ Engagement      │ │
│ │ caption: which class is improving?     │ caption: who is │ │
│ │                                       │ quietly dropping │ │
│ │ Class comparison table/segments        │ out?            │ │
│ └────────────────────────────────────────┴─────────────────┘ │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Assignment completion (bar by assignment)                │ │
│ │ caption: which tasks are students skipping?              │ │
│ └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

KPI strip → programme selector rail → chart grid `grid-cols-1 lg:grid-cols-2 gap-6`. Range control (Term / 30 days / custom).

### Components
Recharts (stacked bar, grouped bar, line, radar, area), `KPI`, `DropdownMenu`, segmented range, `DataState`, `EmptyState`, `Card` panels each with title + caption + chart + empty state.

### Content & data — charts (each: question → Recharts spec → empty state)

1. **Programme completion** — question *"Is each programme progressing at the expected pace?"* → `BarChart` (x week, y avg `progress_pct`, one bar per programme, stacked or grouped), tick muted, tooltip card bg; empty "No enrolments yet — completion charts appear once students start lessons."
2. **Lesson completion** — *"Which lessons stall students?"* → `BarChart` horizontal (lesson title × %students completed), low bars `--destructive` under 50%; empty "No lesson progress recorded."
3. **Assessment performance** — *"Which class is improving / dipping?"* → `LineChart` (x assessments by date, y mean %, one line per class using `--chart-1..5` + `--tuition-assess`); empty "No graded assessments."
4. **Topic weaknesses** — *"Which curriculum strand should I reteach next?"* → `RadarChart` (strands × avg %, `--tuition-accent` 15% fill) forward-fed from TCH-16 per-programme aggregation; empty "No strand-tagged attempt data yet."
5. **Assignment completion** — *"Which assignments do students skip or late-submit?"* → `BarChart` (x assignment, y submitted%), series `--tuition-activity` for on-time, `--destructive` late); empty "No assignments with submissions."
6. **Engagement** — *"Which students are quietly dropping out?"* → `AreaChart` (x week, y active minutes/lessons, + threshold line `--destructive` at 25%); plus at-risk list under it (link to TCH-12); empty "Insufficient activity data for this period."
7. **Class comparison** — *"How does my class performance compare?"* → grouped `BarChart` (metric by class) + table of classes × KPIs (completion/assessment/assignment), row ⋯ → TCH-11 filtered; empty per metric.
Every chart renders in `ResponsiveContainer`; empty replaces with `EmptyState` + caption; tooltips `backgroundColor: hsl(var(--card))`.

### Primary CTA
**Export report ▾** (`variant="tuition"`, header) — PDF summary (P1)/CSV.

### Secondary Actions
Export; Range change; programme-select rail; metric drill-down (tap class → TCH-11; tap programme → TCH-08; tap weak topic → TCH-16); open student profile from at-risk list.

### Filters / Search / Sort / Pagination
Programme selector (multi via breadcrumb chips); Class selector; Range (Term/30d/custom); metric sort in tables.

### Permissions
`tuition_programme:read` + owned/class scopes; aggregated numbers only (PII stays row-level behind TCH-12); principal super-set.

### Empty State
Global first term: banner "No analytics yet — data appears as students engage." Individual charts have their own empty copy (above); at-risk list "No at-risk students right now 🎉".

### Loading State
KPI skeletons; per-chart fixed-height `Skeleton` (no Recharts resize from zero data — height reserved); range change shows dim overlay + spinner chip.

### Error State
Chart aggregate fail → panel retains caption with "Loading failed" + Retry (per chart, not whole page); export fail toast; programme fetch fail banner.

### Success State
`toast("Report exported")`; range animation transitions; no permanent success.

### Mobile Behavior
Charts stack; radar reduced height; at-risk list cards; range control as segmented scroll; table → stacked rows; drill-down taps large.

### Accessibility
Per-chart `role="img"` + descriptive `aria-label` + collapsible data-table fallback; caption text readable by SR (not decorative); line patterns not colour-solely relied on (markers); reduced-motion safe transitions; focus-visible on interactive chart taps.

### Related Screens
TCH-11/12 (drill into students) · TCH-08 (programme actions) · TCH-16 (results detail) · SCH-12 (school analytics superset) · STU-18 (student mirror).

---

## Reference: entity → screen quick map (TCH scope)

| Entity | Primary screens |
|---|---|
| `programmes`, `programme_modules`, `programme_lessons`, `lessons_resources` | TCH-02, 03–07, 08, 09, 10 |
| `programme_enrolments`, `lesson_progress` | TCH-01, 02, 08, 11, 12, 21 |
| `assignments`, `submissions` | TCH-01, 08, 13, 21 |
| `assessments`, `assessment_sections`, `assessment_questions` | TCH-08, 14, 15 |
| `questions` (bank) | TCH-15, 17, 18 |
| `assessment_attempts`, `assessment_attempt_details` (derived) | TCH-12, 16, 21 |
| `live_classes`, `live_class_attendees` | TCH-01, 08, 19 |
| `activities`, `activity_registrations`, `activity_teams`, `activity_matches` | TCH-01, 20 |
| `network_publications`, `network_adoptions`, `network_benchmarks` | TCH-07, 14, 16 (read) |

End of teacher wireframes (TCH-01 → TCH-21). All statuses, tokens, routes and entities follow `_context.md`,
`03-design-system.md`, `02-information-architecture.md`, `04-screen-inventory.md`, `11-data-model.md`.