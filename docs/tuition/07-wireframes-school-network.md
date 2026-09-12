# DECIMAL TUITION — SPEC FILE 07 — Wireframes: School Admin (SCH-01…12) & Network (NET-01…08)

> Wireframe-level specification. Every screen below is bound to the exact tokens, statuses,
> routes, and entities defined in the source-of-truth files:
> `_context.md` (§2 tokens, §7 statuses), `03-design-system.md` (Tuition tokens, components,
> responsive, a11y), `02-information-architecture.md` (sitemap + per-role navigation),
> `04-screen-inventory.md` (SCH-* / NET-* IDs), and `11-data-model.md` (entities incl.
> `network_publications`, `network_adoptions`, `network_benchmarks`).

---

## 0. Shared conventions for this file (read first)

**Roles.** School screens are used by `principal` and `super_admin` (in *Enter School* school mode).
Network screens are used by `super_admin` / platform coordinators ("P") and by `principal` ("D")
for the read-only/adopt school-facing portions. Route gates per `10-route-architecture.md`:
`/tuition/school` → `["principal","super_admin"]`; `/tuition/network` → `["super_admin","principal"]`.

**THE DETERMINATION (applies to every screen):**
- **School admin screens show the active school's OWN data only.** Rows carry `school_id == active school`.
  Students' names, classes, and marks are visible here because they belong to this school.
- **Network pages show aggregates only across schools**: averages, percentiles, `sample_size`,
  counts of schools/students. Never a student's name, never a student-level row, never an
  identifiable teacher, from another school.
- Benchmarking surfaces render a persistent amber notice — `Anonymized · School-level aggregates
  only` — whenever any cross-school figure is displayed, per `_context.md` §7 network benchmark privacy.

**KPI stat block (exact).** `rounded-xl border border-border bg-card p-5`; label
`text-xs font-medium text-muted-foreground uppercase tracking-wide`; value `mt-2 text-2xl font-bold`
with semantic color (`text-green-600` / `text-amber-600` / `text-blue-600` / `text-red-600` / `text-tuition-network`);
delta line `text-xs` under the value.

**Status pills (exact labels — `_context.md` §7).**
- Programme: `draft · published · archived` · scope `private · school · classes · students · schools · network · public`
- Enrolment: `invited · active · completed · dropped`
- Assessment: `draft · scheduled · open · closed · published_results`
- Attempt: `not_started · in_progress · submitted · graded`
- Activity: `draft · registrations · in_progress · results · completed · cancelled`
- Publication (network): `pending · approved · rejected · published`
- Adoption origin: **Own** (publisher school = active school) vs **Adopted** (`is_adopted = true`,
  `adopted_from` set) with `network_adoptions.adopted_at`.

**Tints (design-system §2.2).** Network/benchmark = amber `--tuition-network`; Activities = green
`--tuition-activity`; Tuition hero controls = `bg-tuition-accent text-tuition-accent-foreground`.
Space eyebrow dots: Learn=blue, Teach=violet, Assess=violet, **Activities=green, Network=amber**.

**Charts.** Recharts only (`ResponsiveContainer`; axis stroke `hsl(var(--border))`; tick fill
`hsl(var(--muted-foreground))`; tooltip `backgroundColor: hsl(var(--card))`). Every chart has a
question it answers (stated in Content & data) and a dedicated empty state.

**Tables.** Sectioned-table-card pattern: `rounded-xl border border-border bg-card overflow-hidden` →
header `p-4 border-b border-border bg-muted/30` + `h2 text-sm font-semibold` → `overflow-x-auto` →
`table w-full text-sm`. On mobile, tables **collapse to stacked label/value rows** instead of
horizontal scrolling where interaction matters (standings/fixtures esp.).

**Statuses on every screen**: loading (skeleton via `DataState`/`Skeleton`), empty (`EmptyState`),
error (inline destructive banner), success (toast / emerald banner), off-line (PWA `SyncIndicator`)
are all defined in `03-design-system.md` §9 and referenced per screen below.

---

# PART A — SCHOOL ADMIN  (principal / super_admin)

School admin lives under a **Tuition shell** with product switcher `{DECIMAL ▾}` and the school
left rail: **Dashboard · Programmes · Teachers · Students · Enrolments · Assessments · Activities ·
Events · Network · Analytics · Settings.**

## School Tuition Dashboard  (ID: SCH-01)

### Purpose
One glance at how the tuition programme is running across the **active school only**: programme
portfolio health, teacher capacity, student engagement, upcoming assessments/activities/live
classes, network standing, and a performance call-out. An early-warning surface, not an analytics
deep-dive (that is SCH-12).

### User
Principal; super_admin in *Enter School* mode.

### Route
`/tuition/school`

### Navigation
Landing page for `/tuition/school` redirect target. Left rail "Dashboard" (`aria-current="page"`).
Arrives from: product switcher (School Management `/dashboard` ↔ Tuition), role-aware dispatch,
bell notification deep links (e.g. "6 students inactive this week").

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Tuition · School Admin · Dashboard              │
│ ◉ Tuition             │  Hillcrest Academy · Grade 8 CBC · Term 1 2026   │
│ ──────────────────────│                        [Last 30 days ▾] [Export] │
│ ▸ Dashboard           ├──────────────────────────────────────────────────┤
│ ▸ Programmes          │  ┌───────────────────┬───────────────────┐      │
│ ▸ Teachers            │  │ ACTIVE PROGRAMMES │  TUITION TEACHERS │      │
│ ▸ Students            │  │        8          │       12          │      │
│ ▸ Enrolments          │  │ ▲ +2 vs last term │ ▲ +3 this term    │      │
│ ▸ Assessments         │  ├───────────────────┼───────────────────┤      │
│ ▸ Activities          │  │ ENROLLED STUDENTS │  ENGAGEMENT RATE  │      │
│ ▸ Events              │  │       486         │      68%          │      │
│ ▸ Network             │  │ ▲ +41 this term   │ ◆ target ≥ 70%    │      │
│ ▸ Analytics           │  └───────────────────┴───────────────────┘      │
│   Settings            │  ┌──────────────────────┬────────────────────┐  │
│ ──────────────────────│  │ Programme status      │ Engagement trend  │  │
│  New Programme  (+)   │  │ donut: 6 published ·  │ line (Recharts)   │  │
│                       │  │ 2 draft · 0 archived  │ weekly active %   │  │
│                       │  │ [View all →]          │ [View analytics→] │  │
│                       │  ├──────────────────────┴────────────────────┤  │
│                       │  │ Assessments now       Live classes        │  │
│                       │  │ Gr8 Math Term2 OPEN   Gr8 Math 04 Mar 2pm │  │
│                       │  │ 124/147 submitted     Gr6 Sci 05 Mar 9am  │  │
│                       │  ├──────────────────────┬────────────────────┤  │
│                       │  │ Network participation │ Alert tiles:       │  │
│                       │  │ 3 adopted assessments │ 2 assessments      │  │
│                       │  │ percentile 62nd       │ closing in 48h     │  │
│                       │  │ [Network hub →]       │ 6 students 7d idle  │  │
└───────────────────────┴──────────────────────────────────────────────┘
```

### Components
KPI stat block ×4 · `StatusPill` (programme + assessment statuses) · `ProgressBar` · sectioned
table cards (compact "now" lists) · Recharts `AreaChart`/`LineChart` (engagement) + donut
(programme status) · `EmptyState` · alert tile grid (`{icon,title,description,color,href}`) ·
`DropdownMenu` (period) · `Tooltip`.

### Content & data
- **KPIs** (own school rollups from `programmes`, `staff`/`programme_instructors`,
  `programme_enrolments`, `tuition_enrolment_daily_activity`): Active programmes = count of
  `status='published'`; Tuition teachers = distinct instructors; Enrolled students = `active`
  enrolments; Engagement rate = % of enrolled students active in last 14 days.
- **Programme status donut** — answers "is my portfolio healthy?" (published vs draft vs archived).
- **Engagement trend line** (28-day weekly active %) — answers "is engagement rising or falling?".
- **Assessments now** — currently `open` or `scheduled` in school + adopted; shows live
  participation `124/147 submitted` and closing time.
- **Live classes** — next 3 `scheduled`/`live` from `live_classes`.
- **Network participation** — own adoptions count + own school percentile from `network_benchmarks`
  (`metric_type='percentile'`). Note amber `Anonymized · School-level aggregates only` beside the
  percentile.
- **Alert tiles** — assessments closing soon, idle students, pending activity approvals.

### Primary CTA
`New Programme` (`+`, pinned under rail) → `/tuition/teacher/programmes/new` (principal may create).

### Secondary Actions
Export current period to CSV · View analytics → SCH-12 · View network hub → SCH-11 ·
Manage programmes → SCH-02 · Open an alert tile.

### Filters / Search / Sort / Pagination
Period `DropdownMenu` (This term / Last 30 days / This year) affects all panels. No table here
(no pagination); header search opens global `/tuition/search`.

### Permissions
`tuition_programme:read`, `tuition_assessment:read`, `tuition_activity:read`,
`tuition_network:read`, `tuition_live:read` — principal/super_admin via membership;
RLS scoped to `active_school_id`. Percentile requires network aggregate rows (service-role written).

### Empty State
No tuition data yet → `EmptyState` (GraduationCap icon) "Tuition isn't set up yet." CTA
`New Programme` + `Explore network content`. KPI cards show `0`/`—`; charts show their own empty
copy.

### Loading State
`DataState` skeleton: 4 KPI `Skeleton` blocks + two tall chart skeletons (`h-48 animate-pulse rounded-lg bg-muted`).

### Error State
Inline destructive banner `rounded-lg border border-destructive/30 bg-destructive/10` "Couldn't
load the dashboard. Retry." Panels that failed render independently; one failure does not blank
the page.

### Success State
Transient: `toast("Dashboard exported")` on export; `toast("All caught up")` after clearing alerts.
No blocking success screen.

### Mobile Behavior
Left rail collapses to off-canvas drawer (`lg:hidden` hamburger). KPI grid → `grid-cols-2` stays
2-up, values `text-xl`. Panels stack to single column `grid-cols-1`. Charts keep `ResponsiveContainer`
height 200px. Touch targets ≥ 40px.

### Accessibility
KPI label/value pairs as semantic text (not image); donut carries a text-value table fallback +
`role="img" aria-label="6 published, 2 draft"`; charts have title+desc via `aria-label`; alert tile
links have descriptive `aria-label`; tables `caption` + `scope="col"`; `aria-current="page"` on active rail.

### Related Screens
SCH-02 Programmes · SCH-12 Analytics · SCH-07 Assessments · SCH-11 Network hub · SCH-04 Teachers ·
SCH-05 Students.

---

## Programmes  (ID: SCH-02)

### Purpose
The full inventory of programmes available at this school — both **school-created** and
**adopted from the network** — with status, visibility, and adoption origin at a glance. Read + a
few admin controls; editing stays in the teacher workspace.

### User
Principal; super_admin in school mode.

### Route
`/tuition/school/programmes`

### Navigation
Left rail "Programmes". Arrives from SCH-01 KPI "Active programmes", SCH-11 "Network programmes"
(after adopt), programme analytics row action.

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Tuition · School Admin · Programmes   [Search] │
│ ▸ Dashboard           │  All school + adopted programmes                │
│ ▸ Programmes ▸        ├──────────────────────────────────────────────────┤
│ ▸ Teachers            │  Tabs: [All] [Published] [Draft] [Archived]     │
│ ▸ Students            │        [School-created] [Adopted]               │
│ ▸ Enrolments          │  [+ New] [Adopt from network]                   │
│ ▸ Assessments         ├──────────────────────────────────────────────────┤
│ ▸ Activities          │  ┌ Table ──────────────────────────────────────┐ │
│ ▸ Events              │  │ Programme        Type       Status   Vis.   │ │
│ ▸ Network             │  │ Grade 6 Math      course   published school │ │
│ ▸ Analytics           │  │   Term 2 Boost             [● published]     │ │
│   Settings            │  │ Form 4 KCSE       exam_prep published  ✓cls │ │
│                       │  │   Mathematics Rev             [●]     [classes│
│                       │  │ Kiswahili Sarufi  course    draft     [●]   │ │
│                       │  │   Workshop                 [○ draft] school │ │
│                       │  │ [Adopted] Gr 8    exam_prep published  classes
│                       │  │   Math Common (net)          [●]     adoption│
│                       │  ├──────────────────────────────────────────────┤
│                       │  │ 8 programmes · 2 with pending enrolments    │ │
└───────────────────────┴──────────────────────────────────────────────────┘
```

Right side (not shown fully above) adds columns: **Adoption origin** (Badge `Own`/`Adopted from
<Riverside|Network>` + `adopted_at` date), **Enrolled** (count), **Teachers**, **Actions**
(`View analytics` ghost icon, `View` link).

### Components
`Tabs` (status + source segmented) · sectioned table card · `StatusPill` (programme) ·
visibility Pill (`private·school·classes·students·schools·network·public`) · adoption Badge
(amber `bg-tuition-network/10 text-tuition-network` "Adopted · network") · `DropdownMenu` (row
actions) · canonical search input · `EmptyState` · `Skeleton`.

### Content & data
`programmes` where `school_id = active school` **or** `is_adopted = true` (adopted copies live in
this school). One row per programme: title, type (`course|revision|remedial|exam_prep|club|…`),
grade/subject (derived from `grade_id`/`subject_id`), status pill, visibility pill, adoption
origin, `students_count` (denormalized), enrolled `active` count, instructors (`programme_instructors`).
Adoption origin logic: `programmes.is_adopted` → show "Adopted · <publisher school name>" with
`network_adoptions.adopted_at`; else "Own".

### Primary CTA
`Adopt from network` → `/tuition/school/network/programmes` (SCH-11 tab). Secondary-primary `New`
→ teacher builder.

### Secondary Actions
Row: View (→ SCH-03 analytics) · View enrolment (→ SCH-06 filtered) · Archive (confirm modal:
"Archive <title>? Enrolled students see it immediately."). Editors (Edit/Clone) are deep links to
teacher manage screens, shown only if principal also has a teacher scope or via
`tuition_programme:update` permission grant.

### Filters / Search / Sort / Pagination
Segmented status tabs (`All|Published|Draft|Archived`) and source tabs (`All|School-created|Adopted`);
search by title/subject/teacher (canonical input, debounced 300ms, min 2 chars, spins a
loading row); sort by Enrolled/Recently updated; server-paginated 20/page with page footer.

### Permissions
Read: `tuition_programme:read` + membership RLS (`school_id IN (select get_user_school_ids())`).
Archive requires `tuition_programme:update`; Create requires `:create` (both mapped to
principal/super_admin).

### Empty State
Empty row `colSpan` message: no programmes → "No programmes yet. Create your first one, or adopt
from the network." With query: "No programmes match your search." `EmptyState` panel top-right
with GraphQL-style suggestion cards (Create / Adopt).

### Loading State
Row skeletons (`Skeleton h-10` ×6) inside the table while `useQuery` resolves; tabs disabled until loaded.

### Error State
Banner "Programmes couldn't load." + Retry button (re-runs the server fetch). Partial error per-tab is isolated.

### Success State
`toast("Programme archived")`; adoption success banner (see SCH-08) links the new programme row.
No full-page success.

### Mobile Behavior
Table collapses to stacked rows: each program card shows title, type, status + visibility pills
together, adoption badge, enrolled count, `View` button full-width `h-9`. Tabs scroll horizontally.
Adoption Badge prominent.

### Accessibility
Sortable headers are buttons with `aria-sort`; status pills are text (never dot-only); adoption
badge has a tooltip with publisher + date; row actions `aria-label`; table `caption`.

### Related Screens
SCH-03 Analytics · SCH-06 Enrolments · SCH-05 Students · SCH-04 Teachers · SCH-11 Network programmes.

---

## Programme Analytics  (ID: SCH-03)

### Purpose
Read-only analytics for one programme: enrolments, completion, assessment mean, and engagement.
The principal gets the same numbers the teacher sees — no editing — so this is an assurance and
review surface, not a builder.

### User
Principal (read-only); super_admin in school mode.

### Route
`/tuition/school/programmes/[id]`

### Navigation
Deep link from SCH-02 row "View analytics", SCH-01 programme donut "View all", teacher share link,
notification ("Form 4 KCSE Math Revision: 3 students completed this week").

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Programme Analytics — Form 4 KCSE Math Revision │
│ ▸ Dashboard           │  Hillcrest Academy only · read-only view         │
│ ▸ Programmes ▸        │  Grade 8 CBC · Mathematics · Revision            │
│ ▸ Teachers            │  [Last 30 days ▾] [Export] [Back to list →]     │
│ ▸ Students            ├──────────────────────────────────────────────────┤
│ ▸ Enrolments          │  ┌───────────────────┬───────────────────┐      │
│ ▸ Assessments         │  │ ENROLMENTS        │  COMPLETION       │      │
│ ▸ Activities          │  │   147             │     61%           │      │
│ ▸ Events              │  │ ▲ +9 this week    │ of 147 started    │      │
│ ▸ Network             │  ├───────────────────┼───────────────────┤      │
│ ▸ Analytics           │  │ ASSESSMENT MEAN   │  ENGAGEMENT       │      │
│   Settings            │  │   56/80 (70%)     │     64%           │      │
│                       │  │ ▼ 3pts vs term    │ min 30m/wk        │      │
│                       │  └───────────────────┴───────────────────┘      │
│                       │  ┌─ Completion over time ─┐ ┌─ Engagement ─┐    │
│                       │  │ line: % completed each │ │ bar: min per  │    │
│                       │  │ week (Recharts)        │ │ week (Recharts│    │
│                       │  ├────────────────────────┴──────────────-─┤    │
│                       │  │ Assessment result distribution          │    │
│                       │  │ histogram of mean scores (Recharts)     │    │
│                       │  ├─────────────────────────────────────────┤    │
│                       │  │ Cohorts        Enrolled  Completed  Mean│    │
│                       │  │ Form 4A 2026      38        26      58 │    │
│                       │  │ Form 4B 2026      37        19      54 │    │
│                       │  │ Form 4C 2026      35        24      61 │    │
│                       │  │ after-schoolclub  37        21      49 │    │
│                       │  │ 147 total · [Cohort breakdown ↗ SCH-06]│    │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### Components
KPI stat block ×4 · Recharts `LineChart` (completion), `BarChart` (engaged minutes/wk),
`Histogram`/`BarChart` (score distribution) · sectioned table card (cohorts) · `ProgressBar`
(per cohort) · `StatusPill` (programme) · `EmptyState` per chart · `Skeleton` · `DropdownMenu`.

### Content & data
Aggregates for `programmes[id]` within active school only. Enrolments = `programme_enrolments`
(`active`+`completed`); Completion % = `lesson_progress.status='completed'` per learner median;
Assessment mean = mean `score/max_score` across `assessment_attempts` for assessments linked to
this programme; Engagement = active minutes from `tuition_enrolment_daily_activity` rollup.
Cohort table read from `programme_cohorts` (+`class_id`). All questions asked by charts:
"Are students finishing?", "Is effort rising?", "How are scores spread?", "Which cohort lags?".

### Primary CTA
`Export` (CSV of cohort + assessment aggregates, no student-level PII by default; a checkbox
reveals student rows only for own school).

### Secondary Actions
Back to list (SCH-02) · "Cohort breakdown" → SCH-06 filtered by this programme · "Action needed:
12 students inactive →" → SCH-05 filtered · Print.

### Filters / Search / Sort / Pagination
Period selector; cohort table sortable by Enrolled/Completed/Mean; no pagination (≤ 50 cohorts).

### Permissions
Read-only: `tuition_programme:read`, `tuition_assessment:read`. No edit/update affordances render
for principal; if the same user has teacher `:update` on this programme, a subtle "Open in
builder" link may appear (still navigates away to teacher context).

### Empty State
Each chart shows `EmptyState` ("No completion data yet — lessons haven't been opened." /
"No assessment results yet."). Cohort table empty row: "No cohorts for this programme."

### Loading State
4 KPI skeletons + 3 chart skeletons; table rows as `Skeleton h-10 ×5`.

### Error State
"Couldn't load analytics for this programme." banner + Retry. If programme is archived, an amber
info banner "Programme is archived — numbers are frozen as of <date>."

### Success State
`toast("Export downloaded")` (toast) and a subtle annotation "View is live" on first load
(skeleton→data). No other success flows.

### Mobile Behavior
KPIs 2×2; charts stack single column (height 200px each); cohort table → stacked cards
("Form 4A 2026 · 38 enrolled · 61% · mean 58").

### Accessibility
Charts: `role="img"` + aria-label summaries; histogram bars keyboard-focusable via native details
fallback table; color not the only encoding for cohort means (also show `%` text). Tables use
`caption`.

### Related Screens
SCH-02 Programmes · SCH-06 Enrolments · SCH-07 Assessments · SCH-12 School analytics.

---

## Teachers  (ID: SCH-04)

### Purpose
See the tuition teaching team for this school, each teacher's programme load and student reach,
and spot workload risk (too many programmes / stalled courses) before it hits quality.

### User
Principal; super_admin in school mode.

### Route
`/tuition/school/teachers`

### Navigation
Left rail "Teachers". From SCH-01 KPI "Tuition teachers", SCH-02 teacher links.

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Tuition · School Admin · Teachers    [Search] │
│ ▸ Dashboard           │  12 tuition teachers · Hillcrest Academy        │
│ ▸ Programmes          │  [Subject ▾] [Load ▾] [Active only ✓]          │
│ ▸ Teachers ▸          ├──────────────────────────────────────────────────┤
│ ▸ Students            │  ┌ Table ──────────────────────────────────────┐ │
│ ▸ Enrolments          │  │ Teacher        Subject     Programs  Load   │ │
│ ▸ Assessments         │  │ J. Mwangi      Math        3        ▓▓░ 60% │ │
│ ▸ Activities          │  │ A. Otieno      Science     2        ▓░░ 35% │ │
│ ▸ Events              │  │ F. Okoth       Kiswahili   1        ░░░ 12% │ │
│ ▸ Network             │  │ L. Njoroge     Math        4        ▓▓▓ 90% │ │
│ ▸ Analytics           │  │   (Gr8 Math Term2 · live class daily)       │ │
│   Settings            │  ├──────────────────────────────────────────────┤ │
│                       │  │ Load = active programmes + live classes +  │ │
│                       │  │ assessments open. Highlight if > 80%.      │ │
│                       │  └──────────────────────────────────────────────┘ │
│                       │  Panel: Teacher syllabus coverage (bar, per    │
│                       │  subject): "Maths — Mbwagu covers Gr 8 CBC     │
│                       │  strands 9/11"                              │ │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### Components
Canonical search · segmented filters (`Subject`, `Load`, `Active only` toggle switch) · sectioned
table card · `ProgressBar` (load, tinted: <50%=success, 50–79%=warning, ≥80%=destructive) ·
`AvatarGroup`/initials chip · `StatusPill` (trailing programme count) · `EmptyState` · `Skeleton`.

### Content & data
Teachers = distinct `staff_id` in `programme_instructors` (role lead/assistant) + any staff with
`tuition_programme:create` permission who authored programmes, both within active school. Columns:
teacher (avatar + name + TSC-level note), subject specialty (from `teacher_subject_assignments`
or programme subject), active programmes (count + worst status pill), students reached
(`programme_enrolments.active` distinct), **workload** (weighted: 1.0/programme + 0.4/live class +
0.3/open assessment, normalized to %) with `ProgressBar`, last active date.

### Primary CTA
`Add tuition teacher` → modal form (pick `staff_id`, set lead/assistant role, notify).
Principal-only in this build.

### Secondary Actions
Row: View programmes (→ SCH-02 filtered by instructor) · Open assessment results by this teacher ·
`Notify` (announcement deep-link to `/tuition/notifications`). Export list.

### Filters / Search / Sort / Pagination
Search name; `Subject` dropdown; `Load` segmented (`All|Low|Medium|High`); `Active only` switch
(filters out teachers whose programmes are all `archived`). Sort by Load, Programmes, Students.
Server-paginated 20/page.

### Permissions
`tuition_programme:read` for listing; `Add teacher` → `tuition_programme:create`/`:update` +
membership manage RLS (`role in ('principal','super_admin')`).

### Empty State
"No tuition teachers yet. Add your first, or publish a programme to assign one." Also shown when
no programmes exist but staff does: "No teachers have tuition programmes yet."

### Loading State
Table `Skeleton` rows ×6; filter controls disabled; workload bars shimmer.

### Error State
"Couldn't load teachers." banner + Retry; `Add teacher` failure shows inline destructive banner in
the modal (never a toast for errors).

### Success State
`toast("Teacher added to tuition")` and the new row appears with a success ring animating once.

### Mobile Behavior
Table → stacked cards: teacher header (avatar+name), chips (subject, programmes), workload bar,
row actions. Filters above card; search stays top.

### Accessibility
Workload not color-only: bar has `aria-valuenow` and adjacent `%` text; avatar chips carry
`aria-hidden` decorative initials with name as text; sortable headers buttons with `aria-sort`.

### Related Screens
SCH-02 Programmes · SCH-05 Students · SCH-07 Assessments · SCH-12 Analytics.

---

## Students  (ID: SCH-05)

### Purpose
Monitor every tuition student in this school: engagement, progress, and enrolled programmes.
Own-school only — names and classes are lawful here (PII boundary is cross-school, not intra-school).

### User
Principal; super_admin in school mode.

### Route
`/tuition/school/students`

### Navigation
Left rail "Students". From SCH-01 alert "6 students idle", SCH-03 "Action needed" links.

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Tuition · School Admin · Students     [Search] │
│ ▸ Dashboard           │  Hillcrest Academy · 486 enrolled               │
│ ▸ Programmes          │  [Class ▾] [Engagement ▾] [Status ▾]  [Export]  │
│ ▸ Teachers            ├──────────────────────────────────────────────────┤
│ ▸ Students ▸          │  ┌ Table ──────────────────────────────────────┐ │
│ ▸ Enrolments          │  │ Student        Class   Pgms  Eng   Last act │ │
│ ▸ Assessments         │  │ A. Ambani  4A  7A   3     92%   today      │ │
│ ▸ Activities          │  │ B. Wafula  4B  7B   2     45%   2d ago     │ │
│ ▸ Events              │  │ C. Mwangi  4C  7A   1     12%   9d ago ⚠    │ │
│ ▸ Network             │  │ D. Khayesi 4D  7B   0     0%    never ⚠    │ │
│ ▸ Analytics           │  ├──────────────────────────────────────────────┤ │
│   Settings            │  │ [Export] selection  · 486 of 486 · page 1/25 │ │
│                       │  └──────────────────────────────────────────────┘ │
│                       │  Top panel: Engagement by class (Recharts bar)  │
│                       │  "Which classes are disengaging this term?"    │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### Components
Canonical search · segmented filters (`Class`, `Engagement`, `Enrolment status`) · sectioned table
card · engagement `ProgressBar` (green>70% · amber 40–70% · red<40%) · `StatusPill` (enrolment
`invited|active|completed|dropped`) · bulk bar (select rows → actions) · `EmptyState` · `Skeleton`.

### Content & data
`students` joined to latest `programme_enrolments` per programme, grouped per student. Columns:
student (avatar initials + `Geist Mono` student ref), class (`grade+stream`), programmes count,
engagement % (from `tuition_enrolment_daily_activity` last 14 days), last active, ⚠ flag when
>7 days idle. Top chart answers "which class is disengaging?" (avg engagement by `classes`).
All figures scoped `school_id = active school`.

### Primary CTA
`Invite students` → modal: pick unlinked students (who are not yet tuition users) → sends invite
(enrolment `invited`). Principal-only.

### Secondary Actions
Row: View student profile → `/tuition/profile/student/[id]` (own school, read-only); bulk bar:
`Enrol in programme` (→ SCH-06 prefilled), `Send reminder`, `Export`. `Export` list respecting
DPO note.

### Filters / Search / Sort / Pagination
Search name/ref; `Class` dropdown (all classes); `Engagement` segmented
(`All|Needs attention <40%|At risk <70%|Good ≥70%`); enrolment `Status` chips; sort Eng/Last
active/Name; server-paginated 25/page + bulk select across page.

### Permissions
`tuition_programme:read` + `tuition_lesson:read` (to compute progress) + membership; invites →
`tuition_programme:enrol`. Never scopes beyond active school.

### Empty State
"No tuition students yet. Enrol a class, or invite students." with `Enrol a class →` CTA to SCH-06.
Search empty: "No students match your search."

### Loading State
`Skeleton` table rows ×6, chart skeleton, filter pills skeleton.

### Error State
"Couldn't load students." banner + Retry. Invite failure → inline modal destructive banner.

### Success State
`toast("Invitations sent to 14 students")`; bulk reminder → `toast("Reminders sent")`.

### Mobile Behavior
Table → learner cards (name, class+ref, engagement bar, programme chips). Filters as stacked
pills; bulk bar pinned above list. Engagement bar full-width.

### Accessibility
Engagement as text + bar (`aria-label="Engagement 92%"`); ⚠ flags also have "idle 9 days" text;
cards keep a real `<table>` semantic on mobile via `role="table"` or reduce to definitions; sort
headers buttons with `aria-sort`.

### Related Screens
SCH-06 Enrolments · SCH-09 Assessment results (per student) · SCH-05 → SCH-03 cohort context ·
SCH-12.

---

## Enrolments  (ID: SCH-06)

### Purpose
Bulk-enrol an entire class into a programme, manage cohorts, and handle individual enrolment
records (status transitions: `invited → active → completed → dropped`).

### User
Principal; super_admin in school mode.

### Route
`/tuition/school/enrolments`

### Navigation
Left rail "Enrolments". From SCH-02 "View enrolment", SCH-05 bulk bar "Enrol in programme",
SCH-03 cohort table.

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Tuition · School Admin · Enrolments            │
│ ▸ Dashboard           │  Tabs:  [Bulk enrol] [Cohorts] [All enrolments] │
│ ▸ Programmes          ├──────────────────────────────────────────────────┤
│ ▸ Teachers            │  TAB: Bulk enrol                               │
│ ▸ Students            │  ┌ Card ──────────────────────────────────────┐ │
│ ▸ Enrolments ▸        │  │ 1. Programme   [Grade 6 Math Term2 ▾]      │ │
│ ▸ Assessments         │  │ 2. Cohort      [Form 6A 2026 ▾ or new +]   │ │
│ ▸ Activities          │  │ 3. Class       [6A 38 students ▾]          │ │
│ ▸ Events              │  │ 4. Review      ▢ 38 selected               │ │
│ ▸ Network             │  │    (excludes 2 already enrolled)           │ │
│ ▸ Analytics           │  │ [◀ Back]        [Enrol 36 students  ▶]     │ │
│   Settings            │  └────────────────────────────────────────────┘ │
│                       │  TAB: Cohorts — table:                        │
│                       │  Cohort       Prog        Class  Enr  Status  │
│                       │  Form 6A 2026 G6 Math T2  6A    36   active   │
│                       │  KCSE Rev 2026 F4 Math R  4A-4C 112 invited  │
│                       │  TAB: All enrolments — table: student, prog,  │
│                       │  cohort, status pill, enrolled_at, actions    │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### Components
`Tabs` (line variant) · form section card (`p-6 space-y-5` + `h2 text-sm font-semibold uppercase`) ·
canonical selects → searchable `DropdownMenu` · review list with checkboxes/bulk select ·
`StatusPill` (enrolment) · switch pill toggle (notification on enrol) · `EmptyState` · `Skeleton`.

### Content & data
Bulk enrol reads `classes` (students via `students.class_id`), `programmes`, `programme_cohorts`
(create inline from `new +`). Preview excludes already-enrolled (`programme_enrolments` active)
and shows a count. Cohorts table from `programme_cohorts` + enrol totals. All-enrolments table:
`programme_enrolments` rows with `student_id → name`, programme title, cohort, status pill,
`enrolled_by`, dates, actions (change status). Status transitions constrained: `invited↔active`,
`active→completed`, any `→dropped` (with confirm reason optional).

### Primary CTA
`Enrol N students` (bulk tab) — creates `programme_enrolments` rows `status='active'` (or
`invited` when the toggle "notify & require accept" is on) in one mutation.

### Secondary Actions
Change individual status (`DropdownMenu` on row) · Create/rename cohort · Notification toggle ·
Export enrolments CSV · Drop student (destructive confirm modal naming the student + programme).

### Filters / Search / Sort / Pagination
All-enrolments tab: programme filter, cohort filter, status chips, search student name, sort by
enrolled_at, paginated 25/page. Cohorts: programme filter + search.

### Permissions
`tuition_programme:enrol` for bulk + status changes; `:create` for cohorts. Manage RLS
(`principal`/`super_admin`). Read via `:read`.

### Empty State
"Nothing enrolled yet. Pick a programme and a class to get started." → bulk tab auto-opens.
Cohorts empty: "No cohorts — create one during bulk enrol."

### Loading State
Preview list shows `Skeleton` rows while counting; tables skeleton ×6; buttons disabled with
`Loader2` when submitting.

### Error State
Inline banner in form on failure: "Couldn't enrol — 2 students already active in this programme"
(toast for success only). Table load failure banner + Retry.

### Success State
Emerald inline banner in bulk tab: "36 students enrolled in Grade 6 Math Term 2." + row-count
confirmation toast; then auto-advance to All-enrolments tab showing new `active` rows.

### Mobile Behavior
Form stacks to one column; review list becomes selectable chips; enrolment tables → stacked cards
with status pill + `…` menu. Bulk button becomes full-width bottom sticky bar.

### Accessibility
Form labels associated (`htmlFor`), errors `aria-describedby`; status dropdown is a button with
`aria-label`; destructive action double-confirm; review selection has live region
`role="status"` ("36 selected").

### Related Screens
SCH-02 Programmes · SCH-05 Students · SCH-01 dashboard KPI (enrolments) · SCH-03 cohort analytics.

---

## Assessments  (ID: SCH-07)

### Purpose
All tuition assessments in the school — **created here** and **adopted from the network** — with
participation and results, plus the entry point to adopt new network assessments.

### User
Principal; super_admin in school mode.

### Route
`/tuition/school/assessments`

### Navigation
Left rail "Assessments". From SCH-01 "Assessments now" panel, SCH-12 performance charts.

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Tuition · School Admin · Assessments           │
│ ▸ Dashboard           │  [All] [Scheduled] [Open] [Closed] [Results]  ┤
│ ▸ Programmes          │  [Own] [Adopted]        [Search]  [Adopt +]    │
│ ▸ Teachers            ├──────────────────────────────────────────────────┤
│ ▸ Students            │  ┌ Table ──────────────────────────────────────┐ │
│ ▸ Enrolments          │  │ Assessment        Gr Subj  Src   Status  Part│ │
│ ▸ Assessments ▸       │  │ Gr8 Math Term2  8A Math  own   open    124/147
│ ▸ Activities          │  │   Common 2026          [●]                   │ │
│ ▸ Events              │  │ Kiswahili Sarufi 7C  Ksw  adopt closed 89/93 │
│ ▸ Network             │  │   Quiz 04             [▷]          [results]│ │
│ ▸ Analytics           │  │ Gr6 Sci Term 2   6A Sci   own  published_results
│ ▸ Settings            │  │                                             │ │
│                       │  │ Mean shown in [Results] column for          │ │
│                       │  │ published_results: 68% · 59% · 71%          │ │
│                       │  ├──────────────────────────────────────────────┤ │
│                       │  │ 9 assessments · 2 adopted · next closes 02 Mar
│                       │  └──────────────────────────────────────────────┘ │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### Components
Tabs/segmented (`status` × `source`) · sectioned table card · `StatusPill` (assessment) ·
source Badge (`Own` muted vs `Adopted` amber `bg-tuition-network/10 text-tuition-network`) ·
participation `ProgressBar` (`submitted/total`) · `DropdownMenu` row actions · canonical search ·
`EmptyState` · `Skeleton`.

### Content & data
`assessments` where `school_id = active` **or** `is_adopted = true`. Columns: title, grade,
subject (`subject_id`), source, status pill (`draft|scheduled|open|closed|published_results`),
participation (`assessment_attempts.submitted` / enrolment-eligible count), mean score (shown
under `published_results`), window (`open_at → close_at`), actions. Adopted rows show publisher
school in tooltip. Exact statuses per `_context.md` §7.

### Primary CTA
`Adopt +` → SCH-08 adopt flow. `New assessment` (ghost-secondary) → teacher builder
(`/tuition/teacher/assessments/new`).

### Secondary Actions
Row: Participation & results (→ SCH-09) · Download results CSV · Edit window (adopted copies:
reschedule only, edit questions disabled) · Archive (destructive confirm) — for own assessments.

### Filters / Search / Sort / Pagination
Segmented status (All|Scheduled|Open|Closed|Results), source (All|Own|Adopted), search title/subject,
sort by Status order / Close date, paginated 20/page.

### Permissions
Read: `tuition_assessment:read` + `:enrol`/`:grade` where needed; source filters enforce RLS.

### Empty State
"No assessments yet. Adopt a network assessment or create one." → two CTAs. Search empty message,
else default empty-row copy.

### Loading State
`Skeleton` rows ×6 + segmented tabs disabled; participation bars shimmer.

### Error State
"Couldn't load assessments." banner + Retry; adopted-set failure shows a separate inline banner
(partial data still listed).

### Success State
Adoption success banner at top (see SCH-08) "Gr 8 Math Term 2 Common was adopted — you can now
schedule it." + `toast("Schedule saved")` after reschedule.

### Mobile Behavior
Table → assessment cards (title, subject/grade chips, source badge, status pill, participation
bar, actions). Segmented filters horizontal-scroll. Adopt CTA stays in a header row.

### Accessibility
Status pill text always (dot + text); source badge with tooltip of publisher; `caption` on table;
bar with `role="progressbar"` + text %.

### Related Screens
SCH-08 Adopt · SCH-09 Participation & results · NET-04/05 network assessments · SCH-11 network hub.

---

## Adopt Network Assessment  (ID: SCH-08)

### Purpose
Browse the published **common assessments** on the network, compare up to 3 side by side, and
adopt one into this school (creates an adopted copy: `is_adopted=true`, `adopted_from` set,
`network_adoptions` row written).

### User
Principal; super_admin in school mode (teacher may adopt via NET-05 too).

### Route
`/tuition/school/assessments/adopt`

### Navigation
"Adopt +" from SCH-07 (and SCH-11 network assessments tab). Back → SCH-07.

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Adopt a network assessment                     │
│ ▸ Dashboard           │  Browse published common assessments on Decimal  │
│ ▸ Programmes          │  [Grade ▾] [Subject ▾] [Curriculum CBC ▾]      │
│ ▸ Teachers            │  [Search]                     [Compare 3 ▾]     │
│ ▸ Students            ├──────────────────────────────────────────────────┤
│ ▸ Enrolments          │  ┌ Card grid (2-up, tap = select):             │
│ ▸ Assessments ▸       │  ┌───────────────────┐ ┌──────────────────────┐ │
│ ▸ Activities          │  │ ☑ Gr 8 Math       │ │ ☐ Grade 6 Math      │ │
│ ▸ Events              │  │  Term 2 Common 26 │ │  Term 2 Common 26   │ │
│ ▸ Network             │  │  183 schools ·    │ │  141 schools ·      │ │
│ ▸ Analytics           │  │  12,842 students  │ │  9,318 students     │ │
│   Settings            │  │  ⌀ 62% · 60 min   │ │  ⌀ 58% · 45 min     │ │
│                       │  │  50 marks · Math  │ │  40 marks · Math    │ │
│                       │  │  [ADOPT]          │ │  [ADOPT]            │ │
│                       │  └───────────────────┘ └──────────────────────┘ │
│                       │  Compare tray (when 2–3 selected):              │
│                       │  ┌──────────────┬──────────┬──────────┐        │
│                       │  │              │ Gr8 Math │ Gr6 Math │        │
│                       │  │ Duration     │ 60min    │ 45min    │        │
│                       │  │ Marks        │ 50       │ 40       │        │
│                       │  │ Question mix │ 12 MCQ.. │ 8 MCQ..  │        │
│                       │  │ Network mean │ 62%      │ 58%      │        │
│                       │  └──────────────┴──────────┴──────────┘        │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### Components
Filter pills (`Grade`/`Subject`/`Curriculum` dropdowns + search) · programme-style assessment
cards in `grid gap-4` · select-to-compare toggle (checkbox + `Compare (n)` tray) · comparison
table card · `StatusPill` (publication `published`) · `BenchmarkCard`-lite meta rows ·
`EmptyState` · `Skeleton`.

### Content & data
`network_publications` where `type='assessment'` and `status='published'`, joined to
`assessments` (title, grade, subject, curriculum, `duration_min`, `total_marks`,
`question count`), plus aggregate participation from `network_benchmarks` (`avg`,
`metric_type='participation'`, `sample_size`) — **never student identities**. If this school has
already adopted (adoption exists in `network_adoptions` for this `ref_id`), card shows
"Adopted ✓" and disables ADOPT.

### Primary CTA
`ADOPT` (on each card / from compare tray) → confirm modal: "Adopt <title> into Hillcrest
Academy? A schedulable local copy will be created. Network benchmarks will update with your
school's results (aggregated only)." → confirm writes the copy + `network_adoptions`, lands on
SCH-07.

### Secondary Actions
`Preview questions` (read-only modal, `tuition_assessment:read`) · `View network results` →
NET-05 public results · `Download PDF/JSON paper` (NET action, disabled if publisher's school
restricted) · Clear comparison.

### Filters / Search / Sort / Pagination
Grade (`8`), Subject (`Mathematics`), Curriculum (`CBC`), search title, sort Popularity/Newest,
paginated 12/page (card grid).

### Permissions
Read: `tuition_assessment:read` + `tuition_network:read`; Adopt: `tuition_programme:enrol` /
`tuition_content:create` (permission "adopt") mapped to principal/teacher. Moderation state only
`published` items.

### Empty State
"No published network assessments match your filters." (EmptyState with Globe2 icon) + `Clear
filters`. If nothing published yet: "No common assessments published yet. Check back soon."

### Loading State
Card grid `Skeleton` ×8 (aspect-video placeholders) + compare tray hidden until ≥1 selected.

### Error State
"Couldn't load network assessments." banner + Retry. Adoption failure after confirm:
inline destructive banner in modal ("Adopt failed — refresh and try again").

### Success State
Emerald success banner (SCH-07 header) + row added with `Adopted` amber badge; `toast("Assessment
adopted")`. The adopted copy is `status='draft'`, ready to schedule.

### Mobile Behavior
Cards 1-up; compare tray becomes sticky bottom sheet (swipe up) with a 1-col comparison;
ADOPT button full-width `h-10`. Filters as horizontal scroll chips.

### Accessibility
Compare checkboxes have labels; comparison table has `caption` + `scope="col"`; ADOPT
confirm modal focus-trapped, `Escape` closes; adoptate buttons announce `aria-live`.

### Related Screens
SCH-07 Assessments (landing) · NET-04/05 · SCH-11 · SCH-09 participation.

---

## Assessment Participation + Results  (ID: SCH-09)

### Purpose
School-aggregate view of ONE assessment's participation and results — own students' rows are legal
here; cross-school benchmark context shown as aggregate only with the amber privacy note.

### User
Principal; super_admin.

### Route
`/tuition/school/assessments/[id]`

### Navigation
Row action from SCH-07 "Participation & results", SCH-01 assessment alert.

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Participation & Results — Gr8 Math Term 2      │
│ ▸ Dashboard           │  Scribbler: CBC · Grade 8 · Math · 60min · 50mk │
│ ▸ Programmes          │  Status [● open] · Source [Adopted · network]  │
│ ▸ Teachers            │  (Amber: Anonymized · School-level aggregates only
│ ▸ Students            │  when network figures shown)                   │
│ ▸ Enrolments          ├──────────────────────────────────────────────────┤
│ ▸ Assessments ▸       │  ┌───────────────────┬───────────────────┐      │
│ ▸ Activities          │  │ ELIGIBLE          │ SUBMITTED         │      │
│ ▸ Events              │  │   147             │    126 (86%)      │      │
│ ▸ Network             │  ├───────────────────┼───────────────────┤      │
│ ▸ Analytics           │  │ SCHOOL MEAN       │  NETWORK MEAN     │      │
│   Settings            │  │  64% · 32/50      │ 62% · n=183 schools│     │
│                       │  └───────────────────┴───────────────────┘      │
│                       │  ┌ Score distribution ──────┐ ┌ By class ──┐   │
│                       │  │ histogram (Recharts)     │ │ bar mean/  │   │
│                       │  │ "How are scores spread?" │ │ class      │   │
│                       │  ├──────────────────────────┴──────────────┤   │
│                       │  │ Per-strand performance (own school)      │   │
│                       │  │ Number work ▓▓ 78% · Algebra ▓░ 54% ·    │   │
│                       │  │ Measurement ▓ 61% ... [topics ↦ NET-06]  │   │
│                       │  ├──────────────────────────────────────────┤   │
│                       │  │ Table: Student            Class  Score   │   │
│                       │  │        A. Ambani          7A     43/50   │   │
│                       │  │        B. Wafula          7B    31/50    │   │
│                       │  │   (own school rows only)        [CSV ▾]  │   │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### Components
Detail header with meta + `StatusPill` (assessment) + source badge · KPI ×4 · Recharts histogram
+ grouped `BarChart` (class means) · per-strand horizontal bars (`ProgressBar`) · sectioned table
card (own students) · `DropdownMenu` (student row actions) · amber privacy note chip ·
`EmptyState` · `Skeleton` · `ScoreDial` for student drill.

### Content & data
For `assessments[id]`: participation (eligible vs submitted vs still `open`), school mean vs
network mean (`network_benchmarks.metric_type='avg'`, `sample_size`), score histogram, class
means, strand/topic performance (from `assessment_attempt_details.question_results` grouped by
`curriculum_strands`). Student table shows **active school's own** learners only (`students` +
`assessment_attempts`). Grades surfaced only after `result_visibility` permits
(`immediately`/`after_close`/`manual`; if `manual` a lock note appears).

### Primary CTA
`Download results (CSV)` — own-school rows, or aggregate-only report, toggle.

### Secondary Actions
View a student's attempt (→ `/tuition/profile/student/[id]` graded view, own school) ·
`Benchmark vs network` → NET-06 · Publish results (if `result_visibility='manual'` →
`status='published_results'`) · Re-open window (adopted-copy reschedule allowed) · Export PDF.

### Filters / Search / Sort / Pagination
Student table: class filter, search, sort Score/name, paginated 25/page. Strand panel: subject
strand filter. Chart none.

### Permissions
`tuition_assessment:read` + `:grade` for publish results; own-school RLS guarantees student rows
never leak cross-school.

### Empty State
No attempts: histogram empty state "No submissions yet" + per-strand hidden + table empty row
"No students attempted this assessment yet." If result not published: `locked` empty state with
lock note.

### Loading State
KPI skeletons + chart skeletons + table `Skeleton` rows; `StatusPill` shimmer.

### Error State
"Couldn't load assessment results." banner + Retry; strand panel separately retryable.

### Success State
`toast("Results published to students")`; after export `toast("CSV downloaded")`; if window
updated `toast("Window saved")`.

### Mobile Behavior
KPIs 2×2; charts 1-col; strand bars full-width; student table → stacked cards with ScoreDial
mini; download button bottom sticky.

### Accessibility
Histogram has data table fallback; strand bars have `role="progressbar"` + % text; per-strand not
color-only; student table `caption` + `scope="col"`.

### Related Screens
SCH-07 list · NET-06 Benchmarking · NET-05 detail · SCH-12 analytics.

---

## Activities & Events  (ID: SCH-10)

### Purpose
Approve, schedule, and review **activities** (clubs, sport, competitions) and **events** for the
school. Mirrors the full activity lifecycle: `draft → registrations → in_progress → results →
completed` (`cancelled` any time). Green `--tuition-activity` tint throughout.

### User
Principal (approver); super_admin.

### Route
`/tuition/school/activities` · `/tuition/school/events` (two tabs/route-ids; single page
implementation with `Tabs`).

### Navigation
Left rail "Activities" and "Events". From SCH-01 pending-approval alert, NET-07 league streams.

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Tuition · School Admin · Activities & Events   │
│ ▸ Dashboard           │  Tabs: [Activities] [Events]                    │
│ ▸ Programmes          │  [Pending] [Registrations] [In progress] [Done] │
│ ▸ Teachers            │                                 [New activity +] │
│ ▸ Students            ├──────────────────────────────────────────────────┤
│ ▸ Enrolments          │  ┌ Table ──────────────────────────────────────┐ │
│ ▸ Assessments         │  │ Activity           Type      Status   Regs │ │
│ ▸ Activities ▸        │  │ Hillcrest U15      sports   registrations 24 │
│ ▸ Events ▸            │  │  Football League     [●]   (opening 02 Mar) │ │
│ ▸ Network             │  │ Science Fair 2026   science  pending   —  │ │
│ ▸ Analytics           │  │          (proposed by J. Mwangi) [Approve][⌄]│ │
│   Settings            │  │ Debate Club        debate   in_progress   18 │
│                       │  │   weekly sessions            (wk 4/6)       │
│                       │  ├──────────────────────────────────────────────┤ │
│                       │  │ Mini standings: Hillcrest U15 (3W-1D-0L)   │ │
│                       │  │  ⇄ Riverside Girls · Mwabungo Boys ·        │ │
│                       │  │  fixtures this week: 2 · results in: 1     │ │
│                       │  └──────────────────────────────────────────────┘ │
└───────────────────────┴──────────────────────────────────────────────────┘
```

Green tint usage: status icon chips and the sport/activity accent use
`bg-tuition-activity/10 text-tuition-activity`.

### Components
`Tabs` (line) · sectioned table card · `StatusPill` (activity) · approval banner for pending
(`border-amber-300/30 bg-amber-50/10`) with Approve/Reject buttons · mini standings card
(`activity_matches` scores) · fixtures list · `DropdownMenu` · `EmptyState` · `Skeleton`.

### Content & data
`activities` (school-scoped) incl. teacher-created proposed ones. Columns: name, type
(`sports|music|drama|club|debate|competition|event`), status pill, registrations count
(`activity_registrations`), schedule (`starts_at`), organizer, actions. Approve transitions a
teacher-submitted activity from `draft`/`registrations` to `registrations` (open) or directly to
`in_progress`. Reject requires a reason (modal) with `cancelled` outcome. Football league uses
`activity_teams` + `activity_matches` for standings (P W D L GF GA GD Pts) and fixtures.

### Primary CTA
`Approve` on pending rows (primary for the approving role). `New activity +` (creates as school
activity, status `draft`).

### Secondary Actions
Reject (with reason) · Schedule/reschedule (date picker modal) · Enter results (`home_score /
away_score` or league table editor) · Close registrations · Announce (publish to students via
notifications) · Cancel (destructive confirm) · View registrations.

### Filters / Search / Sort / Pagination
Status segmented (`Pending|Registrations|In progress|Completed|Cancelled`), type dropdown, search,
sort by start date, paginated 20/page.

### Permissions
Approve/schedule/results → `tuition_activity:update` + manage RLS. Read → `:read`. Create →
`:create` (teacher + principal).

### Empty State
"No activities yet." (Trophy icon) CTA `New activity`; per-tab empty row messages; pending tab
"Nothing awaiting approval."

### Loading State
Table `Skeleton` rows ×6; standings card skeleton; tabs lock until first load.

### Error State
"Couldn't load activities." banner + Retry; Approve failure inline banner in confirm modal.

### Success State
`toast("Activity approved — students notified")` / `toast("Results saved")`; pending row moves to
the registrations tab with a green flash animation.

### Mobile Behavior
Table → activity cards with status pill + `Approve`/`…` actions; standings collapse to stacked
fixture rows (3-col → label/value rows: "Hillcrest U15 · 3W 1D 0L · GD +9"). Sticky "New" FAB.

### Accessibility
Standings table `caption` + `scope`; darkened/low-contrast clubs marked "M/K" not just color;
Approve/Reject are labeled buttons; results inputs validated inline; `aria-live` on approval.

### Related Screens
SCH-01 alerts · NET-07 network leagues · SCH-11 network hub · `/tuition/activities` (student view).

---

## Network Hub  (ID: SCH-11)

### Purpose
The school's window onto the Tuition network: discover network programmes, see published common
assessments adoptable, and enter the benchmarking view — all for the **active school's**
participation position against network aggregates.

### User
Principal; super_admin.

### Route
`/tuition/school/network` (+ sub-tabs `/tuition/school/network/programmes`,
`/tuition/school/network/assessments`)

### Navigation
Left rail "Network". From SCH-01 "Network hub" card, SCH-07 adopt context, NET-06 return links.

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Tuition · School Admin · Network Hub           │
│ ▸ Dashboard           │  Hillcrest Academy · network participation      │
│ ▸ Programmes          │  (Amber: Anonymized · School-level aggregates only
│ ▸ Teachers            ├──────────────────────────────────────────────────┤
│ ▸ Students            │  ┌─── Tabs ────────────────────────────────────┐ │
│ ▸ Enrolments          │  │ [Programmes]  [Assessments]  [Benchmarking] │ │
│ ▸ Assessments         │  ├─────────────────────────────────────────────┤ │
│ ▸ Activities          │  │ PROG TAB: discovery grid (adoptable) —      │ │
│ ▸ Events              │  │  Gr 8 CBC Math Sprint · pub. Mwabungo Boys  │ │
│ ▸ Network ▸           │  │  214 adoptions · 12,204 students · [Adopt]  │ │
│ ▸ Analytics           │  │ ASSESS TAB: published common assessments —  │ │
│   Settings            │  │  Gr 8 Math Term2 · 183 schools · [Adopt +]  │ │
│                       │  │ BENCH TAB: BenchmarkCard (own school only): │ │
│                       │  │  School avg 64% vs network 62% · 62nd pctile│ │
│                       │  │  topics: strength Number (78%) / weak       │ │
│                       │  │  Algebra (54%) · [Full benchmarking →]      │ │
│                       │  └─────────────────────────────────────────────┘ │
│                       │  Own participation summary cards: 3 adopted ·   │
│                       │  1 borrowed programme · joined 4 leagues        │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### Components
`Tabs` (line) · discovery card grid · `BenchmarkCard` (schoolAvg, networkAvg, percentile, topics —
see design-system §10) · amber privacy chip · adoption badges · `StatusPill` (publication
`published`) · `EmptyState` · `Skeleton`.

### Content & data
- Programme tab: `network_publications(type='programme', status='published')` with aggregate
  adoption counts (`adoption_count`), `students_count`; adopt → copy into school.
- Assessment tab: same for `type='assessment'` → hands off to SCH-08 or inline adopt.
- Benchmarking tab: `network_benchmarks` rows for this school's **own assessment ids** compared
  to network `avg`/`percentile`/`sample_size`; own weak/strong strands. Always amber note.

### Primary CTA
`Adopt` on programme/assessment cards (primary when not yet adopted; `Adopted ✓` disabled
otherwise).

### Secondary Actions
`Full benchmarking →` NET-06 · Preview a programme/assessment · View publisher profile
(`/tuition/profile/school/[id]`) · Un-adopt (warning modal, only if no active enrolments).

### Filters / Search / Sort / Pagination
Per tab: subject/grade/curriculum filters, search, sort popularity; paginated grids 12/page.

### Permissions
`tuition_network:read` all tabs; adopt → `tuition_programme:enrol`/`tuition_content:create`;
benchmark reading allowed for any member role with `tuition_network:read`.

### Empty State
"No network content yet — the first publications will appear here." per tab; benchmarking tab
empty: "No published results yet — adopt a common assessment to benchmark."

### Loading State
Grid `Skeleton` ×6 + BenchmarkCard skeleton; tabs disabled until loaded.

### Error State
"Couldn't load the network hub." banner + Retry; per-tab partial failure isolated.

### Success State
Adoption success banner (per SCH-08) + updated "Own participation" counts animate; `toast`
"Adopted".

### Mobile Behavior
Tabs become horizontal scroll; grids 1-up; BenchmarkCard features prominent; amber note wraps
(not truncated).

### Accessibility
Tabs `role="tablist"`/`tab`/`tabpanel` with `aria-selected`; BenchmarkCard numbers exposed as
text (never only chart); amber note is a non-interactive `aside` before any aggregate.

### Related Screens
SCH-02/07/08 · NET-04/05/06 · SCH-12.

---

## School Analytics  (ID: SCH-12)

### Purpose
The principal's longitudinal analytics suite: engagement, assessment performance, and network
participation trends **for the active school only** (network comparisons always aggregate).

### User
Principal; super_admin.

### Route
`/tuition/school/analytics`

### Navigation
Left rail "Analytics". From SCH-01 "View analytics", week-flag cross-links.

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Tuition · School Admin · Analytics             │
│ ▸ Dashboard           │  Hillcrest Academy · [Term 1 ▾] [Academic Yr ▾] │
│ ▸ Programmes          │  [Export] [Subscribe weekly report ▾]           │
│ ▸ Teachers            ├──────────────────────────────────────────────────┤
│ ▸ Students            │  ┌───────────────────┬───────────────────┐      │
│ ▸ Enrolments          │  │ WEEKLY ACTIVE     │  ENGAGEMENT RATE  │      │
│ ▸ Assessments         │  │       421         │      68%          │      │
│ ▸ Activities          │  │ ▲ steady vs wk 5  │ ◆ target ≥ 70%    │      │
│ ▸ Events              │  ├───────────────────┼───────────────────┤      │
│ ▸ Network             │  │ MEAN ASSESSMENT   │  NETWORK           │      │
│ ▸ Analytics ▸         │  │  64% (+2 vs term) │  62nd percentile  │      │
│   Settings            │  │ across 9 assmt    │  ▲ 3 vs last term │      │
│                       │  └───────────────────┴───────────────────┘      │
│                       │  Charts (each answers a question):              │
│                       │  ▸ Weekly active students (line, W1..W10)       │
│                       │    "Is engagement growing week over week?"      │
│                       │  ▸ Engagement by grade (bar: Gr6/7/8 + F4)      │
│                       │    "Which grade cohort is waning?"              │
│                       │  ▸ Assessment mean trend (line, 9 assessments)  │
│                       │    "Are results improving?"                     │
│                       │  ▸ Network position (own line vs aggregate band)│
│                       │    "How do we track vs the 183-school avg?"     │
│                       │     (Amber: Anonymized · School-level anchors  │
│                       │      are aggregate band, never other schools)  │
│                       │  ▸ Strand strengths/weaknesses (best/worst 5)   │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### Components
KPI ×4 · Recharts suite (`LineChart`, `BarChart`, `ComposedChart` own-line + `ReferenceArea`/band
for network, `RadarChart` optional) · amber privacy chip on network-position chart ·
`BenchmarkCard` mini · `EmptyState` per chart · `DropdownMenu` (period/report) · `Skeleton`.

### Content & data
Engagement rollups (`tuition_enrolment_daily_activity`), assessment means (`assessment_attempts`
aggregated), strand analysis (own), network position from `network_benchmarks` (aggregate band +
`sample_size`, **never** other-school rows). Every chart answers a stated question; every chart
has a dedicated empty copy.

### Primary CTA
`Subscribe weekly report` (email digest of this page, toggled; or `Export` as the concrete
download action).

### Secondary Actions
Export CSV · Deep links "View" under each chart (→ SCH-03 programme analytics, SCH-09
assessment results, NET-06 benchmarking) · Print view.

### Filters / Search / Sort / Pagination
Term + Academic Year dropdowns; grade segment for the engagement chart. No pagination.

### Permissions
Read-only: `tuition_programme:read`, `tuition_assessment:read`, `tuition_network:read`
(risk of misuse = none, aggregates only).

### Empty State
Each chart `EmptyState` (e.g. "No attempt data this term yet."); page-level empty if school has
zero tuition history → `EmptyState` "Analytics will appear once students begin learning."

### Loading State
4 KPI skeletons + stacked chart skeletons (each `h-48`); dropdowns disabled.

### Error State
"Couldn't load analytics." banner + Retry; per-chart retry islands.

### Success State
`toast("Report will be emailed weekly")` / `toast("Export downloaded")`; refresh of a term
shows skeletons then data (no other success UI).

### Mobile Behavior
Charts full-width 200px; KPI 2×2; network band chart sums to a simple own-vs-avg line to avoid
band artifacts on small screens; export button bottom sticky.

### Accessibility
Band chart described in text ("your school vs the aggregate range"); charts keyboard-free but
with data-table fallback; KPI values text; `aria-live` when term switches reload.

### Related Screens
SCH-01 dashboard · SCH-03 programme analytics · SCH-09 results · NET-06 benchmarking · SCH-12
report.

---

# PART B — NETWORK  (platform coordinators / principal)

Network lives under the Tuition shell with the **platform/network rail**: **Dashboard · Schools ·
Programmes · Assessments · Network · Activities · Moderation · Content · Analytics · Platform ·
Settings.** Amber `--tuition-network` accents appear wherever network/benchmark data is framed.
Every cross-school figure is aggregate — the amber `Anonymized · School-level aggregates only` note
appears on any surface showing a network metric to a school-facing role.

## Network Dashboard  (ID: NET-01)

### Purpose
Platform heartbeat: how many schools are participating, which common assessments are live, how
many schools sit in each activity league, and what is queued for moderation.

### User
Platform coordinator / `super_admin` (P). Principal (D) gets a tailored read-only variant showing
the same network pulse + their school's position (no moderation surfaced).

### Route
`/tuition/network`

### Navigation
Landing page for `/tuition/network` dispatch (super_admin platform role). From NET-08 approve
links, NET-04 assessment cards.

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Tuition · Network · Dashboard                  │
│ ◉ Network ▸           │  Network overview · anonymous aggregates        │
│ ▸ Dashboard ▸         │  (Amber note: Anonymized · School-level only)  │
│ ▸ Schools             │                  [Last 30 days ▾] [Export]      │
│ ▸ Programmes          ├──────────────────────────────────────────────────┤
│ ▸ Assessments ▸       │  ┌───────────────────┬───────────────────┐      │
│ ▸ Network             │  │ PARTICIPATING     │  ACTIVE COMMON    │      │
│ ▸ Activities          │  │  SCHOOLS          │  ASSESSMENTS      │      │
│   Moderation          │  │      214          │       6           │      │
│   Content             │  │ ▲ +11 this month  │  (+2 scheduled)   │      │
│   Analytics           │  ├───────────────────┼───────────────────┤      │
│   Platform            │  │ SCHOOLS IN        │  PENDING REVIEW   │      │
│   Settings            │  │  LEAGUES          │      9            │      │
│                       │  │      48           │  4 programs·3 assm │      │
│                       │  └───────────────────┼────2 activities ──│     │
│                       │  ┌─ Participation over time ─┐  ┌─ Leagues ──┐ │
│                       │  │ line: schools with active  │  │ U15 Footb: 24│ 
│                       │  │ tuition per month (28d)    │  │ U17 Footb: 19│
│                       │  ├────────────────────────────┴─────────────┤ │
│                       │  │ Active common assessments list (top)     │ │
│                       │  │ Gr8 Math Term2 · 183 schls · 12,842 stds │ │
│                       │  │ Gr6 Math T2 · 141 · 9,318 · [Results →]  │ │
│                       │  │ Live incidents/flag tiles: 2 schools with│ │
│                       │  │ zero participation 21 days · 1 rejected  │ │
│                       │  │ publication dispute                     │ │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### Components
KPI block ×4 · Recharts `LineChart` (participation) · league summary cards (green activity tint)
· sectioned list card (top assessments with `StatusPill`) · alert tiles · amber privacy chip ·
`EmptyState` · `Skeleton` · `DropdownMenu` period.

### Content & data
Aggregates only: distinct schools with ≥1 `active` enrolment (`sample_size` semantics), active
common assessments (`network_publications type='assessment' status='published'`, own
`assessments.status ∈ {open,scheduled}`), league schools (`activity_teams` joined to
network activities), pending `network_publications status='pending'` count. Flags: schools 21d
inactive (aggregate count, not name for D; names only for P).

### Primary CTA
`Review pending →` NET-08 when count > 0 (for P). For D: `My school's cuota →` NET-06.

### Secondary Actions
Export CSV · View all assessments (NET-04) · View leagues (NET-07) · View participation breakdown
by region (chart → NET-02).

### Filters / Search / Sort / Pagination
Period dropdown; lists are top-N with "View all" links (no page-level pagination).

### Permissions
P: `tuition_network:read`, `:moderate`; D variant: `tuition_network:read` only (moderation counts
hidden). Route gate `/tuition/network` = `["super_admin","principal"]`.

### Empty State
"No participation yet — invite schools to adopt their first common assessment." Leagues empty:
"No leagues running." Pending empty: "Moderation queue is clear."

### Loading State
4 KPI skeletons + chart + list skeletons; buttons disabled.

### Error State
"Couldn't load network dashboard." banner + Retry; per-panel retry.

### Success State
`toast("Export downloaded")`; no other success flows (this is a read surface).

### Mobile Behavior
KPI 2×2; charts 1-col; league cards stack; amber note wraps; tables → cards.

### Accessibility
Charts with `aria-label` question summaries; league counts text+color; `caption` on lists; note
server is `aside` before aggregate numbers.

### Related Screens
NET-02 Schools · NET-04 Assessments · NET-07 Activities · NET-08 Moderation · NET-06 benchmarking
principal entry.

---

## Network Schools  (ID: NET-02)

### Purpose
All schools on the network with their participation status and aggregate footprints — **drill-down
is aggregate only** (school name, counts, percentile; never another school's students or teachers).

### User
Platform coordinator (P). Principle D sees their own school pinned + the same aggregate list
(no per-school admin).

### Route
`/tuition/network/schools`

### Navigation
Rail "Schools". From NET-01 participation chart, region filter deep link.

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Tuition · Network · Schools                    │
│ ▸ Dashboard           │  Network schools · aggregated participation     │
│ ▸ Schools ▸           │  (Amber: Anonymized · School-level aggregates only
│ ▸ Programmes          │  [Region ▾] [Participation ▾] [Search] [Export] │
│ ▸ Assessments ▸       ├──────────────────────────────────────────────────┤
│ ▸ Network             │  ┌ Table ──────────────────────────────────────┐ │
│ ▸ Activities          │  │ School          Region  Part.  Prog  Bench  │ │
│   Moderation          │  │ Hillcrest Acad  Nairobi ● High  8     62nd  │ │
│   Content             │  │ Riverside Girls Kisumu  ● High  11    71st  │ │
│   Analytics           │  │ Mwabungo Boys   Mombasa ◐ Med   5     48th  │ │
│   Platform            │  │ [aggregate row — no student names]         │ │
│   Settings            │  ├──────────────────────────────────────────────┤ │
│                       │  │ 214 schools · High 96 · Med 70 · Low 48     │ │
│                       │  └──────────────────────────────────────────────┘ │
│                       │  Region breakdown (bar, "where is growth?")     │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### Components
Canonical search · region dropdown · participation segmented (`● High|◐ Med|○ Low`) · sectioned
table card · `StatusPill` (participation) · `DropdownMenu` row actions · Recharts `BarChart`
(by region) · `EmptyState` · `Skeleton`.

### Content & data
`schools` (subset: schools with any `programme_enrolments` or `network_adoptions`), with
`network_benchmarks` percentile (latest per school), programme counts, participation bucket
(High ≥100 active, Med ≥20, Low <20). **Aggregate-only**: the school's numbers, never a foreign
student row. D role: own school row pinned+highlighted; other rows show aggregate only, actions
limited to "View public profile".

### Primary CTA
`Export` (aggregate CSV). P-only secondary-primary `Invite school` (modal, sends onboarding email).

### Secondary Actions
Row: View public profile (`/tuition/profile/school/[id]`) · View benchmarks (≤ NET-06 scoped to
that school's aggregate) · Flag inactivity (P) — opens NET-08-adjacent support ticket.

### Filters / Search / Sort / Pagination
Region, participation bucket, search name; sort by percentile/count; paginated 25/page.

### Permissions
P: `tuition_network:read` + platform admin; D: `tuition_network:read`, RLS prevents any access to
other-school data (aggregates come from service-role rollups).

### Empty State
"No participating schools yet." (Globe2 EmptyState) + Invite school CTA (P). Search miss: default
empty-row message.

### Loading State
`Skeleton` rows ×6 + region bar skeleton.

### Error State
"Couldn't load network schools." banner + Retry.

### Success State
`toast("Invitation sent to Riverside Girls")` (P); no others.

### Mobile Behavior
Table → school cards; participation as icon + text; region chart 1-col; export bottom.

### Accessibility
Participation is text+bucket (not dot-only); sortable headers `aria-sort`; `caption` + `scope`.

### Related Screens
NET-01 · NET-06 benchmarking · NET-02 profile drill · NET-08 moderation flags.

---

## Network Programmes  (ID: NET-03)

### Purpose
Discovery + participation for programmes published to the network (`network_publications
type='programme'`). D adapts a network programme into the school; P manages publication/visibility.

### User
Platform coordinator (P); principal (D) discovers/adopts.

### Route
`/tuition/network/programmes`

### Navigation
Rail "Programmes". From SCH-11 programme tab, NET-01 new publications list.

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Tuition · Network · Programmes                 │
│ ▸ Dashboard           │  Published network programmes (aggregate only)  │
│ ▸ Schools             │  [Subject ▾] [Grade ▾] [Curriculum CBC ▾]      │
│ ▸ Programmes ▸        │  [Popularity ▾] [Search]        [Publish +] (P) │
│ ▸ Assessments ▸       ├──────────────────────────────────────────────────┤
│ ▸ Network             │  ┌ Card grid ──────────────────────────────────┐ │
│ ▸ Activities          │  ┌─────────────────┐ ┌──────────────────────┐ │ │
│   Moderation          │  │ Gr8 CBC Math    │ │ Kiswahili Sarufi     │ │
│   Content             │  │  Sprint         │ │  Express             │ │
│   Analytics           │  │ pub. Mwabungo   │ │ pub. Hillcrest       │ │
│   Platform            │  │ Bo(o)ys         │ │  Academy             │ │
│   Settings            │  │ · exam_prep     │ │ · course · Gr7       │ │
│                       │  │ · 214 adopted   │ │ · 131 adopts · 8,201 │ │
│                       │  │ · 12,204 stds   │ │ · ⌀ 4.8★            │ │
│                       │  │ ⌀ 4.7★ [Adopt]  │ │  [Adopt]            │ │
│                       │  └─────────────────┘ └──────────────────────┘ │ │
│                       │  (D sees adopt; P also sees publication menu) │
│                       │  Table below: publisher, adopts, students,    │
│                       │  avg rating, visibility, status (published)   │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### Components
Programme card grid (`ProgrammeCard` reuse) · filter pills · `StatusPill` (publication +
programme) · adoption badge/tooltip on cards already adopted · `DropdownMenu` (P: unpublish,
feature) · `EmptyState` · `Skeleton`.

### Content & data
`network_publications(type='programme', status='published')` → `programmes` (title, type, grade,
subject, curriculum, `rating_avg`, aggregate `adoption_count`/`students_count`). D cards get
`Adopt`/`Adopted ✓`; P rows get management. Publisher profile link. Nothing student-level.

### Primary CTA
`Adopt` (D) → creates school copy (per SCH-11). P: `Publish +` → NET-08 publication flow.

### Secondary Actions
Preview programme (read-only) · View publisher profile · `Unpublish` (P, confirm) · `Feature on
network` (P, toggles a ribbon in NET-03/NET-01).

### Filters / Search / Sort / Pagination
Subject/grade/curriculum filters; sort popularity/rating/newest; paginated card grid 12/page.

### Permissions
D: `tuition_network:read` + adopt perms; P: `tuition_network:moderate` for publish/unpublish.

### Empty State
"No published network programmes yet." (EmptyState + P "Publish your first"). Filter-miss: "No
programmes match your filters." + Clear.

### Loading State
Card grid `Skeleton` ×8; filter pills skeleton.

### Error State
"Couldn't load network programmes." banner + Retry.

### Success State
Adopt → banner + `toast("Programme adopted")`; P unpublish → `toast("Programme unpublished")`.

### Mobile Behavior
Cards 1-up; pills horizontal-scroll; Adopt full-width.

### Accessibility
Card covers decorative (`aria-hidden`); ratings as ★ text + number; `caption` for the dense table
below; adopt buttons labeled.

### Related Screens
NET-01 · NET-05 (assessments analogue) · SCH-11 · SCH-02.

---

## Network Assessments  (ID: NET-04)

### Purpose
Catalog of published **common assessments** (the DECIMAL EXAMINATION NETWORK) — the flagship entry
point. The platform's headline example: **Grade 8 Mathematics Term 2 Common Assessment — 183
Schools · 12,842 Students.**

### User
Platform coordinator (P); principals (D) and teachers (T) browse + adopt.

### Route
`/tuition/network/assessments`

### Navigation
Rail "Assessments". From NET-01 "Active common assessments", SCH-07 adopt CTA.

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Tuition · Network · Assessments                │
│ ▸ Dashboard           │  DECIMAL EXAMINATION NETWORK — common assessments
│ ▸ Schools             │  (Amber: Anonymized · School-level aggregates only
│ ▸ Programmes          │  [Grade ▾] [Subject ▾] [Window ▾] [Search]      │
│ ▸ Assessments ▸       ├──────────────────────────────────────────────────┤
│ ▸ Network             │  ┌ Table/card list ────────────────────────────┐ │
│ ▸ Activities          │  │ Assessment (title, yr, term)    Gr Subj   St │ │
│ │   Moderation        │  │ Gr 8 Mathematics Term 2       8  Math  open │ │
│   Content             │  │   183 schools · 12,842 students · ⌀ 62%     │ │
│   Analytics           │  │   [View] [Adopt] [Participate] [Results]    │ │
│   Platform            │  ├─────────────────────────────────────────────┤ │
│   Settings            │  │ Gr 6 Mathematics Term 2      6  Math  open  │ │
│                       │  │   141 schools · 9,318 students · ⌀ 58%     │ │
│                       │  │   [View] [Adopt] [Participate] [Results]    │ │
│                       │  │ Kiswahili Lugha Term 2      7  Ksw  closed  │ │
│                       │  │   96 schools · 6,540 students · ⌀ 71% wait? │ │
│                       │  ├─────────────────────────────────────────────┤ │
│                       │  │ publication status pills where relevant    │ │
│                       │  │ 9 assessments · page 1/2 ·  [Publish +] (P)│ │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### Components
Filter pills · sectioned list (rows with rich meta) · `StatusPill` (assessment
`scheduled|open|closed|published_results` and publication `published`) · per-row action buttons
(`View | Adopt | Participate | Results`) · amber note · `EmptyState` · `Skeleton`.

### Content & data
`network_publications(type='assessment', status='published')` joined `assessments` + network
aggregates (`network_benchmarks`: `avg`, `participation`, `sample_size`). Row shows: title (Grade
+ Subject + Term), grade, subject, status, **aggregate participation `183 schools · 12,842
students`**, mean. All numeric aggregates from service-role rollups.

### Primary CTA
`Participate` (D/T): enrolls the whole school cohort for the next window (writes local
adopted copy + participation intent). `Adopt` copies for scheduling later.

### Secondary Actions
`View` → NET-05 detail · `Results` → NET-05 results benchmark tab · `Download paper (PDF / JSON)` ·
`Publish +` (P) → NEW assessment to network via moderation.

### Filters / Search / Sort / Pagination
Grade, subject, window (`open|scheduled|closed|results`), search title/publisher, sort by
participation/date; paginated 10–20/page (list rows).

### Permissions
Read: `tuition_assessment:read` + `tuition_network:read`; participate/adopt:
`tuition_programme:enrol`; publish → moderate.

### Empty State
"No common assessments published yet." (EmptyState) + P CTA to publish. Filter miss default copy.

### Loading State
List `Skeleton` rows ×8 incl. aggregate placeholders.

### Error State
"Couldn't load network assessments." banner + Retry.

### Success State
`toast("School enrolled in Grade 8 Mathematics Term 2")` / `toast("Assessment adopted")`; row
badge flips to "Participating ✓".

### Mobile Behavior
Rows → cards with meta stacked; per-row actions wrap into a 2×2 button grid; amber note first.

### Accessibility
Aggregate numbers as text; action buttons labeled; `caption`/`scope` on the list structure; row
status never color-only.

### Related Screens
NET-05 detail · NET-06 benchmarking · SCH-07/08/09 · NET-08 moderation (publication flow).

---

## Network Assessment Detail  (ID: NET-05)

### Purpose
Full detail of one published common assessment — publisher, curriculum, grade, subject, duration,
marks, participation, average, benchmark — with the action surface **View / Adopt / Participate /**
**Download / Results**, and a benchmark results view.

### User
Platform coordinator (P); principal (D); teacher (T, adopt only). Cooperative screen.

### Route
`/tuition/network/assessments/[id]`

### Navigation
"View" from NET-04 row, SCH-08 preview, NET-01 list.

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Gr 8 Mathematics Term 2 Common Assessment      │
│ ▸ Dashboard           │  ▲ CBC · Mathematics · Grade 8 · 60 min · 50 mk │
│ ▸ Schools             │  Scriber: Mwabungo Boys (publisher) · 1402/2026 │
│ ▸ Programmes          │  Status [● open] · closes 02 Mar · window noted │
│ ▸ Assessments ▸       │  (Amber: Anonymized · School-level aggregates only
│ ▸ Network             ├──────────────────────────────────────────────────┤
│ ▸ Activities          │  ┌───────────────────┬───────────────────┐      │
│   Moderation          │  │ PARTICIPATION     │ STUDENTS          │      │
│   Content             │  │  183 schools      │  12,842           │      │
│   Analytics           │  ├───────────────────┼───────────────────┤      │
│   Platform            │  │ NETWORK AVERAGE   │  MY SCHOOL PERC.  │      │
│   Settings            │  │  62% · ⌀ 31/50    │  64% · 62nd pctile│      │
│                       │  └───────────────────┴───────────────────┘      │
│                       │  ACTIONS: [View] [Adopt] [Participate]         │
│                       │           [Download ▾]  [Results]              │
│                       │  ┌ Overview ───────┐ ┌ Benchmark (tab) ──┐     │
│                       │  │ curriculum,     │ │ histogram of mean │     │
│                       │  │ strands list,   │ │ per school (bar)  │     │
│                       │  │ question types, │ │ percentile marker │     │
│                       │  │ instructions    │ │ per-topic, per-   │     │
│                       │  │ excerpt         │ │ grade panels      │     │
│                       │  └─────────────────┘ └───────────────────┘     │
│                       │  Adopting schools strip: 28 total (aggregate)  │
│                       │  - Riverside Girls · Hillcrest · … (names OK   │
│                       │   at school level, no students)               │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### Components
Detail header (`badge` chips, cover if any, publisher `Avatar` link) · KPI ×4 ·
action `Button` row (tuition variant for Participate) · `Tabs` (Overview | Questions preview |
Benchmark | Adoption) · Recharts histogram (school means distribution) + `ReferenceLine` (own
percentile/M) · `BenchmarkCard` · sectioned table card (school-level adoption strip) ·
`StatusPill` + publication badge · amber note · `EmptyState` · `Skeleton`.

### Content & data
Full `assessments[id]` meta: publisher (`publisher_school_id` → school name, profile link),
`curriculum_id`, `grade_id`, `subject_id`, `duration_min`, `total_marks`, instructions, strand
list, question breakdown (auto-graded MCQ etc.), window. Aggregates from `network_benchmarks`
avg/percentile/participation/sample_size. Benchmark tab: per-school mean histogram (aggregate
buckets, no school's student rows), own percentile marker, per-topic/per-grade panels. School-level
names ARE allowed in the adoption strip (school identities ≠ student data).

### Primary CTA
`Participate` (D/T) — enrolls the school for the next window; appears `Participating ✓` when active.
Secondary-primary `Adopt`.

### Secondary Actions
`View` → read-only question preview (modal/sheet) · `Download` (PDF + JSON paper; P unrestricted,
D guided to results after own window) · `Results` → benchmark tab · Publisher profile · Report an
issue (P) · `Copy sharing link`.

### Filters / Search / Sort / Pagination
Benchmark tab: filter by grade/topic; adoption strip searchable + paginated.

### Permissions
`tuition_assessment:read` (+network read) for all; `Participate`/`Adopt` per adopt perms; P:
moderate actions (unpublish, edit guidance). Benchmark aggregates only via RLS.

### Empty State
No aggregate data yet: "No results aggregated yet." Benchmark tab empty until window closes;
action buttons that depend on own enrolment show contextual empty state.

### Loading State
Detail header skeletons + KPI ×4 skeletons + tab content skeleton.

### Error State
"Couldn't load this assessment." banner + Retry; benchmark tab separately retryable.

### Success State
`toast("School is participating in this assessment")` / `toast("Adopted")`; benchmark tab fills
after first grading run (skeleton → chart).

### Mobile Behavior
Actions collapse to a 2×2 grid with Participate primary; benchmark histogram 1-col; adoption
strip → school cards; Tabs horizontal-scroll.

### Accessibility
Charts have text summaries + data-table fallback; percentile marked by `aria-label` line; action
row is `button` grid with labels; `caption` on tables.

### Related Screens
NET-04 list · NET-06 benchmarking · SCH-08/09 · NET-02 publisher profile.

---

## Benchmarking Dashboard  (ID: NET-06)

### Purpose
The core decision surface: **school average vs network average**, percentile, topic performance,
grade performance, historical comparison, and strengths/weaknesses — **STRICT PII rule**: only
aggregated, anonymized, school-level data; never student-level anywhere, never a student name
across schools. The amber notice is fixed at the top.

### User
Platform coordinator (P, any school scope); principal (D, restricted to **their own school** + the
network aggregate for context).

### Route
`/tuition/network/benchmarking`

### Navigation
Rail "Network". Entry from SCH-11 "Full benchmarking →", NET-05 "Results", school-analytics
network chart. D's view defaults to own school; P can switch school (aggregate only) or view
network-wide.

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Benchmarking Dashboard                         │
│ ▸ Dashboard           │  ── Anonymized · School-level aggregates only ──│
│ ▸ Schools             │  (never student-level across schools)           │
│ ▸ Programmes          │  [Assessment ▾] [Grade ▾] [Subject ▾] [Term ▾] │
│ ▸ Assessments ▸       │  [School: Hillcrest ▾ (D locked to own)]        │
│ ▸ Network ▸           ├──────────────────────────────────────────────────┤
│ ▸ Activities          │  ┌───────────────────┬───────────────────┐      │
│   Moderation          │  │ YOUR SCHOOL AVG   │  NETWORK AVG      │      │
│   Content             │  │      64%          │     62%           │      │
│   Analytics           │  │  n = 147 students │  n = 183 schools  │      │
│   Platform            │  ├───────────────────┼───────────────────┤      │
│   Settings            │  │  PERCENTILE       │  POSITION         │      │
│                       │  │     62nd          │  ▲ 3 vs last term │      │
│                       │  └───────────────────┴───────────────────┘      │
│                       │  ┌── Charts (each answers a question) ─────────┐│
│                       │  ▸ School vs network avg (grouped bar, term)   ││
│                       │    "Where do we sit?"                          ││
│                       │  ▸ Percentile gauge (ScoreDial-style 0-99)     ││
│                       │    "What's our rank strength?"                 ││
│                       │  ▸ Topic performance (bar: own % vs net %)     ││
│                       │    "Which topics pull us down?"                ││
│                       │  ▸ Grade performance (grouped bars Gr6/7/8/F4) ││
│                       │  ▸ Historical comparison (line, 3 terms)       ││
│                       │    "Are we trending up?"                       ││
│                       │  └─────────────────────────────────────────────┘│
│                       │  Strengths / Weaknesses cards:                 │
│                       │  + Number work (78%) · - Algebra (54%)          │
│                       │  [Action ↗ SCH-03/09 export list]              │
│                       │  Methodology note: aggregates written from     │
│                       │  assessment_attempt_details by cron (rounded,  │
│                       │  min n=5 per bucket to display)                │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### Components
Filter pills ×4 + school selector · KPI ×4 (`BenchmarkCard` primary) · Recharts: `BarChart`
(school vs net), gauge (radial or `RadialBarChart`), topic grouped bars, grade grouped bars,
`LineChart` historical · strength/weakness list cards (success/destructive tone) · amber fixed
notice `aside` · methodology footer · `EmptyState` per chart · `Skeleton`.

### Content & data
`network_benchmarks` rows: `metric_type ∈ {avg, percentile, participation, per_strand}`,
`value`, `sample_size` — rolled up by cron from `assessment_attempt_details` grouped by
`school_id` only (service-role; **no student rows outside owning school**). D scope = active
school's own assessment ids vs network aggregate for the SAME assessment/grade/subject/term.
P can toggle school comparison but always aggregate. **Suppression rule**: any bucket with
`sample_size < 5` shows `—` (too few to aggregate), never a derived implication.

### Primary CTA
`Export benchmark report (PDF)` — aggregate figures only, DPO-safe stamp.

### Secondary Actions
`Switch school` (P) · `View assessment detail` → NET-05 · `Action list` (D: weakest strands →
SCH-09 filtered by strand to plan intervention with own-school data) · Print · `Share link` (P row).

### Filters / Search / Sort / Pagination
Assessment · Grade · Subject · Term selectors drive every panel. No pagination.

### Permissions
`tuition_network:read` (all) — D's row-source hard-restricted to active school via RLS; P's
school switch is aggregate-only. Cross-school aggregates pre-computed.

### Empty State
"Not enough data yet — benchmark appears after ≥5 schools complete this assessment."
(min `sample_size` gate) per panel; page empty if no assessment selected. Per-strand suppression
shows `—` rows.

### Loading State
KPI skeletons + chart skeletons (each `h-48`) + methodology note kept visible.

### Error State
"Couldn't load benchmarking data." banner + Retry; per-panel islands; suppression shown as
neutral note, not error.

### Success State
`toast("Report downloaded")`; after export, small "DPO-safe: aggregates only" confirmation line.

### Mobile Behavior
KPIs 2×2; charts 1-col; gauge shrinks; strength/weakness cards stack; filters horizontal-scroll;
the amber notice remains visible (pin to top of scroll region).

### Accessibility
Amber notice is `role="note"` presented before any number; gauge exposes value as text
("Percentile 62"); charts have text summaries + fallback tables; suppression `—` carries a
tooltip "fewer than 5 schools — hidden for anonymity".

### Related Screens
NET-05 results · SCH-11 hub · SCH-12 analytics · SCH-09 strand intervention · NET-02 aggregate
profile.

---

## Activities Network  (ID: NET-07)

### Purpose
Inter-school activities: **sports leagues, festivals, science fairs** — standings, fixtures,
results, and network participation. Green `--tuition-activity` tint throughout. The football
league network example anchors this screen.

### User
Platform coordinator (P); principal (D) for own-school visibility + entry of results flows.

### Route
`/tuition/network/activities`

### Navigation
Rail "Activities". From NET-01 league summary, SCH-10 standings cross-link.

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Tuition · Network · Activities (leagues)       │
│ ▸ Dashboard           │  Tabs: [Leagues] [Festivals] [Science fairs]    │
│ ▸ Schools             │  (Green: tuition activity tint accents)         │
│ ▸ Programmes          ├──────────────────────────────────────────────────┤
│ ▸ Assessments ▸       │  ┌ National U15 Football League ──────────────┐ │
│ ▸ Network             │  │ STANDINGS          P  W  D  L  GF  GA  GD  │ │
│ ▸ Activities ▸        │  │ Hillcrest U15      5  4  1  0  18  4   +14 │ │
│   Moderation          │  │ Riverside Girls U15 5 3  1  1  12  7    +5 │ │
│   Content             │  │ Mwabungo Boys U15  5  2  2  1  10  8    +2 │ │
│   Analytics           │  │ … (8 teams)                                │ │
│   Platform            │  │ FIXTURES (next round):                      │ │
│   Settings            │  │ Sat 14 Mar · Hillcrest vs Mwabungo · 4:30pm │ │
│                       │  │ Sat 14 Mar · Riverside vs Buret · 4:30pm   │ │
│                       │  │ [Enter results ▸]  [Publish fixtures ▸]    │ │
│                       │  ├─────────────────────────────────────────────┤ │
│                       │  │ Science Fair 2026 · 22 schools registered · │ │
│                       │  │ festivals: Kisii Music · Mombasa Drama      │ │
│                       │  │ participation by school (bar chart)         │ │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### Components
`Tabs` by activity type · **standings/fixtures sectioned table cards** (`activity_teams` +
`activity_matches`) · `StatusPill` (activity: `registrations|in_progress|results|completed`) ·
green tint icon chips · `DropdownMenu` (enter results) · Recharts `BarChart` (participation by
school) · `EmptyState` · `Skeleton`.

### Content & data
Network activities from `network_publications(type='activity')` + `activities` referenced
(ligas U15/U17, science fair). Standings derived from `activity_matches`: P W D L GF GA GD Pts,
sorted pts/GD; fixtures upcoming (venue, `scheduled_at`, teams); festivals/sumits: registrations
counts per school (aggregate, school-level identities OK). Result entry (P or D with
`tuition_activity:update`) writes scores → table re-ranks on save.

### Primary CTA
`Enter results` (for a finished fixture, P/D) — modal with home/away scores + validation
(reject impossible GD).

### Secondary Actions
`Publish fixtures` (P) · `Register school` (new team into league) · `Start round` (advance
`registrations → in_progress`) · Announce round · View activity detail · Download fixtures CSV ·
Cancel fixture (`cancelled`, confirm) · `Declare walkover`.

### Filters / Search / Sort / Pagination
Tab by type; league dropdown; team search; standings sort locked (by pts); paginated team list if
> 20.

### Permissions
Read: `tuition_activity:read` + `tuition_network:read`; enter results/register/Publish →
`:update`/`:create`/`:moderate` per role. D scoped to own school's teams for results.

### Empty State
"No network leagues yet." (Trophy EmptyState) · league with no fixtures: "No fixtures scheduled."
· no standings row (league hasn't started): suppress table, show start hint.

### Loading State
Standings + fixtures `Skeleton` rows ×8; tabs disabled; participation bar skeleton.

### Error State
"Couldn't load network activities." banner + Retry; result save failure → inline destructive modal
banner.

### Success State
`toast("Results saved — standings updated")`; re-ranked row animates highlight; `toast("Fixtures
published to schools")`.

### Mobile Behavior
**Standings & fixtures collapse to stacked rows** (esp. mandated): each team row shows
"Hillcrest U15 · P5 W4 D1 L0 · GF18 GA4 · GD +14 · 13pts" as label/value pairs; fixtures as
cards. Result entry bottom sheet.

### Accessibility
Standings `caption` + `scope="col"`; column headers `abbr`; position shown as ordinal number text
("1st") not just bold; green tint decorative, position/points carry text; sort-only-by-pts noted.

### Related Screens
NET-01 · NET-04 analogue · SCH-10 activities · activity detail (`/tuition/network/activities/[id]`
implicit) · NET-08 (publication of a new league).

---

## Moderation Queue  (ID: NET-08)

### Purpose
Review **pending network publications** (`network_publications status='pending'`) — programmes,
assessments, activities submitted for the network — and **approve / reject** with a reason.
Shorter screen: single queue, bulk-tool-free.

### User
Platform coordinator / `super_admin` (P) only. Principal role never sees this.

### Route
`/tuition/network/moderation`

### Navigation
Rail "Moderation". From NET-01 "9 pending" KPI, publisher submission notification.

### Layout

```
┌───────────────────────┬──────────────────────────────────────────────────┐
│ {DECIMAL ▾}           │  Tuition · Network · Moderation                │
│ ▸ Dashboard           │  Pending publications awaiting review           │
│ ▸ Schools             │  [Type ▾] [Status  pending▾] [Search]          │
│ ▸ Programmes          ├──────────────────────────────────────────────────┤
│ ▸ Assessments ▸       │  ┌ Queue ──────────────────────────────────────┐ │
│ ▸ Network             │  │ Type    Item                    Publisher   │ │
│ ▸ Activities          │  │ assess  Gr 8 Math Term 3 Draft  Riverside  │ │
│ ▸ Moderation ▸        │  │ program Gr 6 Sci Labs            Mwabungo  │ │
│   Content             │  │ activity Kisii Music Festival    Hillcrest │ │
│   Analytics           │  │  (each row: type icon, title, publisher     │ │
│   Platform            │  │   school, submitted_at, short meta)        │ │
│   Settings            │  │  [Review]  [Approve ⌄]  [Reject]           │ │
│                       │  ├─────────────────────────────────────────────┤ │
│                       │  │ History (approved/rejected, last 30 days): │ │
│                       │  │ Gr6 Math T2 · approved · by A. 12 Feb      │ │
│                       │  │ Swahili quiz · rejected · reason: duplicate │ │
│                       │  └─────────────────────────────────────────────┘ │
└───────────────────────┴──────────────────────────────────────────────────┘
```

### Components
Filter pills (type / status incl. `approved|rejected|published` history) · queue sectioned table
card · `StatusPill` (publication `pending`) · per-row `Review` (sheet) + `Approve`/`Reject`
confirm modals (reason textarea on reject) · `EmptyState` · `Skeleton`.

### Content & data
`network_publications` queue: `type (programme|assessment|activity)`, `ref_id`, title,
`publisher_school_id` (school name), `visibility='network'`, `status='pending'`, timestamps.
Review sheet (P-only) shows the item preview + publisher school + adoption potential. Approve →
`status='published'` (+ `moderated_by/at`); Reject → `status='rejected'` with reason (shown to
publisher). `adoption_count` increments as schools adopt.

### Primary CTA
`Approve` (per row; primary) → confirmation "Publish <title> to the network?" → toast + row moves
to History as `published`.

### Secondary Actions
`Review` (open preview sheet) · `Reject` (must type reason; destructive confirm) · `Request
changes` (alternative to reject, returns to publisher with notes) · View publisher profile ·
Filter History · Archive resolved (P).

### Filters / Search / Sort / Pagination
Type (all/programme/assessment/activity); status tabs (All|Pending|Approved|Rejected) — pending
tab is default; search title/publisher; sort submitted_at; paginated 20/page.

### Permissions
`tuition_network:moderate` only (super_admin/platform coord). All other roles get a 403/redirect.

### Empty State
Pending tab: "Queue is clear — nothing awaiting moderation." History empty: "No decisions yet."
Filter miss default empty-row copy.

### Loading State
`Skeleton` rows ×8; Review sheet skeleton when opening.

### Error State
"Couldn't load the moderation queue." banner + Retry; approve/reject failure → inline destructive
banner in the modal.

### Success State
`toast("Published to the network")` / `toast("Submission rejected — publisher notified")`; row
animates to History; publisher receives a notification via existing `notifications` deep-link.

### Mobile Behavior
Queue rows → cards; Approve/Reject become full-width split buttons; Review sheet opens bottom-up;
History collapses.

### Accessibility
Approve/Reject labeled buttons distinct (not color alone: "Approve" / "Reject" text);
reject-reason field `aria-describedby` error; queue table `caption` + `scope`; confirm modals
focus-trapped.

### Related Screens
NET-01 (pending count) · NET-03/04/07 (published items land there) · NET-02 publisher profiles ·
SYS-03 notifications (publisher).

---

## End-of-file notes

- All routes above must be added to `protectedPaths` and `routeRoleMap` in `src/lib/auth-config.ts`
  (per `10-route-architecture.md` §3) before implementation.
- All aggregate/benchmark data reads are service-role-written rollups (`network_benchmarks`);
  the app never queries another school's `programme_enrolments`/`assessment_attempts` directly.
- Screen volumes use the exact status labels and tokens from `_context.md` §7 and
  `03-design-system.md` §2.2 (network = amber `--tuition-network`; activities = green
  `--tuition-activity`).
- Cross-cutting states (loading/empty/error/offline/a11y) follow `03-design-system.md` §9/§12 and
  are specified per screen above.