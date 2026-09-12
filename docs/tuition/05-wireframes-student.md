# DECIMAL TUITION — SPEC FILE 05 — Student Wireframes (wireframe level)

> Volume: **Student** (Learn space). Read alongside `_context.md` and `03-design-system.md`; every token, status, route, entity and component name below is the exact name from those files. Nothing here contradicts them.
>
> **Status vocabulary (exact, from `_context.md` §7):** Programme `draft|published|archived` · Enrolment `invited|active|completed|dropped` · Lesson `locked|available|in_progress|completed` · Assignment `draft|open|grading|closed` · Submission `none|draft|submitted|late|graded` · Assessment `draft|scheduled|open|closed|published_results` · Attempt `not_started|in_progress|submitted|graded` · Activity `draft|registrations|in_progress|results|completed|cancelled` · Difficulty `beginner|intermediate|advanced`.
>
> **Color grounding (exact, `03-design-system.md` §2.2):** Learn=blue `tuition-learn` · Assess=violet `tuition-assess` · Activities=green `tuition-activity` · Network=amber `tuition-network` · Live=blue `tuition-live` · Progress=green `tuition-progress`. Hero button = `variant="tuition"` (`bg-tuition-accent`). Neutrals from the inherited Decimal token set.
>
> **Shell conventions used in every wireframe:** desktop = left rail (product switcher + student nav) + content pane; mobile = bottom tab bar (`Home, Explore, My Learning [center/call], Assessments, Activities`) + hamburger-held rail. Player = immersive 3-pane; assessment take = isolated (no nav). All widths are ASCII pushes toward ~76 cols; a row of `…` means "list continues identically".

---

## 1. Scope of this file

| ID | Screen | Route | Priority |
|---|---|---|---|
| STU-01 | Student Home dashboard | `/tuition` | P0 |
| STU-02 | Explore home | `/tuition/explore` | P0 |
| STU-03 | Explore filtered browse + search results | `/tuition/explore?grade=&subject=` | P0 |
| STU-04 | Programme detail | `/tuition/programmes/[id]` | P0 |
| STU-05 | My Learning | `/tuition/my-learning` | P0 |
| STU-06 | Learning player (lesson + resource view) | `/tuition/learn/[programmeId]/[lessonId]` | P0 |
| STU-07 | Lesson/resource states (6 states) | within STU-06 | P0 |
| STU-08 | Assignment list (mine) | `/tuition/assignments` | P0 |
| STU-09 | Assignment detail + submit | `/tuition/assignments/[id]` | P0 |
| STU-10 | Assessment dashboard | `/tuition/assessments` | P0 |
| STU-11 | Assessment instructions + start | `/tuition/assessments/[id]/instructions` | P0 |
| STU-12 | Assessment taking interface | `/tuition/assessments/[id]/take` | P0 |
| STU-13 | Assessment result + review | `/tuition/assessments/[id]/result` | P0 |
| STU-14 | Live classes dashboard | `/tuition/classes` | P1 |
| STU-15 | Live classroom | `/tuition/classes/[id]` | P1 |
| STU-16 | Activities discovery | `/tuition/activities` | P1 |
| STU-17 | Activity detail + registration/fixtures/results | `/tuition/activities/[id]` | P1 |
| STU-18 | Progress | `/tuition/progress` | P0 |
| STU-19 | Achievements | `/tuition/achievements` | P2 |
| STU-20 | Certificates | `/tuition/certificates` | P2 |
| SYS-06 | Student onboarding wizard | `/tuition/onboarding` | P1 |

**Reference student used throughout:** *Wanjiku Mwangi, student row linked to auth user, Form 2 West, Hillcrest Academy, Term 1 2026.* Reference school: **Hillcrest Academy** (Nairobi). When a screen is parent-visible, the parent sees the identical layout with read-only affordances and a lock hint.

---

## 2. Shared student shell (defined once, reused by every screen)

Desktop `TuitionShell` (role = student): `flex h-screen overflow-hidden bg-muted/30`. Left rail `w-64` holds, top→bottom: `ProductSwitcher` ("◉ DECIMAL ▾" → School Management / Tuition), student nav (order + lucide icons from IA file §3: Home`Compass`, Explore`Search`, My Learning`BookOpen`, Classes`Video`, Assessments`ClipboardList`, Activities`Trophy`, Progress`TrendingUp`, Achievements`Medal`), footer (Profile, Notifications, Settings). Active item = `aria-current="page"` + `bg-tuition-accent/10 text-tuition-accent`. Header `h-16 sticky bg-background/80 backdrop-blur-md`: hamburger (`lg:hidden`) → global Search modal (`⌘K`) → SchoolSwitcher → `SyncIndicator` → `SyncConflictBadge` → ThemeToggle → bell dropdown → avatar dropdown.

Immersive screens (STU-06, STU-12, STU-15) drop the rail: player keeps a thin progress rail; assessment take hides ALL nav.

---

## STU-01 Student Home dashboard  (ID: STU-01)

### Purpose
Answer four questions at a glance: **what should I do now** (Continue strip + due-now alerts), **what to finish** (in-progress lessons), **what's next** (upcoming assessments + recommended programmes), **how am I progressing** (KPIs + streak + weak topics). A single scrollable decision surface, no dead tabs.

### User
Student (auth user resolved via `students` row / tuition student-user join). Parent/teacher/principal read-only renderers see the same blocks without CTA buttons.

### Route
`/tuition` (student = Learn home). Redirects to `/tuition/onboarding` on first run for a student with zero enrolments/no onboarding completion.

### Navigation
Desktop rail: Home is active. Header: search modal, school switcher, sync, theme, bell, avatar. Every block navigates: Continue → `…/learn/[pid]/[lid]`; programme cards → `/tuition/programmes/[id]`; alerts → `/tuition/assignments/[id]` or `…/assessments/[id]/instructions`.

### Layout
Two-pane grid: `grid-cols-1 xl:grid-cols-[1fr_320px] gap-6`. Left column: Continue strip on top, KPI row, Due-shortly alerts, My programmes, Recommended. Right column (320px, stacks under on xl): streak/activity card, weak-topics card, notifications preview.

```
┌──────────────────────────────────────────────────────────────────┐
│ ◉ DECIMAL ▾                  Tuition · [⌘K] [⇄] [◐] [🔔 2] [◆]   │
├─────────┬────────────────────────────────────────────────────────┤
│  Home   │  KARIBU, Wanjiku Mwangi           Term 1 2026 ▾        │
│  Explore│  What would you like to do today?  Form 2 West ·        │
│  My Lear│                                · Hillcrest Academy      │
│  Classes├────────────────────────────────────────────────────────┤
│  Assess │  ┌──────────────────────────────────────────────────┐  │
│  Activi │  │ CONTINUE LEARNING                                │  │
│  Progre │  │ Mathematics · Algebra & Functions                │  │
│  Achiev │  │ Module 2 · Linear Equations                      │  │
│  ────── │  │ Lesson 6/24 · Simultaneous Equations             │  │
│  Profil │  │ ▓▓▓▓▓▓▓▓░░░ 67%                       [Resume ▸] │  │
│  Setti  │  └──────────────────────────────────────────────────┘  │
│         ├────────────────────────────────────────────────────────┤
│         │ LESSONS/STREAK    ASSIGNMENTS   ASSESSMENTS   MIN/DAY  │
│         │   12/15 this wk    2 due         1 open        38 min  │
│         │   [5-day streak]   (1 overdue)   due in 2 days   target│
│         ├────────────────────────────────────────────────────────┤
│         │ DUE SOON                                     strong ▓│  │
│         │ ⚠ Business Studies "The Office" essay            │  │
│         │    due Fri 14:00 · submit now                  view │  │
│         │ ⚠ Maths Exit Quiz (40 marks) due in 2 days      │  │
│         ├────────────────────────────────────────────────────────┤
│         │ MY PROGRAMMES        (3 active · 1 invited)   ALL ▸  │  │
│         │ Kiswahili · Sarufi  82% ▓▓▓▓▓▓▓▓░░  Continue ▸ │  │
│         │ Biology · Cell Bio  44% ▓▓▓▓░░░░░░  Continue ▸ │  │
│         │ Computer Science ·  0%   Show your teacher you │  │
│         │  Public Speaking       accepted? Joining soon  │  │
│         ├────────────────────────────────────────────────────────┤
│         │ RECOMMENDED FOR YOU                     EXPLORE ▸     │
│         │ [cover] Physics · Waves (Form 2)  intermed  ★4.8      │
│         │         Ms. Chepkemoi · 18 lessons       [Enrol]      │
│         │ [cover] Agriculture · Soil Science Form 3  star        │
│         │         Mr. Kilonzo · 8 lessons           [Enrol]     │
├─────────┴────────────────────────────────────────────────────────┤
│ (right rail, xl only)  WEEKLY     ⚡ 5-day streak                │
│  Mon ▇▇ Tue ▇▇ Wed ▇▇ Thu ▇ Sat ▂  · WEAK TOPICS                │
│  Simultaneous eq. (Algebra) · viambata (Kiswahili)  · GO ▸      │
│                                 NOTIFICATIONS        ALL ▸      │
│  Ms. Kariuki graded your Biology lab report (34/40)  2h ago      │
└──────────────────────────────────────────────────────────────────┘
```

### Components
`TuitionShell` · `ProductSwitcher` · KPI stat blocks (`rounded-xl border bg-card p-5`, label `text-xs uppercase tracking-wide text-muted-foreground`, value `text-2xl font-bold`) · `ProgressBar` (tone `tuition-progress`) · `StatusPill` (assignment/assessment statuses) · `ProgrammeCard` · `ProgrammeCover` (aspect-video gradient fallback + initials) · Alert tiles (`{icon,title,description,color,href}` in `grid sm:grid-cols-2 gap-3`) · `EmptyState` · `Skeleton` · `DataState` · `SyncIndicator` (offline pill).
Metrics color rule: value text `text-green-600/amber-600/red-600` for good/caution/bad.

### Content & data
- **Continue Learning** — most-recent `ProgrammeEnrolment` where `enrolment_status='active'` and `lesson_state='in_progress'`, with next `LessonList` resume target. Shows programme name, module, lesson number/total, `ProgressBar`.
- **KPIs** (server projected): lessons completed this week (12/15 target), current streak days, assignments with `status='open'` and submission ≠ `graded` (count + overdue flag), open assessments with attempt `not_started`.
- **Due soon** — assignments/enrolment deadline alerts within 72h, and assessments due ≤7 days; overdue rows tinted `text-red-600`.
- **My programmes** — enrolled `ProgrammeEnrolment` rows (`invited|active|completed`); invited rows render an Accept/Decline affordance with `StatusPill invited`.
- **Recommended** — feed from programme publication scope `school|classes|students` matching grade Form 2 where not yet enrolled (personalisation refines later).
- **Right rail** — streak heat strip, weak topics (from recent assessment `topic analysis`), top notifications via existing `notification-center` pattern.

### Primary CTA
**Resume** on Continue strip → continues current lesson (`/tuition/learn/[pid]/[lid]`), `variant="tuition"`.

### Secondary Actions
Continue per-programme (link row) · Enrol on recommended cards (`variant="outline"`) · View all My Programmes / alerts · Accept/Decline invited enrolment · Right-rail "GO" to Progress.

### Filters / Search / Sort / Pagination
None on the dashboard surface itself; global search modal (`⌘K`) is the escape hatch.

### Permissions
Students: own rows only (RLS: enrolment/student scoped). Parent: read-only — CTAs become disabled `link` copies; no Resume/Enrol. Teacher/principal in student view = read-only preview.

### Empty State
First run without enrolments → banner-level `EmptyState` ("Nothing here yet — explore programmes to start learning") with `glow` CTA "Explore programmes" → `/tuition/explore`. KPI row collapses to `0`s; Continue strip hidden. Right rail still shows notifications.

### Loading State
`DataState` per block: Continue strip and KPIs get `Skeleton` bars (`animate-pulse rounded-lg bg-muted`); lower blocks render skeletons in their exact card shapes. Page does not lock.

### Error State
Inline region-level banner (existing pattern: `rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive`): "Couldn't load your dashboard — retry". Per-block `retry` ghost button; non-fatal blocks degrade independently.

### Success State
Transient toasts only (`toast("Lesson resumed")`, `toast("Enrolled in Physics · Waves")`). Enrol from card flips to "Continue ▸". No full-screen success here.

### Mobile Behavior
Bottom tab bar (Home active, My Learning center/elevated). Right rail (streak/weak-topics/notifications) stacks below. Continue strip becomes the first full-width card; touch targets ≥40px.

### Accessibility
Skeleton containers `aria-hidden`; KPI row as `dl`; alerts list `role="list"`; nav `aria-current="page"`; `prefers-reduced-motion` disables the streak heat animation.

### Related Screens
STU-05 (My Learning) · STU-04 · STU-06 · STU-08 · STU-10 · STU-18 · SYS-06 (gate).

---

## STU-06 Learning player  + STU-07 resource states  (IDs: STU-06, STU-07)

### Purpose
The core consumption surface: study one lesson end-to-end, track it as completed, and work with every resource type the lesson exposes. STU-07 defines the six canonical resource/lesson states rendered inside this player: `locked`, `available`, `in_progress`, `completed` (lesson states) and resource states loading / error / offline / locked / completed.

### User
Student with `enrolment_status='active'` on the programme. A lesson is open if the previous lesson is `completed` (gate); otherwise `locked`.

### Route
`/tuition/learn/[programmeId]/[lessonId]`. Route guard re-checks enrolment + lesson unlock server-side (never trust the client gate).

### Navigation
Immersive: **no global rail**. Top bar: back `←` to programme detail (`/tuition/programmes/[pid]`), programme breadcrumb (Programme / Module / Lesson), global search `⌘K`, sync + offline pill. Desktop layout is 3-pane. `[Space]` toggles play/pause on video; `←`/`→` or `Ctrl+←/→` skip lesson (inside module boundaries).

### Layout
`PlayerFrame` (immersive chrome, `rounded-2xl` container): **LEFT (w-72)** module/`LessonList` tree with per-lesson state icons; **CENTER (flex-1, max-w-4xl)** content stage + lesson progress + prev/next controls; **RIGHT (w-80)** tabbed panel: Notes / Resources / Questions & discussion. Tree and right panel collapsible with ghost icon buttons.

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Programmes  › Mathematics · Algebra & Functions           ╳ ⌘K │
│   Module 2 · Linear Equations · Lesson 6 · Simultaneous Equations │
│   ▓▓▓▓▓▓▓▓▓░ 16/24 lessons ⚪ 0 questions                          │
├──────────────┬──────────────────────────────────┬────────────────┤
│ ▾ MODULE 1   │  VIDEO  ▷  Simultaneous Equations│  ▸ NOTES (4)    │
│  ✓ 1 Intro   │  ┌──────────────────────────────┐│  + New note     │
│  ✓ 2 Like    │  │   ▷ How to eliminate x       ││  ▧ Substitution │
│  ✓ 3 Sub     │  │   Ms. Chepkemoi · 09:24      ││    x2-y=7…      │
│ ▾ MODULE 2   │  ├──────────────────────────────┤│  ▧ Exam: check  │
│  ✓ 4 Balance │  │  [caption bar: English/Engli]│─ ─ ─ ─ ─ ─ ─ ─ ─│
│  ✓ 5 Setup   │  └──────────────────────────────┘│  ▸ RESOURCES    │
│  ▶ 6 Employ  │  ⏮ ◀ 5 · [▓▓▓▓▓░░░░ 43%] · 6 ▶ ⏭│  📹 video (62MB)│
│  🔒 7 Elimin │  Mark complete ✓ · Next lesson ▸ │  📄 handout.pdf │
│  🔒 8 Extend  │ Lecture notes (PDF)  · Worksheet │  🔊 audio recap │
│  🔒 9 Pract   ├────────────┬──────────┬─────────┤─ ─ ─ ─ ─ ─ ─ ─ ─│
│  …            │ 3 QUESTS   │ 1 ASSIGN  │ 1 QUIZ  │  ▸ DISCUSSION  │
│               │ [Start]    │ [Open]    │ [Start]  │  Mwikali: how  │
│               │            │           │          │  do we pick  w?│
├──────────────┴────────────┴──────────┴──────────┴────────────────┤
│ MoBILE: ━═ module drawer (⧉ top-left) · stage · ━═ right sheet    │
└──────────────────────────────────────────────────────────────────┘
```

**STU-07 state matrix (rendered in centre stage):**

| State | Triggers | Render |
|---|---|---|
| `in_progress` video loading | buffering/decode | `Skeleton` video surface (`aspect-video` grey block) + `<Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>` + "Streaming lesson…" caption |
| video error | network/HLS failure mid-load | Alert banner `border-destructive/30 bg-destructive/10` + "Couldn't load this video" + **[Retry]** secondary button + "Download MP4" ghost link; retains transcript tab |
| offline | `useOnlineStatus` false or SW miss | `SyncIndicator` **Offline** pill (reused) in top bar + stage swaps video for cached `available` content (lesson body, captions, cached note/PDF) + "You're offline — resume when connected to sync activity" |
| resource locked | lesson gated by previous incomplete | Full-pane `EmptyState` with `Lock` icon: "Complete Lesson 5: Setting up equations to unlock" + `StatusPill locked` on tree node |
| resource completed | `lesson_state='completed'` on entry | Green `✓ Completed` banner (`border-emerald-300/30 bg-emerald-50/10`) at stage top; tree node shows `✓`; button becomes "Completed" disabled |
| `available` baseline | enrolled, unlocked, not started | Player renders normally |

**Discord half of STU-07 lives in the module tree:** icons per node = `✓` completed, `▶` in_progress (plus `ProgressBar` micro-fill), `🔒` locked, `∘` available.

### Components
`PlayerFrame` · `LessonList` (collapsible module tree, per-lesson state icons, `activeLessonId`) · `ProgressBar` · `StatusPill` (lesson + resource statuses; Content types from `_context.md` §7) · `MarkdownText` (lesson body) · `FileDropzone` (assignment attachment) · `SyncIndicator` · `Skeleton`/`EmptyState`/`DataState` · `Button` variants `tuition|outline|secondary|ghost|link` · `Sheet`/`Tabs` (right panel) · `Tooltip` (icon chrome) · `Lucide` icons `Check, Lock, Download, Bookmark, Loader2, Video, FileText, Music, MessageSquare, Plus`.

### Content & data
Lesson model drives the page: `title`, `type` (video/reading/etc.), `duration_min`, `video_url` (+`caption_url` **required** for video lessons), `body` (markdown), `resources[]` (content type + url), `attachments`, `quizzes/assignments/assessments` linked at lesson or module level. Right panel persists per lesson: `notes` (rich text per lesson), `bookmarks` (timestamped video markers), `downloads` (queued files, IndexedDB `src/lib/db.ts`), `discussion` (thread, `announcements`-style typed rows).
Lesson completion write: `LessonProgress` upsert `lesson_state='completed'`; if last lesson of programme → enrolment `completed` + certificate eligibility.

### Primary CTA
**Mark complete** (bottom-centre, `variant="tuition"`): checks completion, advances tree, enables next lesson, then offers **Next lesson ▸** (same button swaps label).

### Secondary Actions
Play/pause `[Space]`, seek, caption toggle, transcript in right panel · prev/next skip · Notes add/edit/delete · Bookmark current timestamp · Download resource (offline queue) · Share lesson link · Start linked quiz/assignment · Jump to discussion.

### Filters / Search / Sort / Pagination
None inside lesson; tree filters by state (`All / In progress / Locked`) in `LessonList` header. Resources tab sorts `type,size`.

### Permissions
Read: enrolled active students. `runTests`/gates: teacher/principal/parent read-only preview. Locked lessons fail server-side on direct URL (redirect to nearest previous `in_progress`).

### Empty State
No resources + no notes + no discussion = right panel shows `EmptyState` icons per tab ("No notes yet — start your first"). Zero-question lesson hides the quest row.

### Loading State
`DataState` wrapper: stage skeleton + `Skeleton` tree rows (left pane) until lesson payload + `LessonProgress` resolve; KPI progress bar animates width on mount.

### Error State
Ambitious: video errors handled per-row above; page-level fatal → `DataState` error card with **Reload**; autosave conflict on notes → inline `SyncConflictBadge` reuse.

### Success State
"Lesson completed 🎉"-equivalent: emerald banner `CheckCircle` in rounded `bg-emerald-100` circle, "Redirecting…" pattern not needed here — inline "Nice work — lesson complete" + auto-enable next. Toast on bookmark/note saved: `toast("Note saved")`.

### Mobile Behavior
Single column. Module tree behind **top-left drawer** (`Sheet`, `left`, overlay `bg-black/10 backdrop-blur-xs`); right panel becomes bottom `Sheet`. Controls row wraps; `[Space]` still works on tablets+keyboard.

### Accessibility
Video player keyboard complete (seek `←/→`, volume `↑/↓`, fullscreen `F`), captions on by default; `role="status"` live region announces `Mark complete`/saved; focus-trapped sheets; contrast for tinted pill text ≥ 4.5:1; reduced-motion disables tree slide.

### Related Screens
STU-04 (programme shell/breadcrumb target) · STU-05 (entry) · STU-07 (states, this entry) · STU-08/09 · STU-10/12 · STU-18.

---

## STU-04 Programme detail  (ID: STU-04)

### Purpose
Full marketing + curriculum surface for one programme: decide to enrol or resume. Shows hero, modules/lessons tree with lock states, reviews, instructor card, related programmes.

### User
Any student visitor (enrolled or not). Enrolment actions gated to student role.

### Route
`/tuition/programmes/[id]`.

### Navigation
Rail: no nav highlighted (content page); breadcrumb `Explore › Programmes › [title]`. CTA in hero; module tree in-page.

### Layout
Hero banner (`ProgrammeCover` aspect-video w/ gradient fallback) → title block + meta chips → CTA row → info grid (`ModuleList card` + `instructor card` side-by-side `lg:grid-cols-[1fr_320px]`) → reviews card → related `ProgrammeCard` grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`).

```
┌──────────────────────────────────────────────────────────────────┐
│ Explore › Programmes › Algebra & Functions                        │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │  COVER  ▓▓▓ gradient ▓▓▓            [Bookmark] [Share]       │  │
│ │  Mathematics · Algebra & Functions                            │  │
│ │  ★ 4.8 (132)  ·  Mr. Kilonzo  ·  Form 2  ·  intermediate     │  │
│ │  24 lessons · 6h 20m · 2 quizzes · 1 final assessment         │  │
│ │  [ENROL / RESUME ▸]      [Preview first lesson (ghost)]       │  │
│ └──────────────────────────────────────────────────────────────┘  │
│ ⚠ Only 14 seats left this term · 22/36 enrolled                  │
│ ┌───────────────────────────┐ ┌──────────────────────────────┐   │
│ │ MODULES (4)               │ │ INSTRUCTOR                   │   │
│ │ ▾ 1 Real numbers   ready  │ │ [avatar] Mr. Samuel Kilonzo   │   │
│ │    1 2 3 4 ✓✓∘∘          │ │ Teacher · Hillcrest · ★4.9    │   │
│ │ ▾ 2 Linear eq.            │ │ (132 ratings)  [Message ▸]    │   │
│ │ ▾ 3 Simultaneous          │ │ Rewiews: last 3              │   │
│ │ ▾ 4 The exam              │ │ “Clear and step-by-step” W   │   │
│ │                           │ │ STATUS: published            │   │
│ ├───────────────────────────┤ └──────────────────────────────┘   │
│ │ Cover: substitution, elimin│ WHAT YOU'LL LEARN (chips)         │
│ │ method, word problems      │ Solve simultaneous equations…     │
│ └───────────────────────────┘ [Enrol to unlock all lessons]      │
└──────────────────────────────────────────────────────────────────┘
```

### Components
`ProgrammeCard`/`ProgrammeCover` · `LessonList` (read-only, lock icons) · `Badge` status chips (difficulty `StatusPill`, publication scope) · `Avatar`/`AvatarGroup` (enrollees) · `progress` `ProgressBar` (if enrolled) · `MarkdownText` (description) · rating stars (lucide `Star`) · `Button tuition|outline|ghost|secondary`.

### Content & data
Programme row (`title, summary, description, grade, difficulty, duration_min, lessons_count, rating, rating_count, enrolled_count, publication scope (school|classes|students)`) + modules with lesson lists + `lesson_state` per student when enrolled; instructor `staff` display name/avatar/rating; reviews (student name, stars, date, text); related programmes (same grade/subject, publication-scope visible). Capacity hint like "14 seats left" only when `Programme opts into seat limits`.

### Primary CTA
**Enrol** (`variant="tuition"`) → creates `ProgrammeEnrolment` `status='active'` then routes to player first available lesson. If enrolled: **Resume ▸** → `…/learn/[pid]/latest-in-progress`.

### Secondary Actions
Preview first lesson (ghost) · Bookmark · Share · Message instructor (outline) · View all ratings.

### Filters / Search / Sort / Pagination
Module list searchable in-page; reviews paginated (10/page server-side); related = sort by rating.

### Permissions
Any authenticated. Enrol requires student identity; `tuition_programme:read` for all, `tuition_programme:enrol` for students. Published-only programmes visible (scope check per school/class).

### Empty State
Not found/deleted programme → `EmptyState` ("This programme is no longer available") + Explore CTA. Programme with zero modules → "Teacher is still building this — check again soon" + Notify me.

### Loading State
Hero `ProgrammeCover` skeleton + `Skeleton` module rows (accordion shape) until payload.

### Error State
Failures → `DataState` error card with **Retry**. Enrol failure (capacity/scope) → `outline`-colored banner + reason; stays on page, no false success.

### Success State
Enrol → `toast("Enrolled — let's go")` + hero CTA swaps to Resume + module tree unlocks per gates. Share/bookmark toasts.

### Mobile Behavior
Stacks: hero → meta → CTA → modules → instructor → reviews → related. CTA row sticky at bottom (safe-area inset) so Enrol always reachable.

### Accessibility
Module tree as accordion (`aria-controls`/`expand` states); rating list `dl`; cover has `alt` text; focus remains visible; reduced-motion still for cover shimmer.

### Related Screens
STU-02/03 (entry), STU-06 (Resume), STU-05 (My Learning), STU-08/10 (linked assignments/assessments), STU-18.

---

## STU-02 Explore home  (ID: STU-02)

### Purpose
Dead-simple discovery: featured recommended, category rail, trending, new this term — with one visible search field. Zero friction to reach any programme.

### User
Student (read-only discovery; enrol happens on programme detail).

### Route
`/tuition/explore`.

### Navigation
Rail: Explore active. Top header search input (canonical class) presses into `/tuition/explore?q=`. Category chips deep-link to STU-03.

### Layout
Search hero strip → horizontal category rail (chips) → Featured band (horizontal scroll, `ProgrammeCard`) → Recommended grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`) → Trending & New this term bands.

```
┌──────────────────────────────────────────────────────────────────┐
│ Explore › [🔍 Search programmes, subjects, teachers… ───────]    │
│  (all)  Mathematics  English  Kiswahili  Biology  Chemistry      │
│  Physics  Computer Science  Agriculture  Business  P.E.          │
│ ┌─ FEATURED ───────────────────────────────────────────────────┐ │
│ │ [Physics · Waves ★4.9 183] [Maths · Calculus P2 ...]         │ │
│ │   FEATURED            Featured by Hillcrest  → scroll band    │ │
│ ├─ RECOMMENDED FOR FORM 2 WEST ────────────────────────────────┤ │
│ │  ▓ Algebra & Functions  · · ·  ▓ Cell Biology  · · ·          │ │
│ │  [ENROL]   ·  [ENROL]   ·  [ENROL]   (cards with covers)      │ │
│ ├─ TRENDING THIS WEEK ─────────────────────────────────────────┤ │
│ │  ▓ Kiswahili Sarufi  · · ·  ▓ Soil Science                   │ │
│ └─ NEW THIS TERM ──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Components
`ProgrammeCard` (meta: teacher, rating, students count, duration, level chips, progress) · category `Button` chips (`secondary` inactive / `tuition-accent` active tint) · `EmptyState` · `Skeleton` band placeholders · horizontal scroll with fade masks · `ProgrammeCover`.

### Content & data
`featured` (curated per school via `published` scope) · `recommended` (same-subject/grade, not enrolled) · `trending` (recent enrolment velocity for school+network aggregate) · `new` (recently published). Cards carry rating/students/duration so the list reads without opening.

### Primary CTA
Search submit → STU-03. Card body → STU-04.

### Secondary Actions
Category chip filter · Enrol directly from card (creates `active` enrolment + toast) · Swap grade scope (school select skip; grade chip in header).

### Filters / Search / Sort / Pagination
Search text + grade (Form 1–4 / CBC 5-6,9) + category chips; sort = Relevance/Newest/Rating, pagination = infinite scroll (server cursor); "No results" state reuses `EmptyState`.

### Permissions
Read-only, all authenticated students/parents. Enrol direct-from-card gated to students + scope matches student class.

### Empty State
No content at all → `EmptyState` "Explore is quiet right now" + Notify me. Filtered no-match → contextual message (`query ? "No programmes match." : …`).

### Loading State
Band skeletons (`Skeleton` `aspect-video` covers) with shimmer; content streams in per band so featured paints first.

### Error State
Banner + Retry per band; one failed band doesn't kill page.

### Success State
Enrol from card → `toast("Enrolled")`, card swaps to Resume tag. Non-modal.

### Mobile Behavior
Category chips horizontal-scroll (swipe); cards become 1-col; featured band swipe-snapping.

### Accessibility
Chips as `role="tablist"`? No — real `<a>` chips, `aria-label` on cards, horizontal scroll focusable with `tabular-nums` rating. Search input labeled.

### Related Screens
STU-03 (results from chips/search) · STU-04 · STU-01 (recommended band).

---

## STU-03 Explore filtered browse + search results  (ID: STU-03)

### Purpose
Deep-dive discovery: combination filtering + search over the same programme space, with query-preserving URL state.

### Route
`/tuition/explore?grade=&subject=&q=&sort=&difficulty=`. Shares `/tuition/explore` route; server renders results for the query.

### Navigation
Rail: Explore active; header shows `SearchOverlay` trigger `⌘K`; breadcrumb `Explore › Results`. Filter changes rewrite the query string (full-page server nav, no client router friction).

### Layout
Sticky filter bar (search input + select popovers + applied-filter chips + sort + result count) → result grid (`sm:grid-cols-2 lg:grid-cols-3`) with `ProgrammeCard`s → status strip + pagination.

```
┌──────────────────────────────────────────────────────────────────┐
│ Explore › Results for "Kiswahili"  (2 programmes)                │
│ [🔍 kiswahili ────────────]  Grade [Form 2 ▾]  Difficulty [••• ▾]│
│ Subject [Kiswahili ▾]  Sort [Rating ▾]    [Clear all]           │
│ ✕ grade:Form 2   ✕ subject:Kiswahili                            │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ Kiswahili · Sarufi          │ Kiswahili · Fasihi Simulizi   │ │
│ │ ★4.8 132 · 24 lessons       │ ★4.6 61 · 12 lessons          │ │
│ │ intermed · Form 2 · 6h 20m  │ intermed · Form 2 · 3h 10m    │ │
│ │ 16/24 done (67%)            │ 0%  [Enrol]                   │ │
│ │  [Continue ▸]               │                               │ │
│ └──────────────────────────────────────────────────────────────┘ │
│ Showing 1–12 of 34  ← 1 2 3 →        Server-paginated           │
└──────────────────────────────────────────────────────────────────┘
```

### Components
`ProgrammeCard` · `Skeleton` · `EmptyState` · `DataState` · canonical search input · `DropdownMenu` selects · applied-filter chips (ghost `Badge` + ✕) · pagination `Button secondary` (or Infinite) · `SearchOverlay`.

### Content & data
Query applies: `q` (title/summary/subject), `grade`, `subject`, `difficulty`, `sort` (`rating|newest|popularity`), pagination. Subject options constrained to the school's tuition-enabled subjects. Enrol-attempt here is allowed but CTA prefers STU-04.

### Primary CTA
Opening a card → STU-04 (dominant); direct Enrol secondary on card.

### Secondary Actions
Clear all filters · Sort switch · pagination jump.

### Filters / Search / Sort / Pagination
All embedded above; debounced `q` (300ms) for the overlay live-mode; chips removable individually; URL is the source of truth (`useSearchParams` SSR).

### Permissions
Same as STU-02; enrol check when `Enrol` pressed.

### Empty State
Zero matches → `EmptyState` with the active query echoed ("No programmes match 'kiswahili' + Form 3") + [Clear filters].

### Loading State
`DataState` — replacing grid with `Skeleton` cards after each query change; keep filter bar interactive.

### Error State
Query failure → banner + Retry; filters preserved in URL so retry is deterministic.

### Success State
Toasts on enrol; "N results" count transitions (small `role="status"` announce).

### Mobile Behavior
Filter bar collapses to a horizontal chip row + one "Filters" sheet button; results 1-col; `Sheet` holds selects.

### Accessibility
Filter chips announced; result grid `aria-live="polite"`; pagination labeled; contrast of `text-muted-foreground` meta respected.

### Related Screens
STU-02 (upstream) · STU-04 · STU-01.

---

## STU-05 My Learning  (ID: STU-05)

### Purpose
The enrolled-programmes home: worth of "what I'm committed to" with one-line progress, next action per programme, and history.

### User
Student (own enrolments); parent view = read-only list of their linked students (child switcher).

### Route
`/tuition/my-learning`.

### Navigation
Rail: My Learning active. Per-card CTA → player or programme detail.

### Layout
Stats strip (`grid-cols-2 lg:grid-cols-4 gap-4`: Active / Completed / Weekly time / Avg score) → programme list grouped by status (`invited`, `active`, `completed`, `dropped`) as sectioned cards; each row = cover thumb, title+meta, ProgressBar, status pill, last-in-progress lesson, CTA.

```
┌──────────────────────────────────────────────────────────────────┐
│ My Learning                          Total: 5 programmes         │
│  ACTIVE        COMPLETED    MIN THIS WEEK    AVG SCORE           │
│  3 programmes   1           2h 41m           76%                │
│ ── ACTIVE ───────────────────────────────────────────────────────│
│ ┌─────────────────────────────────────────────┬────────┐         │
│ │ [thumb] Mathematics · Algebra & Functions  │ 67% ▓│ continue ▸│
│ │ Kilonzo · Form 2 · L6/24 Simultaneous      │      │         │
│ ├─────────────────────────────────────────────┼────────┤         │
│ │ [thumb] Kiswahili · Sarufi                 │ 82% ▓│ continue ▸│
│ ├─────────────────────────────────────────────┼────────┤         │
│ │ [thumb] Computer Science · Public Speaking │ 0% ▓ │ Join now ▸│
│ └─────────────────────────────────────────────┴────────┘         │
│ ── INVITED ──────────────────────────────────────────────────────│
│  Biology · Cell Biology — Ms. Kariuki invited you   [Accept][Decl]│
│ ── COMPLETED ────────────────────────────────────────────────────│
│  English · Composition Basics — 100% · certificate ready  View ▸ │
│ ── DROPPED ──────────────────────────────────────────────────────│
│  History · Kenya Constitutions — paused.  [Re-enrol]            │
└──────────────────────────────────────────────────────────────────┘
```

### Components
`ProgrammeCard` · `ProgressBar` (tone `tuition-progress`, red undershoot) · `StatusPill` enrolment statuses · `AvatarGroup` · sectioned-table-card pattern on active list · `Button tuition|outline|ghost|link`.

### Content & data
`ProgrammeEnrolment` for the student: status × programme meta × per-programme progress (%) × `last_lesson`. Weekly minutes × avg score from `LessonProgress` + assessment attempts rollups.

### Primary CTA
**Continue** on the first actionable active programme → `…/learn/[pid]/[lid]` (variant `tuition`). "Join now" for `invited`.

### Secondary Actions
View programme detail · Accept/Decline invitation · Re-enrol after `dropped` · Archive (pseudo-drop).

### Filters / Search / Sort / Pagination
Status tabs (`All / Active / Invited / Completed / Dropped`); sort by last activity. No pagination needed at these volumes but supports server cursor if >50.

### Permissions
Student own rows; parent child scoping read-only (Accept/Enrol disabled).

### Empty State
No enrolments → `EmptyState` "Nothing on your desk yet" + [Explore programmes] (glow). All completed → celebratory message + Certificates link.

### Loading State
Stats skeletons + per-row `Skeleton`; DataState wrapper keeps list placeholders.

### Error State
DataState banner + Retry; card-level failures isolate.

### Success State
Accept invitation → moves row to ACTIVE + `toast("Welcome to Biology · Cell Biology")`. Re-enrol toasts then CTA becomes Continue.

### Mobile Behavior
Rows stack (label/value pairs) with CTA bottom-right; status tabs → horizontal scroll.

### Accessibility
Groups as headings `h2`; statuses via `StatusPill`+`aria-label`; CTA text alternate not icon-only; reduced-motion list shuffle.

### Related Screens
STU-01 · STU-04 · STU-06 · STU-18 · STU-20.

---

## STU-08 Assignment list  (ID: STU-08)

### Purpose
Single, sorted view of all assignments for the student across programmes: scope by status & deadline, spot submission state instantly.

### User
Student; parent read-only.

### Route
`/tuition/assignments`.

### Navigation
Rail: Assessments tab group — no, Assignments lives under LEARN (its own rail item is not separate; reached from Home/Programme). Breadcrumb `Assignments`. Filter pills row.

### Layout
Filter tabs (`All / Open / Grading / Graded`) + sort → sectioned-table-card (`rounded-xl border bg-card overflow-hidden`, header `p-4 border-b bg-muted/30 h2 text-sm font-semibold`, `overflow-x-auto`, `table w-full text-sm`, `th p-4 text-left font-medium text-muted-foreground`, `tr border-b border-border/50 last:border-0 hover:bg-muted/30`).

```
┌──────────────────────────────────────────────────────────────────┐
│ Assignments                                    Newest first ▾    │
│ [All][Open][Grading][Closed]    [Search… ─────────]              │
│ ── OPEN · 3 ────────────────────────────────────────────────────│
│ SUBJECT/ASSIGN.         CLASS  DUE        SUBMISSION  ACTION     │
│ Business Studies        Form2W  Fri 14:00  none       [Start]    │
│   "Factors of Production"      (2 days)                           │
│ English · "The River    Form2W  Mon 09:00  draft      [Continue] │
│   Between — essay"      ...                                      │
│ ── GRADING · 1 ──────────────────────────────────────────────────│
│ Biology · "Plant        Form2W  —          submitted  submitted  │
│   Nutrition lab report"                   (pending)  StatusPill  │
│ ── CLOSED · 1 ───────────────────────────────────────────────────│
│ Mathematics · Percent   Form2W  —          graded     34/40 view ▸│
│   worksheet                                (emerald)             │
└──────────────────────────────────────────────────────────────────┘
```

### Components
Sectioned table card · `StatusPill` (assignment `draft|open|grading|closed`; submission `none|draft|submitted|late|graded`) · `Button secondary` row actions + `icon-sm` view · `EmptyState` · `Skeleton`.

### Content & data
Assignments created for classes/cohorts the student is in; each row: subject/programme, title, class, due datetime (chrono sorted), submission status pill, marks (max + earned when graded). `late` submissions tinted amber warning; overdue `open` rows `text-red-600` meta.

### Primary CTA
Row [Start|Continue] → `/tuition/assignments/[id]` (variant `tuition` on the actionable row).

### Secondary Actions
View graded result · Re-open draft · mark todos done.

### Filters / Search / Sort / Pagination
Tabs (status), text search on title/subject, sort `due | title | status`, server pagination.

### Permissions
Student own class assignments (via `class_id`/cohorts); parent read-only.

### Empty State
No assignments for filters → `EmptyState` "Nothing assigned right now" + pattern `query ? "No assignments match your search." : default`.

### Loading State
Table skeleton rows (6) with shimmer; count pills skeleton.

### Error State
Banner + Retry; row-level failure degrades to pill.

### Success State
Submission via this flow toasts + row pill flips to `submitted`/`late`.

### Mobile Behavior
**Table collapses to stacked rows**: label/value pairs (`Subject`, `Due`, `Submission`) below title; CTA full-width bottom; filter tabs scroll horizontally.

### Accessibility
Table with `caption` + `scope="col"`; status pills get `aria-label`; overdue text uses amber token not red-interpretation conflicts.

### Related Screens
STU-09 · STU-01 (due-soon alerts) · STU-06 (lesson-linked assignments).

---

## STU-09 Assignment detail / submission  (ID: STU-09)

### Purpose
Read the brief, see rubric/attachments, compose a submission (text and/or file), submit with confirmation; review your late/submitted/graded states and teacher feedback.

### User
Student.

### Route
`/tuition/assignments/[id]`.

### Navigation
Breadcrumb `Assignments › [title]`. Whole-page vertical layout; submit panel bottom.

### Layout
Header card (subject/programme, `StatusPill` assignment + submission, due countdown) → brief `MarkdownText` card → resources/attachments + rubric card (two-col `grid-cols-1 lg:grid-cols-2`) → submission panel card.

```
┌──────────────────────────────────────────────────────────────────┐
│ Assignments › "Factors of Production"                            │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ Business Studies · Form 2 West · Mr. Kamau · open · open     │ │
│ │ Due Fri 14:00 · 2 days left · marks 20                       │ │
│ │ "Define the four factors of production and give a Kenyan     │ │
│ │  example of each. 800 words max. Submit as text or doc."     │ │
│ ├─ RUBRIC ────────── ─┐ ┌─ FILES FROM TEACHER ────────────────┤ │
│ │ Definitions 5 marks │ │ ▤ assignment-brief.pdf               │ │
│ │ Examples    5 marks │ │ ▤ sample-essay.pdf                   │ │
│ │ Analysis    5 marks │ └──────────────────────────────────────┘ │
│ │ Presentation5 marks │                                          │
│ └─────────────────────┘ ┌─ YOUR SUBMISSION ──────────────────── │
│   [Rich-text draft        ] ⤓ file: essay.docx 1.2MB  [X]      │
│   or drop file here  [FILE DROPZONE dashed]                     │
│   Auto-saved 14:32 · last touch 2m ago ·  [Save draft] [Submit ┤]
│ ───────────────────────────────────────────────────────────────┘
│  GRADED MODE: feedback block + marks breakdown + download.       │
└──────────────────────────────────────────────────────────────────┘
```

### Components
`MarkdownText` (brief) · `FileDropzone` (`accept={'.pdf,.doc,.docx,.txt,.ppt,.xls,.zip'}`) · `StatusPill` (submission statuses) · `Button tuition|outline|secondary|link` · rubric table · countdown chip (live `AssessmentTimer`-style but assignment deadline) · `Toast`.

### Content & data
Assignment row (`title, brief, rubric_md, due_at, max_marks, status, allow_text, allow_files`), duration retrograde re: open window; submission row (`draft|submitted|late|graded`, body, file keys, marks, feedback_md, submitted_at`). Teacher feedback block appears when `graded`.

### Primary CTA
**Submit assignment** (variant `tuition`) → confirmation modal ("Submit now? You can't edit after submitting.") → on close reverts to read-only + `StatusPill submitted`. If past due → "Submit late" variant with amber warning copy.

### Secondary Actions
Save draft (auto + manual) · Remove/replace file · Download brief/attachments · View previous graded result (if re-open case).

### Filters / Search / Sort / Pagination
None beyond countdown; rubric sections collapsible.

### Permissions
Student own; `graded` submissions lock editing (files/text read-only, teacher feedback visible). Parent read-only.

### Empty State
Assignment withdrawn/closed-without-submission → `EmptyState` "This assignment is no longer open" + return link.

### Loading State
Cards skeleton; submission area deferred until brief loads.

### Error State
Submit network failure → inline `destructive` banner + "Resend" (do not toast-lie success). File too large → inline error under dropzone.

### Success State
Submit success → full-width emerald banner (`CheckCircle`): "Submitted. You'll be notified when graded." + list-link. Grade arrives → notification (bell) + amber `unread` chip.

### Mobile Behavior
Two-col grids stack; dropzone full-width; submit bar sticky at bottom during scroll with safe-area padding; file list expands inline.

### Accessibility
Form labels + `aria-describedby`; rubric as table with scoped headers; countdown `role="timer"`.

### Related Screens
STU-08 · STU-01 alerts · Teacher-side grading (TCH-13) · STU-18.

---

## STU-10 Assessment dashboard  (ID: STU-10)

### Purpose
One place to see every assessment the student is eligible for: upcoming (`scheduled`), open now (`open`), and done (`closed` / `published_results`), with attempt status per row so "take me to where I left off".

### User
Student.

### Route
`/tuition/assessments`.

### Navigation
Rail: Assessments active. Tabs split statuses; row CTA depends on attempt status.

### Layout
KPI strip (`Upcoming / Available / Finished / Avg score`) → tabbed list (`Upcoming / Available / Finished`) using sectioned-table-card rows: subject/programme, assessment name, window (open/close), duration/marks, attempt `StatusPill`, CTA.

```
┌──────────────────────────────────────────────────────────────────┐
│ Assessments              {24h flash: Maths Exit Quiz open now}   │
│  UPCOMING 3    OPEN 1    FINISHED 2      AVG 71%                │
│ [Upcoming][Available][Finished]                                  │
│ ── AVAILABLE ────────────────────────────────────────────────────│
│ Mathematics · Algebra   Exit Quiz · 40 marks · 45 min           │
│   close Sun 23:59 · attempt: not_started   [Start assessment ▸]  │
│ ── UPCOMING ────────────────────────────────────────────────────│
│ Biology · Cell          Quiz · 20 marks · 20 min                │
│   opens Mon 08:00 · attempt: not_started   [Calendar +]         │
│ Kiswahili · Sarufi      Term test · 60 (2 sections) · opens...   │
│ ── FINISHED ─────────────────────────────────────────────────────│
│ English · Composition   Qz · graded · 34/40 (85%)   [Review ▸]   │
│ Maths · Fractions       Qz · published_results · 26/40  [Review ▸]│
└──────────────────────────────────────────────────────────────────┘
```

### Components
Sectioned table card · `StatusPill` (assessment + attempt statuses) · countdown chip (AssessmentTimer-lite) · `Button tuition|secondary|link` · `EmptyState`/`Skeleton` · calendar-add ghost.

### Content & data
Assessments scoped to class/cohort/subject; columns = subject/programme, name, section count, marks, duration, window (`scheduled → open → closed`), attempt state (`not_started|in_progress|submitted|graded`). `in_progress` resumes the same attempt (server holds attempt id).

### Primary CTA
**Start assessment** → instructions page; `Continue` variant when attempt `in_progress`; `Review` when done.

### Secondary Actions
Add to calendar (`.ics`/deep) · review past results · view mark.

### Filters / Search / Sort / Pagination
Tabs by window; sort by open date; text filter on name; pagination cursor.

### Permissions
Student eligible via class/cohort membership; parent read-only (attempts visible, no start).

### Empty State
No assessments → `EmptyState` "No assessments scheduled yet this term" + My Learning link.

### Loading State
KPI skeleton + table skeleton; countdown placeholders `⚆`.

### Error State
Banner + Retry; per-row resilience.

### Success State
Finish flow returns here with green "published_results" pill + toast("Results published — well done"); start-of-attempt toast.

### Mobile Behavior
Table → stacked rows; flash banner collapses to a dismissible strip; Start CTA bottom-sticky.

### Accessibility
Countdowns `role="timer"`; statuses color+text (never color-only); modal-free row focus.

### Related Screens
STU-11/12/13 · STU-01 · STU-18 · teacher side TCH-14/16.

---

## STU-11 Assessment instructions + start confirmation  (ID: STU-11)

### Purpose
Set expectations before the timer starts: rules, sections, marks, time, and an explicit, honest start confirmation.

### User
Student (attempt `not_started` or a fresh resume banner when `in_progress`).

### Route
`/tuition/assessments/[id]/instructions`.

### Navigation
No rail gym: single-centered card + implicit `Back` to dashboard. Provides the only gate into STU-12.

### Layout
Centered `max-w-2xl` card: hero (title, subject, badges) → meta grid (duration, sections, marks, attempts allowed) → rules list → "Before you start" bullets (autosave, timer, palette, flagging, keyboard) → **Start** button + Start confirmation `Dialog` overlay.

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Assessments › Maths · Algebra & Functions · EXIT QUIZ          │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │  Mathematics · Algebra & Functions   EXIT QUIZ                │ │
│ │  Form 2 West · Ms. Kariuki          intermed · 40 marks       │ │
│ │  45 minutes · 2 sections (25 MCQ + 3 structured)             │ │
│ │ ── What to know ────────────────────                         │ │
│ │  • Timer starts on Start — auto-submits at 0:00.            │ │
│ │  • Answers autosave every few seconds (cloud).              │ │
│ │  • Palette top-right: navigate questions; ⚑ flags review.   │ │
│ │  • Keyboard: 1–9/0 jump, [F] flag, [PgUp/PgDn] prev/next.   │ │
│ │  • One attempt. No back-paging past submit.                 │ │
│ │  ─────────────────────────────────────────────────────────── │ │
│ │  ⚠ Do not refresh or close during the assessment             │ │
│ │  [◀ Back]                              [Start assessment ┤]  │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                          DIALOG                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Start Mathematics Exit Quiz?                             │   │
│  │ 45:00 on the clock · 28 questions · 40 marks · 1 attempt │   │
│  │ Examination conditions — you will not be able to return  │   │
│  │ to instructions once started.                            │   │
│  │              [Cancel]  [Yes, start the timer ▸]        │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Components
`StatusPill` · `AssessmentTimer`-derived chip (here static meta, live timer only in take) · `Button tuition|outline` · modal recipe (`fixed inset-0`, `bg-black/50`, panel `bg-card rounded-xl shadow-xl w-full max-w-md mx-4 ring-1 ring-foreground/10`) · rules list as `ul`.

### Content & data
Assessment meta (name, sections with counts, marks per section, duration_min, attempts_allowed, window, published_results flag), attempt state; if `in_progress` → banner "You have a saved attempt" + [Resume] primary (bypasses dialog).

### Primary CTA
**Start assessment (tuition)** → dialog → confirm creates attempt `in_progress` + routes `…/take`.

### Secondary Actions
Back · Resume (if in_progress) · print rules.

### Filters / Search / Sort / Pagination
None.

### Permissions
Open-window only (`scheduled` earlier → locked with "opens Mon 08:00"); `closed` → review only link; student identity required.

### Empty State
Stale/removed assessment → `EmptyState` + dashboard link.

### Loading State
Card skeleton; dimmed CTA disabled until payload (appears as `consent = false`).

### Error State
Failure to start attempt (network/RPC) → dialog swaps to inline `destructive` banner + Retry; timer not started on error.

### Success State
Confirmation modal closes → full-screen transition to take screen with `role="status"` "Timer started". Never toast here (exam isolation).

### Mobile Behavior
Card fills viewport width; rules readable; confirm button full-width ≥48px tall; system chrome minimizes (PWA fullscreen intent).

### Accessibility
Modal focus-trap, `aria-modal`, Escape = Cancel; rules list semantic; start button dual-labeled (`aria-describedby`).

### Related Screens
STU-10 → STU-11 → STU-12 → STU-13.

---

## STU-12 Assessment-taking interface  (ID: STU-12)

### Purpose
Exam-width focus: answer questions under a live timer with a numbered palette, flagging, autosave, keyboard nav, and safe, confirmed submit (plus auto-submit at 0:00).

### User
Student with an `in_progress` attempt — either from start (STU-11) or resume.

### Route
`/tuition/assessments/[id]/take`.

### Navigation
**ALL navigation hidden** (exam isolation, IA §7): no rail, no tabs, no header brand; only timer + palette + question + progress + submit. `Back` intentionally disabled (`beforeunload` guard + on-screen message).

### Layout
Full-viewport, split: LEFT (`max-w-3xl`) question pane + footer nav (Prev / palette-focus toggle / Next); RIGHT (`w-96`) sticky `QuestionPalette` (numbered grid, flag ⚑ overlays, answered fill, `current` ring) + legend + timer card + Submit.

```
┌──────────────────────────────────────────────────────────────────┐
│  Math · Exit Quiz        ⏱ 34:12   ·   Q8/28   ·  [⚑ 3]  [submit]│
│ ┌──────────────────────┬───────────────────────────────────────┐ │
│ │ SECTION 1 · MCQ · 3 │ PALETTE                                │ │
│ │ 8. Solve: x + y=9   │ 1  2  3  4  5  6  7  8  9  10          │ │
│ │    2x − y = 3        │ ⛭ ⛭ ● ● ● ○  ⑦ ○  ○  ○              │ │
│ │  [○] (a) x=4, y=5   │ 11 12 13 14 15 16 17 18 19 20          │ │
│ │  [○] (b) x=3, y=6   │ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○                  │ │
│ │  [●] (c) x=4, y=4   │ (● answered · ○ blank · ⑦ current ·   │ │
│ │  [○] (d) x=5, y=3   │  ⛭ flagged)  2 of 3 answered          │ │
│ │ ___                   │ ────────────────────────────────────  │ │
│ │ SAVED 14:02 · 24s ago│ TIMER · remaining 34:12               │ │
│ │ ⌨ [F] flag · 1-9 nav │ ⛭ 3 flagged                          │ │
│ │ [← Prev Q] [Next Q →]│ [⚑ Flag] (active)                    │ │
│ │                      │         [Submit assessment ▸]          │ │
│ └──────────────────────┴───────────────────────────────────────┘ │
│  MOBILE: palette = bottom Sheet (swipe-up); timer sticky top.    │
└──────────────────────────────────────────────────────────────────┘

Status line: SAVED (emerald) → "SAVING…" (muted) → "Offline — queued"
while offline; auto-submit countdown 10s before 0:00 with role=status.
```

### Components
`AssessmentTimer` (hh:mm:ss, warning <5min amber, critical <1min red + pulse; auto-submit at 0) · `QuestionPalette` (numbered grid with flag markers, answered state, current ring, arrow-key navigable + focus-trap) · `QuestionRenderer` (MCQ, multi-select, T/F, short answer, structured, essay, practical modes; validation per type) · `MarkdownText` for stems · `Toast` for saves (3s autosave toast suppressed when quiet to avoid noise) · submit `Dialog` + `beforeunload` guard.

### Content & data
Attempt object (id, section order, per-question answers, flags, saved_at) synced via browser supabase client / custom `/api/` route; autosave debounce ~4s + on-blur + on-flag; offline → IndexedDB queue (`src/lib/sync.ts` pattern) with "Offline — queued" line; resume restores from server on mount.

### Primary CTA
**Submit assessment** (tuition, pinned right panel) → `Dialog` confirm: summary (answered x/28, flagged 3, blank count) + "Submit now?" + warning "auto-submit at 0:00" → confirm → attempt `submitted` → `…/result`.

### Secondary Actions
Prev/Next question · palette jump · flag/unflag · clear answer per question (question pane footer ghost) · keyboard: `1–9,0` jump · `[F]` flag · `[←]/[→]` prev/next · `[N]` next · `[S]` submit prompt.

### Filters / Search / Sort / Pagination
Palette **is** the question navigator; sections split palette into numbered groups with section letter.

### Permissions
Only owner of the open attempt; attempts `submitted`/`graded` → server redirect to result. Window check at mount (locked if `closed` before submit).

### Empty State
Invalid/withdrawn attempt id → `EmptyState` "This attempt is no longer active" → dashboard. (No empty for a valid attempt.)

### Loading State
Deferred: question pane skeleton + palette grid placeholder; payload minimal; timer doesn't start until attempt resolves (clock builds from server `started_at`).

### Error State
Save failure → status line swaps to red "Save failed — retrying" with auto-retry backing off; fatal page error → isolation banner "Don't navigate — reconnecting…" and keeps local state in memory (IndexedDB).

### Success State
Submit success → full-screen transition "Submitted" + auto-redirect to result page; toast reserved for completion metrics ("Your answers were synced").

### Mobile Behavior
Focused mode: sticky timer + question; palette in bottom `Sheet` (swipe-up, grid adapts 5/6 cols); keyboard note hidden (touch flag button); submit reachable pinned bottom-right; viewport lock (no overscroll).

### Accessibility
Timer `role="timer"` + live region announcements at thresholds; palette `aria-label` per cell (`Question 8, answered, flagged`); current question `aria-current`; focus moved into question on jump; reduced-motion: no pulse on critical timer.

### Related Screens
STU-10 (entry), STU-11 → take, STU-13 (exit).

---

## STU-13 Assessment result / review / topic analysis  (ID: STU-13)

### Purpose
Post-exam due diligence: score dial, pass/fail framing, question-by-question review vs correct answers, and per-topic strength/weakness bars that feed STU-18.

### User
Student; parent read-only.

### Route
`/tuition/assessments/[id]/result`.

### Navigation
Rail returns. Breadcrumb `Assessments › [name] › Result`. Tabs: Overview / Review answers / Topics.

### Layout
Top band (`grid-cols-1 lg:grid-cols-3`): `ScoreDial` + mark band + stats card (time used, correct/incorrect/skipped, flags). Below: `Tabs` — Review (list of questions, correct/incorrect chips, reveal answer + explanation) | Topic analysis (Recharts horizontal bars per topic with `hsl(var(--border))` strokes etc.).

```
┌──────────────────────────────────────────────────────────────────┐
│ Assessments › Algebra & Functions › Exit Quiz · Result           │
│ ┌────────────┬───────────────────┬──────────────────────────────┐│
│ │ [ScoreDial] │ Marks 32/40 (80%) │ Time 34m/45m                ││
│ │  ● 80%      │ PASSED · top 15%  │ 26 correct · 2 wrong        ││
│ │ (green)     │ published_results │ 1 flagged                   ││
│ └────────────┴───────────────────┴──────────────────────────────┘│
│ [Overview][Review answers][Topic analysis]                       │
│ ── REVIEW (Q8 of 28) ─────────────────────────────────────────── │
│ 8. Solve x+y=9, 2x−y=3      YOURS: ✓ c) x=4, y=4                │
│    ✓ correct · +2 marks     feedback: eliminated x: add eqs      │
│ ── TOPICS ────────────────────────────────────────────────────── │
│  Linear equations         ▓▓▓▓▓▓▓▓▓▓ 92%  strong (green)        │
│  Simultaneous equations   ▓▓▓▓▓▓░░░░ 55%  practice (amber)      │
│  Word problems           ▓▓▓▓░░░░░░ 40%  weak (red)  [Revise ▸] │
└──────────────────────────────────────────────────────────────────┘
```

### Components
`ScoreDial` (radial %, tone green/amber/red) · KPI stat blocks · `Tabs` (line variant) · answer review rows (correct/incorrect `Badge`s, `MarkdownText` explanation) · Recharts `ResponsiveContainer` + `BarChart` (`stroke hsl(var(--border))`, tick fill `hsl(var(--muted-foreground))`, tooltip `backgroundColor: hsl(var(--card))`) · `Button tuition|outline|link` · `EmptyState`.

### Content & data
Attempt result (score, max, percent, correct/incorrect/skipped counts, time_started/finished, per-question answer + correctness + explanation, per-topic aggregate) and, when assessment is `published_results`, teacher/system final marking + grade. Topic weakness feeds STU-18/STU-01 weak-topics.

### Primary CTA
**Review answers** (default landing tab when all individual marks not yet graded → wait for `graded` message instead; CTA here = "Revise weak topic ▸" on TOpic tab → links to programme lesson).

### Secondary Actions
Download result PDF · Retake (if `attempts_allowed > 1`) · Share score (social/family) · See class mean (only when assessment publishes aggregates — school/network rules apply; student sees own + school aggregate, never peers' identities).

### Filters / Search / Sort / Pagination
Question review paged (or virtualized); topic bars sort by weakness.

### Permissions
Owner; parent read-only; mean visible only per network privacy rules (`_context.md` §7).

### Empty State
Awaiting grading (attempt `submitted`, assessment not `published_results`) → `EmptyState` "Your paper is with the teacher — results arrive soon" + Notify-on-grade toggle.

### Loading State
ScoreDial skeleton ring; review rows skeleton; count-up animates when mounted (respect reduced-motion).

### Error State
DataState banner + Retry; download failure → inline.

### Success State
Pub-result moment: full-width emerald "Results published — 80%" + toast. Confetti only on top-10% (and even that disabled under reduced-motion).

### Mobile Behavior
Sections stack; ScoreDial keeps radial at top; topic bars swipe horizontally if wide; download sheet.

### Accessibility
Score communicated textually too (`aria-label="80 percent, passed"`); chart has table fallback for screen readers; color never sole differentiator.

### Related Screens
STU-10 (return), STU-18 (weak topics), STU-20 (certificate if qualifying).

---

## STU-14 Live classes dashboard  (ID: STU-14)

### Purpose
Find live/replay classes by subject and status: what's happening now (`live`), what's next (`scheduled`), and what you can re-watch (recordings).

### User
Student (form-level scope).

### Route
`/tuition/classes`.

### Navigation
Rail: Classes active. Tabs: Live now / Upcoming / Recordings.

### Layout
Alerts strip (max 1: live-now banner) → tabbed sectioned lists/table: subject/class, teacher, schedule (date/time), status pill, provider icon hint, length (recordings), CTA.

```
┌──────────────────────────────────────────────────────────────────┐
│ Live Classes                                     Hillcrest       │
│ ┌─ LIVE NOW ───────────────────────────────────────────────────┐ │
│ │ ● Form 2 Maths Revision  Mr. Otieno   live · 187 watching    │ │
│ │   started 09:00 · ending 10:30                 [Join room ▸] │ │
│ └──────────────────────────────────────────────────────────────┘ │
│ [Live][Upcoming][Recordings]                                     │
│ ── UPCOMING ─────────────────────────────────────────────────────│
│ Biology Q&A · Cell Biology   Ms. Kariuki  Sat 09:00 · 60 min    │
│   [Remind me] [Add to calendar]      StatusPill: scheduled      │
│ Kiswahili Sarufi Clinic      Mr. Kimani  Wed 16:30 · 45 min     │
│ ── RECORDINGS ───────────────────────────────────────────────────│
│ ▶ Kiswahili Sarufi Clinic    Mr. Kimani · 45:12 · 340 views     │
│   recorded 2 Sep · watch again      [Watch replay ▸]            │
└──────────────────────────────────────────────────────────────────┘
```

### Components
Sectioned cards · `StatusPill` (from `tuition_live` session status: `scheduled|live|ended` — new, mirrors activity vocabulary) · countdown chips · `Button tuition|outline|secondary|link` · bell-reminder ghost · `RatingStar`-free replay meta · `EmptyState`/`Skeleton`.

### Content & data
LiveSession rows scoped to class/cohort: title, subject, instructor, `scheduled_at`, `ends_at`, meeting provider id + url (seed; see STU-15), recording url (object storage key), participant count (aggregate), status computable from clock. Reminders persist per student (notifications table).

### Primary CTA
**Join room** (`tuition`, only when `status='live'` or within 15 min pre-roll) → `/tuition/classes/[id]` (waiting room). Watch replay → player.

### Secondary Actions
Remind me (bell) · Add to calendar · Watch replay · Share session link · view past Q&A archive.

### Filters / Search / Sort / Pagination
Tabs; sort by `scheduled_at`; text search across title/subject; pagination cursor.

### Permissions
Class/cohort scoped read; join requires student link; recordings gated same scope (`published` gate).

### Empty State
No classes scheduled (term gap) → `EmptyState` "No live classes on the calendar" + calendar-add. Empty tab variant message.

### Loading State
List skeletons; live-now banner skeleton (height reserved to avoid jump).

### Error State
Banner + Retry; provider join failure surfaces in STU-15.

### Success State
Join flows to waiting room; remind toggle → `toast("We'll remind you")` with pill flip.

### Mobile Behavior
Tabs horizontal scroll; rows stack; Join/Remind full-width; recordings show thumbnail.

### Accessibility
Status pills dual-encoded (dot + text); "live" uses `role="status"` announce on tab visit; replay buttons labeled.

### Related Screens
STU-15 (join) · STU-01 · TCH-19 (teacher side).

---

## STU-15 Live classroom  (ID: STU-15)

### Purpose
The actual session: waiting room ⇒ room with provider-driven video + Decimal-side chat, moderated Q&A, polls, participation, whiteboard toggle, recording. **Provider-replaceable**: the video grid is a thin wrapper around an interchangeable embed (`LiveProvider` interface: Jitsi / Whereby / Zoom WebSDK / Google Meet iframe / any provider whose URL we inject). Decimal owns the sidebar UX so a provider swap changes only one adapter.

### User
Student (and teacher host view mirrors with host controls — spec'd here from the student seat).

### Route
`/tuition/classes/[id]`.

### Navigation
From STU-14; inside room global nav hidden (immersive, player-like). Leave → confirm dialog → STU-14.

### Layout — waiting room (pre-roll):
Centered card: session title, teacher avatar, "starts in 07:12" countdown, joined-members avatar group, [Mic]/[Cam] toggles, [Enter room ▸] (enabled at T-0), provider warm-up note.

### Layout — room:
Top video stage (provider component full-width, aspect-video; teacher pinned, grid of participants), right `w-96` column with `Tabs`: Chat · Q&A · Polls.

```
┌──────────────────────────────────────────────────────────────────┐
│ ● LIVE  Form 2 Maths Revision · Mr. Otieno    ⏱ 48:12 · 187     │
│ ┌─────────────────────────────┬────────────────────────────────┐ │
│ │  VIDEO STAGE  [PROVIDER]    │ [💬 Chat][❓Q&A][📊 Polls]    │ │
│ │  ┌──────────┐ ┌──────────┐  │ Sam: how do I eliminate...?  │ │
│ │  │Teacher   │ │ Wanjiku   │  │ Kim: add the two equations   │ │
│ │  │(pinned)  │ │ (you,mic) │  │ [raise hand ✋] (Q&A queue)   │ │
│ │  └──────────┘ └──────────┘  │  Ms. Kariuki: good question   │ │
│ │  ┌──────────┐ ┌──────────┐  │ ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ │ │
│ │  │Mwikali   │ │(gallery) │  │ [type message ───────] [send] │ │
│ │  └──────────┘ └──────────┘  │ ── POLLS TAB ───────────────  │ │
│ │  [🎥 ◉] [🎤 ◉] [🙋] [WB] [ℹ]│  Poll: Which method to use?  │ │
│ │                             │  (●) Substitution ( ) Eliminat│ │
│ │                             │  ( ) Graphical · 142 answered │ │
│ │        RECORDING indicator  │  ──────────────────────────    │ │
│ │   ⏺ Recording · captions on │  [Participants ▸] · [Leave ⤬] │ │
│ └─────────────────────────────┴────────────────────────────────┘ │
│ MOBILE: stage top, side panel as bottom Sheet (max-h 45vh).      │
└──────────────────────────────────────────────────────────────────┘
```

### Components
`LiveProvider` (swap-ready adapter: loads provider script/iframe, exposes `join/leave/mute/cam/raiseHand/whiteboard/recording` with Decimal chrome outside) · waiting-room card w/countdown (`AssessmentTimer` reused as class countdown) · `AvatarGroup` participants · `Tabs` Chat/Q&A/Polls · chat composer (canonical input) · Q&A queue (raise hand) · poll `QuestionRenderer`-lite (live results radio bars) · recording pill (`⏺`) · `Dialog` leave-confirm · `EmptyState` for no-participants.

### Content & data
Session row (+ provider config, recording key, participants aggregate, caps), chat messages, Q&A items (upvotes, answered flag), poll rows (question, options, live tallies), moderator-controlled states (mute-all, lock chat). All via realtime supabase channel; provider state isolated to adapter.

### Primary CTA
**Enter room** (waiting room gate, tuition, enabled at start or when session `live`). In room = primary controls (mic/cam/hand).

### Secondary Actions
Leave (confirm) · toggle chat/Q&A/polls tabs · participate in poll · upvote Q&A · toggle captions · fullscreen/video layout grid · report issue (moderator flag).

### Filters / Search / Sort / Pagination
Chat scroll-back (virtualized, cursor); Q&A sorted hot/answered; none else.

### Permissions
Scoped enrol/class membership; host-only actions (mute, pin, present) render only for the session host role; recordings post-room gated same scope.

### Empty State
Waiting room when zero attendees → "You're the first one here — share the invite link". Polls tab with no live poll → `EmptyState` "No active poll".

### Loading State
Waiting room: provider warm-up skeleton (spinner caption "Connecting to room…"); room: stage skeleton until provider `ready` event; chat streams as loaded with `role="status"`-free perf (brand loud only for errors).

### Error State
Provider join failure → inline `destructive` banner "Couldn't join video — reconnecting" + retry; persistent failure after 3 attempts → "Try reloading the room" + Back; recording failure → amber banner (session still proceeds) — provider swap retrofits transparently.

### Success State
Join success → toast("You're in the room"); poll submit → live bar shows your vote; Q&A answer marks you replied (teacher side drives).

### Mobile Behavior
Video stage full-width top; side column becomes bottom `Sheet` (`max-h-45vh`) with 3 tabs; participants grid auto-rhythm; leave icon ≥40px; orientation can force stage fullscreen.

### Accessibility
Video/captions on by default; chat focus-ring surfaces; Q&A queue `aria-live`; mute state announced; poll radio groups labelled; `prefers-reduced-motion` pauses hand-raise pulse.

### Related Screens
STU-14 (entry) · STU-01 · TCH-19/teacher room mirror.

---

## STU-16 Activities discovery  (ID: STU-16)

### Purpose
Beyond academics: browse co-curricular and competitive activities — leagues, clubs, festivals — by status, and jump into detail/registration.

### Route
`/tuition/activities`.

### Navigation
Rail: Activities active. Category chips: Sports, Clubs, Academic, Festivals · Status filter tabs.

### Layout
Category rail → KPI strip (My activities / Open registrations / Upcoming events) → activity `card grid` (`ProgrammeCard`-styled but activity fields: cover, type badge, status, venue, date, teams/players count): sports show league standings teaser; clubs show meeting cadence; academic show deadline.

```
┌──────────────────────────────────────────────────────────────────┐
│ Activities                                                       │
│  Sports  Clubs  Academic  Festivals                              │
│  MY ACTIVITIES 1 · OPEN REGISTRATION 3 · UPCOMING EVENTS 2      │
│ ┌─ DECIMAL SCHOOLS FOOTBALL LEAGUE ──── StatusPill: `registrations`│
│ │ [⚽ cover] · type Badge: Sports · grade Form 1–4               │
│ │ 8 schools · 3rd round · venue: Kasarani Stadium (final)       │
│ │ next match: Hillcrest vs St. Mary's (Sat 10:00)               │
│ │  [View league ▸] [Register my team ▸]                         │
│ ├─ Chess Club · weekly Thu 16:00 · Room B2 · open spots          │
│ ├─ Science & Innovation Fair · deadline 30 Sep · submit project  │
│ └─ Music & Drama Festival · auditions 12 Oct · Hillcrest Hall    │
└──────────────────────────────────────────────────────────────────┘
```

### Components
Category chips · `ProgrammeCard` extended-as-`ActivityCard` · `StatusPill` (activity `draft|registrations|in_progress|results|completed|cancelled`) · `Badge` type chip (Sports/Club/Academic/Festival) · `AvatarGroup` participants · `Button tuition|outline|link` · `EmptyState`/`Skeleton`.

### Content & data
Activity rows (title, type, description, status, venue, start/end, capacity, registrations, teams/participants, thumbnail). Registration state per student (`registered|not|waitlist`).

### Primary CTA
**View league/activity ▸** → `/tuition/activities/[id]`.

### Secondary Actions
Register (direct, if flow trivial) · venue map link · share.

### Filters / Search / Sort / Pagination
Categories + status tabs + text search + sort (date/popularity); pagination cursor.

### Permissions
Read all published school-scope activities; registration student-gated; teacher-organized (TCH-20) rows show as such.

### Empty State
No activities this term → `EmptyState` "The extra-curricular calendar is empty" + propose "Suggest an activity" (toast to office).

### Loading State
Grid skeletons; status pill skeletons.

### Error State
Banner + Retry; per-card resilience.

### Success State
Registration `toast("You're registered — check fixtures")`; card flips to "Registered".

### Mobile Behavior
1-col grid; chips swipe; register full-width bottom.

### Accessibility
Type + status dual-encoded; league cards have `aria-label`; venue link descriptive text.

### Related Screens
STU-17 (detail) · STU-01 · TCH-20/SCH-10 (organizer).

---

## STU-17 Activity detail + registration + fixtures/results  (ID: STU-17)

### Purpose
Deep-dive for one activity. For **DECIMAL SCHOOLS FOOTBALL LEAGUE** this is the full fan/player surface: teams, fixtures, standings table, venues, upcoming matches, top performers, and registration for players & teams.

### User
Student (player or spectator). Registration as individual or with school team.

### Route
`/tuition/activities/[id]`.

### Navigation
Breadcrumb `Activities › Football League`. In-page tabs: Overview / Fixtures / Standings / Performers · Team `Badge`s link to school profile (`/tuition/profile/[type]/[id]`).

### Layout
Hero (cover, league shield/initials, type+status pills, season) → registration/CTA bar pinned under hero → `Tabs`: Overview (blurb, format, venues, rules) | Fixtures (sectioned-table of rounds, venue chips, home/away, score or "kick-off") | Standings (full sectioned-table: Pos, Team, P W D L GF GA GD Pts) | Performers (top scorers/assists top-5 table). Teams strip (participating schools) as `AvatarGroup`-row of school chips.

```
┌──────────────────────────────────────────────────────────────────┐
│ Activities › DECIMAL SCHOOLS FOOTBALL LEAGUE · '26 (season 2)    │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ ⚽ League cover (shield: DSCL)  StatusPill: `in_progress`    │ │
│ │ Season 2026 · 8 schools · Nairobi + Central venues · U19     │ │
│ │ REGISTERED teams: Hillcrest, St. Mary's, Moi Forces,         │ │
│ │   Kisumu Day, Coast Star, Eldoret, Nakuru Vale, Kwale Youth  │ │
│ │ [Register a player ▸] [I'm a captain — register team ▸]      │ │
│ └──────────────────────────────────────────────────────────────┘ │
│ [Overview][Fixtures][Standings][Performers]                     │
│ ── NEXT MATCH ───────────────────────────────────────────────────│
│ Sat 14:00 · Hillcrest Sports Grounds   Hillcrest vs St. Mary's  │
│ ◉ venue: Hillcrest Sports Grounds · [Add to calendar +]          │
│ ── FIXTURES (round 3) ────────────────────────────────────────── │
│  Sat 14:00  Hillcrest   2 – 1        St. Mary's   ✔ full-time  │
│  Sat 16:00  Moi Forces  –            Kisumu Day    Sat        │
│ ── STANDINGS ───────────────────────────────────────────────────│
│ # TEAM            P  W  D  L  GF GA  GD  PTS                    │
│ 1 Hillcrest        3  3  0  0   8  1  +7  9    ▲                  │
│ 2 Moi Forces       3  2  1  0   6  2  +4  7    ▲                  │
│ 3 St. Mary's       3  2  0  1   5  3  +2  6                        │
│ … 8 Coast Star     3  0  0  3   1  9  −8  0    ▼                 │
│ ── TOP PERFORMERS ────────────────────────────────────────────── │
│  ⚽ J. Mwangi (Hillcrest) 5 goals · 🧤 B. Kimemia (Moi) 2 clean  │
───────────────────────────────────────────────────────────────────│
│ Money-wiring N/A · registration modal: pick squad / player role  │
└──────────────────────────────────────────────────────────────────┘
```

### Components
Hero w/ `ProgrammeCover`-style shield · `StatusPill` (activity + per-team/registration) · `Tabs` (line) · sectioned-table-card (standings/fixtures) with `th scope="col"` + shaded `Pos` leaders · team chips (school `AvatarGroup` → school profile) · `Badge` venues · CTA bar (`tuition` register) · registration `Dialog`/`Sheet` (pick role: player/team captain; confirm eligibility) · calendar-add · `EmptyState`/`Skeleton`.

### Content & data
Activity meta + league entity: `teams[]` (school_id, name, shield, players), `fixtures[]` (round, home, away, venue_id, scheduled_at, home_score, away_score, status), `standings` (computed live), `performers` (top scorers, clean sheets). Venues (name, address, capacity) reusable as resources (`venues` house table — free name). Registrations (`tuition_activity_*` registrations gated per academy rules: form/grade eligibility).

### Primary CTA
**Register a player ▸** (tuition) → dialog → creates registration `registrations` status submission → toast. For captain: team registration modal (squad size, manager contact).

### Secondary Actions
Add fixture to calendar · venue directions (map link) · share league · download fixture list CSV · follow team.

### Filters / Search / Sort / Pagination
Fixtures filterable by round/team; standings sortable columns (default Pts desc); performers tab static top-5; pagination for large fixture logs.

### Permissions
Read school-scope published; registration requires student + eligibility per league rules (grade bands U19); parent read-only.

### Empty State
League not yet notified (draft) → "Season not open yet — check back when registrations open". Empty fixtures/standings → per-section `EmptyState` ("Fixtures announced after the draw").

### Loading State
Hero + tabs skeleton; standings table skeleton while computed.

### Error State
Banner + retry; registration conflict (already registered) → inline warning with "View your registration".

### Success State
Registration success → full-card emerald ("You're in the squad — see your team's fixtures") + toast; standings auto-updates; calendar-added toast.

### Mobile Behavior
Hero stacks; tabs → horizontal pill scroll; standings table collapses to stacked rows (interaction-first); register CTA sticky bottom during scroll.

### Accessibility
Tables with `caption` + `scope="col"`; scores announced (`role="status"` on goal change realtime); venue link descriptive; shield `alt`.

### Related Screens
STU-16 (entry) · school profile (`/tuition/profile/school/[id]`) · STU-01 · NET-07 (network standings mirror, aggregated) · TCH-20 organizer side.

---

## STU-18 Progress  (ID: STU-18)

### Purpose
Self-file on growth: streaks, per-subject completion, weekly time, weak topics identified by assessments, and milestone trend line.

### User
Student (parent mirror read-only + child switcher).

### Route
`/tuition/progress`.

### Navigation
Rail: Progress active. Time range pill (Week / Term) top-right.

### Layout
KPI row (`grid-cols-2 lg:grid-cols-4`): Current streak / Lessons done / Weekly minutes / Avg assessment score. Below: `grid lg:grid-cols-2 gap-6` — left column: Streak heat (weekly calendar grid) + Weekly minutes `LineChart`; right column: Subject progress `ProgressBar` list with per-subject chips; full-width below: Weak topics cards (per subject, from assessment `topic analysis`) + Milestones list.

```
┌──────────────────────────────────────────────────────────────────┐
│ Progress                          Time range: [Week ▾] [Term ▾]  │
│  STREAK 5 days · LESSONS 12/15 · MIN 2h 41m · AVG SCORE 71%     │
│ ┌───────────────────────┐ ┌────────────────────────────────────┐│
│ │ WEEKLY STREAK         │ │ SUBJECT PROGRESS                   ││
│ │ Su Mo Tu We Th Fr Sa  │ │ Mathematics        ▓▓▓▓▓▓▓▓ 67%   ││
│ │ –  1  2  3  4  5  –   │ │ Kiswahili          ▓▓▓▓▓▓▓▓▓ 82%  ││
│ │ (5-day fill, muted    │ │ Biology            ▓▓▓▓▓░░ 44%    ││
│ │ for missed)           │ │ English            ▓▓▓▓▓▓▓ 75%    ││
│ │ MINUTES (trend line)  │ │ Computer Science   ▓░░░░░ 12%     ││
│ │  25 · 60 · 40 · 75…   │ │ (each: programme split + lessons) ││
│ ├───────────────────────┤ └────────────────────────────────────┘│
│ │ [WEAK TOPICS (by assessment analysis)]                        ││
│ │ Simultaneous equations · Algebra   ▓▓ 55%   [Revise ▸]       ││
│ │ Word problems · Algebra             ▓ 40%   [Revise ▸]       ││
│ │ Viambata · Kiswahili               ▓ 58%   [Revise ▸]       ││
│ └───────────────────────┴──────────────────────────────────────┘│
│ MILESTONES: Lesson 50 completed · 1st assessment passed          │
└──────────────────────────────────────────────────────────────────┘
```

### Components
KPI stat blocks · `ProgressBar` (tone per %) · weekend streak heat (grid, muted/blur states) · Recharts `LineChart`/`AreaChart` (stroke `hsl(var(--border))`, ticks `hsl(var(--muted-foreground))`, tooltip `hsl(var(--card))`) · weak-topic cards (`StatusPill` weak/moderate/strong) · `Revise ▸` links → specific lesson · `EmptyState`/`Skeleton`.

### Content & data
`LessonProgress` aggregation per subject/programme (`completed count / total`, `minutes`), streak computation (consecutive active days from activity), assessment topic analysis rolled up, milestones (first lesson, streak 3/7, assessment passed, programme complete, first certificate).

### Primary CTA
**Revise weak topic ▸** (tuition accent) → nearest lesson in that programme.

### Secondary Actions
Per-subject programme list · download report (PDF) · switch time range · notify-me on topic recovery.

### Filters / Search / Sort / Pagination
Week/Term toggle; subject chips filter each panel; topics sort by weakness.

### Permissions
Own data; parent read-only via child switcher; `progress` read scoped RLS.

### Empty State
Fresh student → `EmptyState` "Progress starts with one lesson" + CTA to Explore. No topic data → hide weak-topics card.

### Loading State
KPI skeleton + chart skeleton (fixed-height frames); heat cells shimmer.

### Error State
Banner + Retry; one chart failure degrades others.

### Success State
Real-time-ish updates toast-light (no spam): on mount "Updated just now"; streak milestone crossing → celebratory stripe (once).

### Mobile Behavior
Grid → single column (KPIs `grid-cols-2` stay); charts full-width; heat collapses to last 7 days strip.

### Accessibility
Charts have `aria-label` summaries + table fallback where feasible; heat cells `aria-label="Day, X minutes"`; streak read as text.

### Related Screens
STU-01 (weak-topics feed) · STU-13 (topic source) · STU-06 (revise) · STU-19 (milestones) · STU-20.

---

## STU-19 Achievements  (ID: STU-19) — shorter spec

### Purpose
Fun + reinforcement surface: earned/locked badges, milestone progress, and bragging rights (comparisons only vs aggregated cohort).

### User
Student.

### Route
`/tuition/achievements`.

### Navigation
Rail: Achievements active.

### Layout
Header + earned-count KPI → grid of `AchievementCard`s (`bg-card rounded-xl ring-1 ring-foreground/10 p-5`): icon chip (tint `tuition-accent/10` etc.), name, description, date earned or `ProgressBar` to unlock; tiers `earned 🟢 | in-progress ↻ | locked 🔒` via `StatusPill`-like Badges. Section: Recently earned (top 4) · All achievements (grid).

```
┌──────────────────────────────────────────────────────────────────┐
│ Achievements                          Earned 12 of 28            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│ │🎯 First   │ │🔥 7-Day  │ │⚡ Quiz   │ │📚 Prog.  │            │
│ │ Lesson    │ │ Streak   │ │ Ace      │ │ Master   │            │
│ │ Earned 01/Feb│ 3/7 ▓░░│ Earned    │ │ Locked 🔒│            │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│  … (grid continues)  Profile: share your earned wall (aggregate)│
└──────────────────────────────────────────────────────────────────┘
```

### Components
`ProgressBar` · `Badge`/`StatusPill` (earned/in-progress/locked) · tinted icon chips per category (Learn/Assess/Activity/Network) · `EmptyState` (locked wall before first badge) · share ghost button · count-ups.

### Content & data
Achievement definitions (slug, name, description, icon, category, criteria, points) filtered against user `achievement_awards` (occurrence counts). In-progress shows progress to threshold; locked hides criteria detail ("keep learning to reveal").

### Primary CTA
None hard — "Keep going" ghost links into the relevant screen (explore/assess/activities).

### Secondary Actions
Share earned wall (school-aggregate only, never peer-identifying) · filter category · see next-unlock hint.

### Filters / Search / Sort / Pagination
Category chips; earned-date sort; default order = recently earned then by progress.

### Permissions
Own awards; wall share honors network privacy (aggregated only).

### Empty State
No earned badges → `EmptyState` "Achievements unlock as you learn" + Explore CTA.

### Loading State
Grid skeletons; progress bars animate to value (respect reduced-motion).

### Error State
Banner + Retry; per-card degrade.

### Success State
Badge awarding is toast + brief inline flash on this page (and push notification); `toast("Achievement unlocked: Quiz Ace")`.

### Mobile Behavior
2-col grid; expanded detail `Sheet`; earn flash top-sticky.

### Accessibility
Badges have meaningful `alt`/`aria-label`; in-progress read textually (percent); no reliance on shimmer.

### Related Screens
STU-01 · STU-18 (milestones) · STU-06/10/16 (criteria sources).

---

## STU-20 Certificates  (ID: STU-20) — shorter spec

### Purpose
Proof of completion: issued programme certificates with serial verification, online share, and PDF download.

### User
Student (earned through `ProgrammeEnrolment status='completed'` + final assessment pass threshold).

### Route
`/tuition/certificates`.

### Navigation
Rail footer/Profile hub or Achievements link; breadcrumb `Account › Certificates`.

### Layout
Header + issued count KPI → grid of certificate cards (`thumbnail` of certificate art, programme title, school, date, serial geist-mono `C-HILL-2026-0148`, "Verified" chip, status: valid/expired-term?) → actions: [Download PDF] [Share link] [View].

```
┌──────────────────────────────────────────────────────────────────┐
│ Certificates                          Issued: 2 · Eligible: 1   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🏆 English · Composition Basics    issued 12 Mar 2026       │ │
│ │   100% · Hillcrest Academy · serial C-HILL-2026-0148       │ │
│ │   ✅ Verified (school + network signed)                     │ │
│ │   [Download PDF] [Share verified link]                       │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │ 🔒 Mathematics · Algebra & Functions · 67% · 1 assessment  │ │
│ │   still to pass before certificate flips.  [Go to Progress] │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Components
`ProgrammeCover`-thumb certificates · verified `Badge` · geist-mono serial · `Button tuition|outline|link` · issue-date meta rows.

### Content & data
Issued rows (programme, school, issued_at, serial, verifier hash status) + eligibility rows (enrolment `completed` + assessment pass rule). Download triggered via object-storage signed URL pipeline (same `/api/` route pattern).

### Primary CTA
Download PDF (certificate art + deeplink verification header).

### Secondary Actions
Share (verified link) · View full-certificate modal · re-download.

### Filters / Search / Sort / Pagination
Sort by issued date; text search; none complex.

### Permissions
Own certificates; share URL consumed by anyone (public read for that serial) — matches network aggregation rule (own record only, no peer data).

### Empty State
Nothing issued yet → `EmptyState` "Certificates appear when you complete a programme at 100% (or school pass rule)" + link to My Learning.

### Loading State
Thumb skeletons (aspect ratio fixed).

### Error State
Download failure inline ("Try again"); issuance unavailable → amber banner.

### Success State
Download success toast; issuance moment → cascade toast + bell notification + certificate appears.

### Mobile Behavior
1-col; actions stacked; modal full-screen art.

### Accessibility
Certificates `alt` text includes names; serials `geist-mono` full text (not image-only).

### Related Screens
STU-05 · STU-06 (completion trigger) · STU-13 (final assessment pass).

---

## SYS-06 Student onboarding wizard  (ID: SYS-06)

### Purpose
First-run compaction: gather school context (if not linked), grade/subjects, interests, goals, then generate a recommendation set in one sitting — so Home (STU-01) is immediately personalized. Skips cleanly for invited students who already fit context.

### User
New student identity: auth user linked to a `students` row (school/class known) OR a bare learner needing to "connect school + class".

### Route
`/tuition/onboarding`. Guarded: if onboarding already completed → redirect to `/tuition`. Saves draft progress per step (server + local) so refresh is painless.

### Navigation
Wizard header: brand lockup + **progress stepper (1–7)** + [Skip] ghost. No rail, no bottom bar. Step content centered `max-w-2xl`; footer = [Back] / next CTA (tuition accent). Linear forward, Back allowed; steps persist.

### Layout & steps

**Step 1 — Welcome**
Full-screen: tuition-accent gradient hero (drawn-down glow), product lockup, one-liner "Learn, revise and grow anywhere — on the bus, at home, after games." CTA [Get started ▸]. (No form.)

```
┌──────────────────────────────────────────────────────────────────┐
│ Decimal Tuition · step 1/7 · [Skip ▸]       (brand gradient card)│
│  LEARN · TEACH · ASSESS · ACTIVITIES · NETWORK                   │
│  "Meet the road to your KCSE & beyond."  [Get started ▸]        │
└──────────────────────────────────────────────────────────────────┘
```

**Step 2 — Connect your school**
If student row unresolved: search school ([Find "Hillcrest"…]) + pick school from results (`programmeChip`) → select class (`Form 2 West ▾` from school's classes) → confirm. Resolved students: auto-read-only card "Hillcrest Academy · Form 2 West" + [Confirm ▸]. CBC students choose `Grade 6/9` band equivalent.

**Step 3 — Grade & subjects**
Radio-grade picker `Form 1…Form 4` (or CBC band) → subject chips (`multi-select`): Mathematics, English, Kiswahili, Biology, Chemistry, Physics, Computer Science, Agriculture, Business Studies, History & Government, Geography, P.E. Minimum 3 selected (inline validation message). Summary pushed to next step.

**Step 4 — Interests**
Interest tag grid (multi-select chips): STEM & Maths · Languages & Literature · Sports & Fitness · Arts & Creativity · Business & Money · Agriculture & Environment · Careers & Tech. Chips toggle `bg-tuition-accent` tint when active.

**Step 5 — Goals**
Two controls: **exam target** (KCSE grade select `B+` etc. or CBC "meet national mean") and **weekly minutes** slider/segment (`<1h · 1–3h · 3–5h · 5h+`). Free-text "What do you most want to improve?" optional textarea. These write `learning_prefs` for recommender + streak target.

**Step 6 — Recommendations**
Server-generated `ProgrammeCard` set (3–6) from Step 2/3 filters ordered by match (grade+subject+interest), each with `[Enrol]` outline or pre-toggle; "More like this" refresh ghost. Zero results → message "we'll still tailor Home as you browse" + go.

**Step 7 — Done**
Success card (emerald `CheckCircle`, "All set"): summary of selections + "3 programmes on your desk". CTA `[Take me home ▸]` → `/tuition` marking onboarding complete (write `profiles`/`tuition_onboarding` flag). Rightly claimed at this point.

```
│ ◉ Decimal Tuition   step 7/7                         ✓✓✓✓✓✓✓   │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ ◯ CheckCircle emerald "ALL SET, WANJIKU"                    │ │
│ │  Hillcrest Academy · Form 2 West · Mathematics, English,…   │ │
│ │  Target: B+ · 3–5h/week · 3 recommended programmes ready     │ │
│ │                    [Take me home ▸]  (tuition CTA)          │ │
│ └──────────────────────────────────────────────────────────────┘ │
```

### Components (wizard)
Stepper (numbered dots + labels, `aria-current="step"`) · canonical inputs selects/multi-select chips · `ProgrammeCard` (recommendations) · `StatusPill`-free (keeps clean) · `Button tuition|outline|ghost|link` · progress persistence (`loan` server payload) · success card pattern (emerald circle) · `EmptyState` for no matching programmes.

### Content & data
Per-step writes: `connect` (school_id, class_id or CBC band), `grade/subjects` (subject ids / grade), `interests` (tags), `goals` (exam target, weekly minutes), `recommendations` (candidate programme ids, selected flags), `done` (flag). All persisted server-side per step with local draft fallback.

### Primary CTA
Next per step (`Continue ▸`, tuition). Step 7 → **Take me home ▸**.

### Secondary Actions
Back · Skip (persist progress-to-date; onboarding stays marked incomplete so wizard returns) · "More like this" on Step 6.

### Filters / Search / Sort / Pagination
Step 2 school search (scrollable results, server) · Step 6 sort by match; pagination not needed (≤6).

### Permissions
New-student only; wizard state scoped to user; school context validates server-side on confirm.

### Empty State
School search no matches → inline "Can't find your school? Ask your teacher to set up Tuition" + email tendered to office. Step 6 zero recommendations → friendly `EmptyState` + Skip-to-home path.

### Loading State
Per-step progress on CTA (`Loader2` swap + disabled); recommendations skeleton cards.

### Error State
Step-save failure → inline `destructive` banner + Retry (never toast-lie). School-confirm failure → field-level error under picker.

### Success State
Step 7 full success card; finish flushes flag → redirect Home with warm banner ("Your desk is ready") once.

### Mobile Behavior
Single column; stepper numbers compress to dots; multi-select chips wrap; CTA full-width sticky bottom; keyboard safe.

### Accessibility
Stepper announced; multi-select supports checkbox semantics (aria-checked); focus moved on step change (`role="status"` step announcement); contrast maintained on accent chips; reduced-motion progress.

### Related Screens
STU-01 (entry home) · STU-02/03 (recommendations source) · STU-04 (enrol targets) · SYS-05 (settings re-run path).

---

## 4. Cross-cutting rules (every screen)

Taken verbatim from `04-screen-inventory.md`: **every screen carries** loading skeleton, empty state, error state, permission-denied inline, offline banner (via `SyncIndicator` reuse), and success feedback (const from design-system §9) — implemented through the shared `DataState`/`Skeleton`/`EmptyState` primitives so no screen re-invents them. Student mobile chrome everywhere except the three immersive exemptions (player STU-06, assessment take STU-12, live room STU-15).