# DECIMAL TUITION — SPEC FILE 08 — System Wireframes

> Partners: `_context.md` (tokens/conventions), `03-design-system.md` (visual surface), `02-information-architecture.md` (routes/nav), `04-screen-inventory.md` (ID registry). Every element below uses exact tokens/statuses from `_context.md` §1–§7 and tokens from `03-design-system.md` §2. No invented tokens.
>
> Priority keys: **P0** = MVP, **P1** = important soon after, **P2** = later (deploys on MVP).

---

# Part A — Global system screens

---

## Product Switcher  (ID: SYS-01)

### Purpose
Let any authenticated user toggle between the two Decimal products — **School Management** (`/dashboard` or the role portal root) and **Tuition** (`/tuition`) — without logging out, re-authenticating, or losing school context. This is the central architectural component: the entire desktop header and sidebar are organised around it (see Part I).

### User
All authenticated users: `super_admin, principal, teacher, finance, admissions_officer, secretary, parent`, and students resolved via `students`/`tuition_student_users` (not `school_members`).

### Route
Not a page — a global component rendered in:
- Desktop `TuitionShell`/`PlatformShell` sidebar (top, above nav items).
- Mobile slide-over drawer (top item) and topbar brand block.
- Header brand label shows the active product name at all times.

### Navigation
- Opens a `DropdownMenu` (inverted Tooltip-compatible keyboard model, focus-trapped). Items: School Management / Tuition.
- Selecting an item = client-side path navigation only (`/dashboard` ↔ `/tuition`). Active product is highlighted; inactive item reads as a normal menu row.
- The switcher is the *only* global way to cross products. There is also a passive footer chip "In Tuition →" when inside tuition that is not interactive (aria-hidden semantics handled by header, Part I).

### Layout
```
DESKTOP SIDEBAR (top block)                     OPEN STATE
┌──────────────────────────────┐   ┌──────────────────────────────┐
│  ● DECIMAL        ▾          │   │  ● DECIMAL        ▾          │
│  School Management           │   ├──────────────────────────────┤
├──────────────────────────────┤   │  ▸ School Management         │
│  Tuition rail / nav items…   │   │    Run your school     ✓      │
│                              │   │  ▸ Tuition                   │
│                              │   │    Teach, learn & grow  ►    │
│                              │   └──────────────────────────────┘
└──────────────────────────────┘      (active product: highlight,
                                       inactive: normal row, no dim)
```

MOBILE (slide-over top, below brand):
```
┌──────────────────────────────────┐
│  ● DECIMAL            [×]      │
│  ┌────────────────────────────┐ │
│  │ ●  School Management  ›   │ │
│  │ ●  Tuition            ›   │ │   ← active tinted bg-tuition-accent/10
│  │  Use Tuition to teach,    │ │      left marker text-tuition-accent
│  │  learn & grow.            │ │
│  └────────────────────────────┘ │
└──────────────────────────────────┘
```

### Components
- `ProductSwitcher` (`src/components/tuition/`): `DropdownMenuTrigger` + `DropdownMenuContent` (default menus are already in the library). Brand mark = existing logo block; add chevron `ChevronDown`.
- `TuitionShell` / `PlatformShell` accept `productSwitcher` via layout composition.
- Active item marker: `Check` icon (`size-4`) right-aligned, `text-tuition-accent` inside Tuition, `text-primary` inside School Management.
- Item metadata line: `text-xs text-muted-foreground` (School Management = "Run your school"; Tuition = "Teach, learn & grow").
- Divider `Separator` between the two items.

### Content & data
Static labels + current pathname. Deriving active product:
- `activeProduct = pathname.startsWith("/tuition") ? "tuition" : "school"`.
- Title/aria: `aria-label={`Switch product. Current: ${activeProduct === "tuition" ? "Tuition" : "School Management"}`}`.

### Primary CTA
None — the switcher itself is navigation. The active product row is read-only (switching to it is a no-op, keep it clickable for re-navigation to the root).

### Secondary Actions
None inside the switcher.

### Permissions
Visible to all authenticated users. Never rendered for anonymous visitors. School context resolution is unchanged on both sides (both products require an active school context; `profiles.active_school_id` valid).

### Empty State
N/A. Both items always present.

### Loading State
Chevron dims (`opacity-50`) until first client render; then stable. No skeleton needed for a static switch.

### Error State
If either target route is role-restricted and the user is denied (e.g. a parent who has no student link tries `/tuition/my-learning`), they fall through to `permissionDenied()` styling on the target screen — the switcher itself never errors.

### Success State
Toast-free flip (navigation is instant). Title-breadcrumb on the target screen confirms the product ("Tuition › My Learning").

### Mobile Behavior
Slide-over drawer: switcher is the first block inside the drawer body, under the brand header. Full-width rows (`h-14`, 44px touch target). Tapping an item closes the drawer and navigates.

### Accessibility
- Trigger has `aria-haspopup="menu"` + `aria-expanded`.
- Rows are standard menu items; arrow keys navigate; `Esc` closes.
- Active row carries `aria-current="page"` at the top-level nav level.
- Contrast: active tint text is `text-tuition-accent` on `bg-tuition-accent/10` = 4.5:1+ (500-weight).

### Related Screens
SYS-05 Settings (product identity), Part I (header consolidation), `_context.md` §6 decision 3.

---

## Tuition Global Search Overlay  (ID: SYS-02)

### Purpose
Full-text search across all Tuition content so a user can jump anywhere without knowing the route: programmes, lessons, teachers, students (minimal), assessments, activities, schools, and resources. Surfaces recent searches, suggestions, and typed-ahead results with deep links.

### User
All Tuition roles (student, teacher, school admin, network admin, parent read-only).

### Route
`/tuition/search` — implemented as an overlay/modal over the current Tuition screen (`SearchOverlay` component). Query param `?q=` reflects the active query for shareability/reload. `Cmd/Ctrl+K` opens it on every Tuition screen.

### Navigation
Opens from: header Search button (magnifier, `lg:visible`), `Cmd/Ctrl+K` shortcut, and mobile topbar search icon. Esc closes. Enter on a group header jumps to paginated results; click on a result row = navigation (deep link from row entity).

### Layout
```
┌────────────────────────────────────────────────────────────────┐
│  Search Tuition                             [Esc to close]  ×  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ⌕  e.g. "quadratic equations Gr 9", "Ms. Njeri"  ⌘K      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  ● Programmes            (4)          RECENT                        SUGGESTED
│  ┌────────────────────────────────────────────┐   ┌──────────────┐│
│  │ ▹ Maths Prep: Quadratics · Gr 9 · Ms Njeri │   │ Quadratic    ││
│  │ ▹ Science & Society · Gr 8 · Mr Kimutai    │   │ Equations    ││
│  └────────────────────────────────────────────┘   │ KCSE Maths   ││
│  ● Lessons               (11)        recent chips    Kiswahili    ││
│  │ ▹ Lesson 4: The Quadratic Formula (video)  │   │ Term 1 2026  ││
│  ● Assessments           (3)                       └──────────────┘│
│  │ ▹ Gr 9 Mathematics Ass 1 · open · 12 May    │                  │
│  ● Teachers              (2)                                      │
│  │ ▹ Ms. Njeri Wanjiru · Mathematics        [view all teachers ▶]│
│  ● Schools               (1)                                      │
│  │ ▹ St. Mary's Girls High School                                 │
│  ● Resources             (6)                                      │
│  │ ▹ quadratics-worksheet.pdf · shared to Gr 9                    │
│  │   > see all results (42 total)  [Enter]                        │
└────────────────────────────────────────────────────────────────┘
```

### Components
- `SearchOverlay` (`@/components/tuition/search-overlay`) — full-screen front layer `fixed inset-0 z-50` with `bg-background/95 backdrop-blur-sm`.
- Canonical search input class (`_context.md` §1) with `Search` icon left and `⌘K` kbd chip right.
- Result groups: group header `text-xs font-medium uppercase tracking-wide text-muted-foreground` + icon from the space map (Learn=BookOpen, Assess=ClipboardCheck, etc.) + `Badge` count.
- Row: entity avatar/cover chip + title `text-sm font-medium` + meta line `text-xs text-muted-foreground` (space dot, status pill, shared-with string) + chevron.
- Recent searches: chip pills `rounded-4xl bg-muted` with clock icon + `×` dismiss per chip.
- Suggestions: static list from server (`search_suggestions` or derived from query log), shown when query empty.
- No-results panel: `EmptyState` with `FileSearch` icon.

### Content & data
Search scope per role (server-side permission filter — students see only published content visible to their enrolment scope):
- **Programmes** (`tuition_programme` read): title, teacher, grade, subject.
- **Lessons** (`tuition_lesson` read): lesson title, module/programme, content type.
- **Teachers** (`staff`+tuition instructor join): name, subject.
- **Students** (minimal): by name + admission number ONLY for teacher/principal who own the programme; student results never include other aggregate chips.
- **Assessments** (`tuition_assessment` read): title, status pill, window.
- **Activities** (`tuition_activity` read): title, status pill (e.g. `registrations`).
- **Schools** (`schools` in network scope, read): name + region.
- **Resources** (`tuition_content` read): title, content-type icon, visibility scope.

Sandbox the query min 2 chars, debounced 300ms (reuse search-modal pattern). Serialized to `?q=`. Deep link row = entity route:
- Programme → `/tuition/programmes/[id]` (student) or `/tuition/teacher/programmes/[id]` (teacher).
- Lesson → `/tuition/learn/[programmeId]/[lessonId]` (if accessible).
- Assessment → `/tuition/assessments/[id]` or teacher results route.
- Activity → `/tuition/activities/[id]`, event → school events route.
- Resource → `/tuition/learn/...` or teacher content preview.
- Teacher → `/tuition/profile/teacher/[id]`; Student → `/tuition/profile/student/[id]`; School → `/tuition/profile/school/[id]`.

### Primary CTA
Clicking a result row (deep link). When query yields >N results, footer button "See all results (42)" → full-page `/tuition/search?q=...`.

### Secondary Actions
`Esc`/`×` close; `⌘K` re-open; per-recent-chip `×` to delete from recent list; "Clear recent" link.

### Permissions
Enforced server-side on each entity query via tuition resource `read`. Students never see draft/private school content. A parent sees only the linked student's enrolled programme content + network-public content. Student search hits restricted to own staff context (teacher/principal only).

### Empty State
Three cases:
- Query empty: Recent + Suggested panels only.
- Query with zero matches anywhere: full `EmptyState` — `FileSearch` icon (h-5 w-5), title "No results for “{query}”", copy "Check the spelling, or try a broader term like “maths” or “Gr 9”." + actions "Clear search".
- Typo bail-out: tolerance line under no-results "Did you mean: quadratics" as a `link` button.

### Loading State
While debouncing: input caret + subtle `animate-pulse` count placeholders (`h-4 w-16 bg-muted rounded` in each group header). After first paint, results stream in per group as cards fade in (transition only).

### Error State
Network failure: inline banner `rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive` — "Search is unavailable right now. Your connection may be offline — check and try again." Keep Recent panel rendered (it is local/cached). Retry button.

### Success State
Instant: active row highlights on hover; pressing Enter follows the top result; toast not needed.

### Mobile Behavior
Full-screen takeover (`inset-0`), keyboard focused on open. Group headers remain; rows are h-14 (≥44px). Recent chips wrap. `⌘K` replaced by topbar search icon + a "Search" FAB-less affordance; bottom of sheet gets a compact "Recent" horizontal scroll strip.

### Accessibility
- Focus trap; initial focus on input; `Esc` closes and returns focus to trigger.
- Results as `listbox`/`option` with `aria-selected` for arrow-key navigation.
- Live region `role="status"` announcing "42 results for quadratics".
- Icon-only rows labels; group icons have `aria-hidden`.
- Contrast `text-muted-foreground` meta ≥ 4.5:1.

### Related Screens
SYS-01 (opens everywhere), STU-02/STU-03 Explorer (dedicated browse backed by same search index), TCH-09 Content Library, NET-01 network discovery.

---

## Notification Center  (ID: SYS-03)

### Purpose
A single, tuition-aware inbox for everything a user must act on or is informed of — assessment/assignment/class reminders, programme updates, activity updates, and network announcements — with one-tap deep links. Reuses the existing `notifications(user_id, school_id, title, message, type, is_read, deep_link)` table, adding tuition `type` values and richer render hints.

### User
All authenticated Tuition users. Content is scoped by `user_id` (personal) — a student sees only their own; a teacher sees theirs + aggregate classroom signals they own.

### Route
`/tuition/notifications`. Header bell opens a mini preview (top 8) that links to this page.

### Navigation
- Desktop header bell (badge = unread count) → dropdown preview (top 8, unread first, "View all" → this page).
- Sidebar footer item "Notifications" for student; main nav item for teacher/school.
- Each row deep-links via the `deep_link` column. Mark-as-read on open; bulk "Mark all as read".

### Layout
```
TUITION NOTIFICATIONS                          SYS-03
┌───────────────────────────────────────────────────────────────┐
│  Notifications                     (3 unread)  [Mark all read] │
│  p text-muted-foreground mt-1 — Skip the noise, catch the cue  │
├───────────────────────────────────────────────────────────────┤
│  Tabs:  All · Unread · Assessments · Classes · Programmes ·   │
│         Activities · Network                                    │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  TODAY                                                    │ │
│  │  ▸ [assess] Gr 9 Maths Assessment 2 opens in 2 days      │ │
│  │    Ms. Njeri Wanjiru · Mathematics · 28m  ago    [unread]│ │
│  │  ▸ [class] Live Class: Quadratic Formula · 4:00 PM       │ │
│  │    starts in 30 minutes · Mathematics Gr 9 · 12m ago     │ │
│  │  ▸ [prog] 3 new lessons in Science & Society            │ │
│  │    Mr. Kimutai published Module 2 · 1h ago               │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  YESTERDAY                                               │ │
│  │  ▸ [grade] Assignment 3 graded — 82% · read              │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │  THIS WEEK                                               │ │
│  │  ▸ [net] Network Mathematics Challenge — Term 1 2026     │ │
│  │    Nairobi South Zone · read                              │ │
│  │  ▸ [act] Athletics trials registered · Sat 9:00 AM       │ │
│  └───────────────────────────────────────────────────────────┘ │
│  [Show older notifications ▾]                                  │
└───────────────────────────────────────────────────────────────┘
```

Row anatomy: left icon chip (tinted by space: assess=violet `bg-tuition-assess/10 text-tuition-assess`, class=blue learn tint, activity=green, network=amber), title `text-sm font-medium`, meta `text-xs text-muted-foreground` "Title · When", unread dot `h-1.5 w-1.5 rounded-full bg-tuition-accent` on the right (or unread row bg `bg-muted/30`).

### Components
- Page shell: `space-y-6` wrapper, header block, `Tabs` (`TabsList variant="line"`), server-paginated list card (sectioned table card recipe re-used as a list card).
- Existing `notification-center.tsx` preview card is reused in dashboard variants; add tuition `type` rendering.
- `DataState` wrapper (loading/empty/error).
- Each type maps to: `titleFont`+icon, e.g. `assessment`→ClipboardCheck, `assignment`→FileText, `class_reminder`→Video, `programme_update`→BookOpen, `activity`→Trophy, `network`→Globe2, `grade`→Percent.

### Content & data
Rows from `notifications`: `title`, `message`, `type`, `is_read`, `created_at`, `deep_link`. Tuition introduces `type` values appended to existing set: `assessment_open`, `assessment_due`, `assignment_assigned`, `assignment_graded`, `class_starts`, `class_replay_ready`, `programme_published`, `module_added`, `progress_milestone`, `activity_registration`, `activity_result`, `network_announcement`, `enrol_confirmed`, `invite_teacher`. Deep links per `_context.md` route map.

### Deep-link resolution
Rows deep-link via the `deep_link` column; a `deep_link` that starts with `/tuition` MUST render as `<Link>` into the tuition routes (product-aware) — never a raw anchor or `window.location` jump.
- Decimal is two products (**School Management** and **Tuition**), so a `/tuition…` deep link opened from a School Management session must (a) switch the product context to Tuition, and (b) land on exactly that tuition route. The active product persists in `localStorage` under the key **`decimal:lastProduct`** (hydrated on boot for header, bell, and badge state); when the key is unset, the SYS-01 derivation `activeProduct = pathname.startsWith("/tuition") ? "tuition" : "school"` is the fallback.
- Reverse likewise: a `/tuition` notification opened while already in Tuition stays in place — client-side navigation within the tuition shell, no reload.
- Guardrail: if the linked tuition route requires a role the current user lacks, **or** student/parent identity resolution fails, show the standard permission/error state (Part G canon: "You don't have permission to do that here." + role-appropriate action) rather than a dead link.

### Primary CTA
Open the row (marks read + navigates to `deep_link`). "Mark all read" (bulk).

### Secondary Actions
Filter tabs; "Show older"; bell-preview "View all"; per-row swipe/`⋮` → Mark read/unread, (when applicable) "Snooze". Direct "Undo" toast not required (notifications are not destructive).

### Permissions
Personal inbox (`user_id = auth.uid()`). A parent inherits the linked student's tuition notifications (rendering applies to parent user row) but never teacher-only ones.

### Empty State
`EmptyState` BellOff icon, "You're all caught up", "No notifications right now. We'll nudge you here for assessments, classes and programme updates." Unread tab empty → "Nothing unread — nice work."

### Loading State
`Skeleton` rows (`h-14`) 6× while the list loads; tabs stay interactive.

### Error State
In-page banner (destructive style): "We couldn't load your notifications. Pull to refresh or try again." Retry button.

### Success State
Deep link navigates; toast("Marked all as read") on bulk action (3s pill).

### Mobile Behavior
Bulleted rows become `h-16` touch rows; tabs horizontally scrollable (`overflow-x-auto`); "Mark all read" becomes an icon button in the header. Pull-to-refresh both preview sheet and page.

### Accessibility
- Rows are `<li><a>` with visible focus; unread announced (`aria-label="Unread: …"`).
- Badge count printed for SR via `visually-hidden` text.
- Lists `aria-live="polite"` for bulk mark-all status.
- Touch targets ≥ 44px.

### Related Screens
SYS-05 (Notifications settings tab controls default channels/quiet hours), STU-01 (panel), `notifications` table semantics.

---

## Profile Hub + Public Profiles  (ID: SYS-04)

### Purpose
The Tuition identity layer. A **Profile hub** (own profile, avatar, cover, links, managed by the user) and **public profiles** for `student`, `teacher`, and `school` types — what others see in Explore, Network, Teacher views, and programme pages. Public profiles are read-only and privacy-scoped.

### User
All Tuition roles; public profiles viewed by students browsing a teacher/programme, teachers reviewing a student, and principals reviewing school standing.

### Route
- Hub: `/tuition/profile` (own).
- Public: `/tuition/profile/[type]/[id]` where type ∈ `student | teacher | school`.

### Navigation
Header avatar dropdown (Profile → `/tuition/profile`). From any avatar chip or name catch in Explore/Network/Programme detail → public profile deep link. Hub links to edit (→ `/tuition/settings?tab=profile`).

### Layout

#### Hub
```
/tuition/profile  (HUB)                          SYS-04
┌───────────────────────────────────────────────────────────────┐
│  ● DECIMAL ▾   │ (Tuition rail)  My Profile    │ ⌕  🔔  …    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  COVER  (aspect-video / gradient)  [Edit]               │  │
│  │  ● Avatar lg                                 ┌────────┐  │  │
│  │  Amani Otieno                              │ 92%    │  │  │
│  │  @amani.ot12 · Gr 9 · Violet House         │ streak │  │  │
│  │  Nairobi International School              └────────┘  │  │
│  └─────────────────────────────────────────────────────────┘  │
│  Tabs:  About · Learning · Activity · Achievements            │
└───────────────────────────────────────────────────────────────┘
```
Hub tabs: About (bio, grade, school), Learning (enrolled programmes + progress), Activity (recent assessment scores, activity medals), Achievements (badge grid). Teacher hub variant adds "Classrooms & Programmes"; school hub variant adds "Network standing".

#### Public Student Profile (example)
```
/tuition/profile/student/5a3c…                     (read-only)
┌───────────────────────────────────────────────────────────────┐
│  ● Avatar sm          Amani Otieno                            │
│  @amani.ot12 · Gr 9 · Violet House · Nairobi Int'l School     │
│  [Follow]        [Message]  ·  joined Term 1 2026             │
├───────────────────────────────────────────────────────────────┤
│  About:  Loves Maths & Science. School football team (left w).│
│  Learning:  Mathematics Gr 9 · 62%   Science Gr 8 · 48%       │
│             [Progress bars, tuition-progress fill]            │
│  Recent activity (public scope only):  Science quiz · 71%     │
│  Achievements:  ⭐ 3-day streak · 🏅 Science merit            │
└───────────────────────────────────────────────────────────────┘
```

#### Public Teacher Profile (example)
```
/tuition/profile/teacher/9b1e…                      (read-only)
┌───────────────────────────────────────────────────────────────┐
│  ● Avatar         Ms. Njeri Wanjiru                           │
│  Mathematics and Additional Mathematics · 8 yrs               │
│  Nairobi International School  ·  TSC-certified  [Follow]     │
├───────────────────────────────────────────────────────────────┤
│  ★ 4.8  (112 ratings)     4 programmes  1,204 students        │
│  Programmes:                                                 │
│    ▹ Maths Prep: Quadratics · Gr 9 · 480 students · ★4.9     │
│    ▹ Additional Maths Gr 11 · Open  │  [Enrol capsules]      │
│  Recent network mention:  Zone B termly benchmark · 2nd      │
└───────────────────────────────────────────────────────────────┘
```

#### Public School Profile (example)
```
/tuition/profile/school/03f8…                       (read-only)
┌───────────────────────────────────────────────────────────────┐
│  ● Cover          St. Mary's Girls High School                │
│  Nairobi · Kangemi · Day & Boarding · Founded 1987            │
├───────────────────────────────────────────────────────────────┤
│  Tuition standing tab:   Network Rank #42  ·  Bench 78%ile    │
│  Active programmes:  6 · Enrolled students: 1,204            │
│  Termly benchmark:  62 mean (network 58) · Gr 9 Maths        │
│  [View public programmes]  (scope = school + published)      │
└───────────────────────────────────────────────────────────────┘
```
All public profile metrics are aggregate; student identities never appear on school/network public surfaces (privacy rule `_context.md` §7).

### Components
- Avatar/AvatarGroup, Badge (`outline` for TSC/role), Streak chip, ScoreDial (reuse), ProgressBar (tone `tuition-progress`), ProgrammeCard, Tabs.
- New: `ProfileHeader` (cover+avatar+name+@handle+meta row + action cluster) shared by all three types.

### Content & data
- Hub: own `profiles` row + `students`/`staff`/`schools` extensions + `tuition_enrolments`/`lesson_progress` counts + achievement/streak.
- Public: privacy-filtered projection — `is_public` toggles per field; students default minimal (name, grade, house, anonymized progress), teachers default teaching-facing, schools default institutional.
- Handle: `@` + `username` (profiles).

### Primary CTA
Hub: "Edit profile" → `/tuition/settings?tab=profile`. Public: context-specific — student = Follow; teacher = Follow + Enrol CTA (when a published programme is attached); school = "View public programmes".

### Secondary Actions
Message (mailto/deep-link), Share (native share / copy link), Report (flag for moderation, destructive-adjacent ghost).

### Permissions
`tuition_content/read`-adjacent; public profiles opened by logged-in tuition users only (route-protected). Own hub editable; others read-only. Students' private fields (admission #, guardian, marks list) never surfaced; parents see full own-child profile.

### Empty State
Student with no public activity: "Nothing public yet — Amani hasn't shared learning activity." Hidden when user sets everything private (a subdued "Profile is private" card replaces content).

### Loading State
`Skeleton` header (cover + avatar circle) + 3 list rows; tabs content skeletons.

### Error State
Unknown `[id]`: `DataState` error card "This profile isn't available. It may have been deactivated." + link back to previous. Permission flavor: "Privacy setting: this student keeps their profile private." with return link.

### Success State
Follow/Enrol trigger toast; profile edits save with inline success banner (emerald).

### Mobile Behavior
Cover shrinks to `aspect-[4/3]`; avatar overlaps cover (negative margin) — standard social pattern; action row wraps; tabs scroll; touch targets ≥ 44px.

### Accessibility
- Avatar `alt`, initials fallback kept.
- Follow/enrol buttons are `<Button>` (no asChild).
- Contrast for social handles `text-muted-foreground`.
- Keyboard-focusable cover link to full-size image (dialog).

### Related Screens
SYS-05 Settings → Profile tab; STU-04 (programme detail shows teacher/ school profiles); TCH-12 (teacher→student profile deep links both private & public projections).

---

## Settings  (ID: SYS-05)

### Purpose
The single Tuition settings surface. Tabbed page: **Account, Profile, Notifications, Privacy & Security, Learning Preferences, Accessibility** (all users) + **Tuition Settings, Permissions, Integrations** (school admins/principal only; territory of `/tuition/school`). Saves are per-form with inline banners — no global "Save" commit.

### User
All authenticated Tuition users. School-only tabs render only for `principal`/`super_admin` (school context) & `tuition_admin`-licensed roles; teachers/students see a "hidden" state — tabs are simply absent (not disabled) for non-principal roles, except Permissions which shows a read-only "view" for teachers.

### Route
`/tuition/settings?tab=<key>` (keys: `account, profile, notifications, privacy, learning, accessibility, tuition, permissions, integrations`). Default `account`. Tab in URL so deep links from hub work (`/tuition/settings?tab=profile`).

### Navigation
Sidebar footer Settings; header avatar → Settings; hub "Edit". Tab navigation within page via `Tabs` (pill default onto `TabsList`).

### Layout
```
/tuition/settings                              SYS-05
┌───────────────────────────────────────────────────────────────┐
│  Settings                                        SYS-05       │
│  Tabs: Account | Profile | Notifications | Privacy & Security │
│        Learning Pref. | Accessibility | (School) Tuition      │
│        Settings | Permissions | Integrations                  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  [Tab content area — one active tab rendered]            │  │
│  │  Each tab: sectioned form cards with save per section.   │  │
│  │  All tabs scroll independently within this container.    │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```
Tab wireframes per section follow; school-only tabs (`Tuition Settings`, `Permissions`, `Integrations`) are absent for non-principal roles.

### Components
`Tabs` + `TabsList variant="pill"` + `TabsTrigger` + `TabsContent` (existing library — adopt freely per `03-design-system.md` §10 note). Form sections use the existing `rounded-xl border border-border bg-card p-6 space-y-5` card recipe. Each form has its own save button (`Button variant="tuition"` for tuition-critical tabs, `default` otherwise). Toggle controls = switch-pill pattern from existing billing. `DataState` wrapper around each tab's data-bound content.

### Content & data
Per-tab reads/writes: Account → `profiles`, `users`; Profile → `profiles.username/bio/avatar_url/cover_url` + `students`/`staff` extensions; Notifications → `notification_preferences` row per type; Privacy → `profiles.public_profile_flags` JSON; Learning → `tuition_student_preferences`; Accessibility → `profiles.accessibility` JSON; Tuition Settings → `school_feature_flags` + `billing_entitlements` via `requireFeature`; Permissions → `role_permissions` seeded table; Integrations → school-level config table (M-Pesa, WhatsApp, etc.). Each tab posts to its own API route (`/api/tuition/settings/*`) wrapped in `createRoute`.

---

### Tab 1 — Account

```
┌───────────────────────────────────────────────────────────────┐
│  Settings                                        SYS-05       │
│  Tabs: Account | Profile | Notifications | Privacy & Security │
│        Learning Pref. | Accessibility | (School) Tuition      │
│        Settings | Permissions | Integrations                  │
├───────────────────────────────────────────────────────────────┤
│  Account                                                     │
│  ┌───────────────────────────────────┐                        │
│  │  Email            kamu@omail.ke   │  [Change email]        │
│  │  Password         •••••••••        │  [Change password]    │
│  │  Phone            +254 722 000 000 │  [Update M-Pesa?]     │
│  │  OAuth            Google  ✓ linked │  [Link / unlink]      │
│  │  Sessions         Active on 2 dev. │  [Manage sessions]    │
│  ├───────────────────────────────────┤                        │
│  │  Sign-in activity · Danger zone: Deactivate account       │
│  └───────────────────────────────────┘                        │
└───────────────────────────────────────────────────────────────┘
```
Fields: email (verified status pending), password (reset flow), phone, OAuth connections, session list. Primary CTA: save per section ("Save email"). Danger zone row "Deactivate account" (destructive-ghost, only after confirm modal).

---

### Tab 2 — Profile

```
│  Profile                                                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Photo  (● avatar preview)     [Upload] [Remove]         │ │
│  │  Cover  (gradient / upload)    [Upload]                  │ │
│  │  Display name    Amani Otieno                             │ │
│  │  Username  @amani.ot12  (check ✓  available chip)        │ │
│  │  Bio (140)    Loves Maths & Science…                      │ │
│  └──────────────────────────────────────────────────────────┘ │
│  Student extras: Grade (Gr 9) · House (Violet) · School       │
│  Teacher extras: subject · TSC No. · school · bio             │
│  School extras: founded · boarding type · region · profile    │
└───────────────────────────────────────────────────────────────┘
```
Primary CTA "Save profile". Username live-validates (`/^[a-z0-9._]+$/`, uniqueness against `profiles.username`).

---

### Tab 3 — Notifications

```
│  Notifications                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Assessment & assignment reminders         [toggle] ON   │ │
│  │    - due date (default 2 days)  [select]                 │ │
│  │  Class reminders                        [toggle] ON      │ │
│  │  Programme updates                      [toggle] ON      │ │
│  │  Activity updates                       [toggle] ON      │ │
│  │  Network announcements                  [toggle] ON      │ │
│  │  Progress milestones                    [toggle] ON      │ │
│  ├──────────────────────────────────────────────────────────┤ │
│  │  Quiet hours     20:00 – 07:00   [toggle]        EAT     │ │
│  │  Channels:  Email ✓  Push ✓  SMS (network critical only) │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```
Toggles = existing switch-pill pattern. Each toggle persists via API. "Reset to defaults" secondary.

---

### Tab 4 — Privacy & Security

```
│  Privacy & Security                                           │
│  ┌──────────────────────────────────────────────────────────┐ │
│  Public profile                     [toggle] ON             │ │
│  - show school           [toggle]   - show grade [toggle]   │ │
│  - show learning activity [toggle]  - show achievements ✓   │ │
│  Show on Explore leaderboards        [toggle] ON            │ │
│  Parent/guardian view (under 18)     [toggle] ON            │ │
│  Two-factor auth (email OTP)         [toggle] OFF [+ setup] │ │
│  Active sessions    Nairobi, Chrome · 12 min ago  [Revoke]  │ │
│  Sign me out everywhere                          [Sign out] │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```
Primary CTA "Save changes". 2FA setup opens a small confirm modal (email code). Sessions listing reuses existing `user_sessions` pattern.

---

### Tab 5 — Learning Preferences

```
│  Learning Preferences                                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  Preferred grade  [Gr 9 ▾]   Stream  [Yellow ▾]             │ │
│  Interests chips:  Maths ✓ Science ✓ Kiswahili + Add subject│ │
│  Language         [English ▾] (Kiswahili available)         │ │
│  Difficulty            ● intermediate  (beginner/advanced)  │ │
│  Lesson reminders     [toggle] ON · time 18:00 EAT          │ │
│  Assessment mode      Restrict back-navigation [toggle] ON  │ │
│  Subtitles            [toggle] OFF                          │ │
│  Download over Wi-Fi only   [toggle] ON                     │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```
Powers Explore/Home personalization and player defaults.

---

### Tab 6 — Accessibility

```
│  Accessibility                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  Text size      A  A+  A++           [stepper]              │ │
│  Reduced motion           [toggle] ON · (uses prefers-)     │ │
│  High contrast tiles      [toggle] ON                       │ │
│  Subtitles/captions       [toggle] ON                       │ │
│  Transcripts for videos   [toggle] ON                       │ │
│  Assessment colour palette  Standard | Deuteranopia | P-N   │ │
│  Keyboard shortcuts        [toggle] ON (show map ▾ link)    │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

---

### Tab 7 — Tuition Settings  *(school admin only)*

```
│  Tuition Settings  · St. Mary's Girls High School            │
│  ┌──────────────────────────────────────────────────────────┐ │
│  Tuition feature (billing)   [View plan]  Pro ✓             │ │
│  Status:  Enabled via feature flag decimal_tuition · plan:  │ │
│  Pro · active (trial ends 3 Aug)                            │ │
│  ┌────────────────────────────────────────────────────────┐  │ │
│  │  Requirements gate:                                    │  │ │
│  │  ✓ decimal_tuition flag ON   ✓ plans.features.tuition  │  │ │
│  │  ✓ terms.is_current set      ✓ academic year active    │  │ │
│  └────────────────────────────────────────────────────────┘  │ │
│  Default programme enrolment policy  [Auto-allow ▾]          │ │
│  Student content approval (under-18 publishing)  [toggle] ON │ │
│  Allow parent follow-a-learner  [toggle] ON                  │ │
│  Zone/Region for network      Nairobi Zone B ▾               │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```
Reads `feature_flags` (key `decimal_tuition`, school-scoped) + billing entitlements. Shows disable-safe copy: "Students keep saved work; disabling blocks new enrolments only." Primary CTA: "Manage billing" → `/principal/billing`.

---

### Tab 8 — Permissions  *(principal + super_admin; read for teacher)*

```
│  Permissions                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  Row for tuition resources & actions                        │ │
│  resource ▾       principal  teacher  finance  secretary    │ │
│  tuition_programme  create    create    read     read       │ │
│  tuition_lesson     create    create    read     read       │ │
│  tuition_assessment create    create    read     read       │ │
│  tuition_activity   create    create    read     read       │ │
│  tuition_live       read      create    read     read       │ │
│  tuition_network    read      adopt     read     read       │ │
│  tuition_content    create    create    read     read       │ │
│  Legend: read/create/update/delete/publish/enrol/grade      │ │
│  [Add custom role row]      [Save changes]                  │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```
Backed by `permissions`/`role_permissions` seeds from `_context.md` §6.2. Edits write through the existing RBAC RPC. Teachers see read-only grid.

---

### Tab 9 — Integrations  *(school admin only)*

```
│  Integrations                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  ▸ M-Pesa Student Payments     Connected ✓  [Configure]     │ │
│    (optional; not part of billing gating)                   │ │
│  ▸ WhatsApp Class Broadcast    Not connected  [Connect]     │ │
│  ▸ Google Classroom bridge     P2 — roadmap                 │ │
│  ▸ Zoom / Meet live classrooms P2 — roadmap                 │ │
│  ▸ LMS export (SCORM/CSV)      P2 — roadmap                 │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```
MVP lists connections with `Not connected` states; only M-Pesa payment link is functional in P0/P1.

### Content & data
Per-tab form reads + writes: profiles, users, notifications table (type prefs), RBAC role_permissions, school_feature_flags, billing subscription. Each tab post is its own endpoint (`/api/tuition/settings/*`) wrapped in `createRoute`.

### Primary CTA
Per-tab "Save <entity>" (variant `tuition` for Tuition-coded tabs; `default` for Account). Save button shows Loader2 spinner while pending.

### Secondary Actions
Reset to defaults (Notifications, Learning Prefs), Manage sessions, View plan (Tuition tab), Add custom role (Permissions), Connect (Integrations).

### Permissions
Route protected; school tabs gated by `requirePermission(schoolId,"tuition_programme","create")`-level policy or role check (`principal`/`super_admin`). Non-principals get tabs removed (not disabled).

### Empty State
Tab slices render from live data server-side — empty means defaults shown (toggles "ON" set from defaults). Permissions with no rows (rare): empty row `colSpan={6}` message "No permission rows defined for this school yet."

### Loading State
`Skeleton` forms (inputs `h-9 bg-muted` ×6) per tab until hydration; tabs themselves render immediately.

### Error State
Save failure → inline destructive banner at top of form ("We couldn't save — try again.") per `03-design-system.md` §9; field-level `border-destructive` + text for validation.

### Success State
Per-form inline emerald banner "Saved." + toast for quick toggles.

### Mobile Behavior
Tabs → horizontal scroll (sticky); forms single column; toggles full-width rows h-12; steppers larger.

### Accessibility
- All toggles real `<button aria-pressed>` or switch with `role="switch"`.
- Tabs keyboard/arrow navigable; `aria-selected`.
- Contrast: `text-muted-foreground` legends ≥ 4.5:1.
- Focus-visible preserved everywhere.

### Related Screens
SYS-04 hub, SYS-03 notifications, BILL-01 gating, `_context.md` §4 RBAC, §6.2 permission seeds.

---

# Part B — Authentication & onboarding integration

> Model: **single auth, product-agnostic.** Decimal owns one Supabase auth; both School Management and Tuition render the same auth screens. Tuition never has its own password store. A student landing from the app/desktop/PWA hits the same login; afterwards, if the account has no resolved role, they're routed into tuition onboarding/school-picker.

---

## Login  (ID: AUTH-01)

### Purpose
Authenticate a user who arrived at Tuition (deep link, PWA, desktop). Reuses the existing `(auth)` login; adds tuition-aware return path + student identity resolution.

### User
Un-authenticated visitor; also used to re-auth a student whose identity is only in `students` (via `students.parent_user_id` or `tuition_student_users`).

### Route
`/login?next=/tuition` (also `/tuition/...` deep). After success: resolve identity → if single role, land on portal root (student → `/tuition`); if multiple roles/schools, → `/tuition/role-select` (AUTH-02).

### Navigation
From landing "Sign in", from any tuition protected path (middleware redirect), from session-expired overlay.

### Layout
```
AUTH-01  LOGIN  (shared surface)
┌───────────────────────────────────────────────┐
│                    ● DECIMAL                   │
│          Tuition · Teach, learn & grow         │
│                                               │
│            Sign in to continue                 │
│  ┌───────────────────────────────────────────┐ │
│  │  Email  kamu@omail.ke                     │ │
│  ├───────────────────────────────────────────┤ │
│  │  Password  •••••••••••          [Forgot?] │ │
│  ├───────────────────────────────────────────┤ │
│  │  [ Sign in with tuition accent  ]         │ │
│  │  [ Continue with Google         ]         │ │
│  └───────────────────────────────────────────┘ │
│  New to Decimal?  [Create account]             │
│  Parent/student switch hint: "Sign in with the │
│  same account your school gave you."           │
└───────────────────────────────────────────────┘
```

### Components
Existing auth components; `Button variant="tuition"` for primary sign-in. Turnstile captcha preserved from AGENTS.md stack.

### Content & data
Email + password (or Google OAuth). Client: none. Server: `signInWithPassword` → supabase SSR. Then identity resolution: try `school_members` role map; fallback `students` (parent_user_id / tuition_student_users); build tuition role.

### Primary CTA
"Continue" — on success routes via `next` (default `/tuition` for tuition-origin, `/dashboard` for school-origin).

### Secondary Actions
"Forgot password?" (→ AUTH-03), "Continue with Google", "Create account".

### Permissions
Public. Rate-limited per Supabase policy + Turnstile.

### Empty State
N/A.

### Loading State
Button → `Loader2` spinner + "Signing in…".

### Error State
- Invalid credentials: inline banner `data-error` "Invalid email or password. Try again, or reset your password."
- Account unconfirmed: "Check kamu@omail.ke to verify your email before signing in." → resend link.
- Turnstile fail: captcha error inline.

### Success State
Redirect to `next` (or role-select). Redirecting screen anti-flash: preserve-brand spinner page.

### Mobile Behavior
Same single column; inputs h-12; keyboard types.

### Accessibility
Labels + `aria-invalid`; error announcements `role="alert"`; focus on first error field.

### Related Screens
AUTH-02, AUTH-03/04, AUTH-05, SYS-01.

---

## Post-Login Role/School Selection  (ID: AUTH-02)

### Purpose
When an account maps to multiple roles or multiple schools (incl. a `tuition_student_users` student row + a `school_members` staff row), let the user pick their active context. Modelled on the existing school-picker pattern (school switch = full page redirect) but extended to choose a *role persona* too.

### User
Multi-role / multi-school users. Single-context users skip this entirely.

### Route
`/tuition/role-select` (return-path aware via `?next=`).

### Navigation
Reached after login (AUTH-01) whenever the identity resolver returns ≥2 contexts; skipped entirely for single-context users. Return path preserved in `?next=` so session expiry mid-flow can resume. Rows navigate with a full page redirect (school switch convention).

### Layout
```
AUTH-02  CHOOSE CONTEXT
┌────────────────────────────────────────────────┐
│  Welcome back, Kamau                            │
│  Choose a role for this session                 │
├────────────────────────────────────────────────┤
│  NAIROBI INTERNATIONAL SCHOOL                    │
│  ┌──────────────────────────────┐               │
│  │ 🎓 Student — Gr 9 Mathematics │ ►            │
│  ├──────────────────────────────┤               │
│  │ 📚 Teacher — Maths Dept      │ ►            │
│  └──────────────────────────────┘               │
│  MWEZI ACADEMY                                   │
│  ┌──────────────────────────────┐               │
│  │ 🎓 Student — Gr 11 Science   │ ►            │
│  └──────────────────────────────┘               │
│  Remember my choice  [toggle]                    │
└────────────────────────────────────────────────┘
```
Row = school chip (`Avatar` initials + name) + persona pill (role label) + chevron → full page redirect to that product root (school role → `/dashboard`-family portal root; tuition role → `/tuition`).

### Components
Sectioned list card (sectioned table card recipe), `Avatar`, `Badge` for role pills, `Switch`/toggle for "Remember my choice". Persona icons from role map (`GraduationCap` student, `Library` teacher, `LayoutDashboard` admin, etc.).

### Content & data
Server-passes the resolved context set: `{ school: {id,name}, roles: [{role, portalRoot}] }` from `school_members` + `students`/`tuition_student_users` resolution. "Remember my choice" writes `profiles.active_school_id` + a `tuition_active_role` profile field so future logins skip the picker.

### Primary CTA
Row tap (redirect). 

### Secondary Actions
"Sign out"; "Use School Management instead" link.

### Permissions
Only contexts the account can actually access are listed. Zero contexts → impossible state, redirect to home + support prompt (never an empty dead-end).

### Empty State
Not applicable by design; zero-context accounts redirect with a help card (see Permissions).

### Loading State
`Skeleton` rows (school chip + persona bar) 4× while the resolver loads the context set.

### Error State
Resolution failure → destructive banner "We couldn't load your roles. Retry in a moment." + Retry + revisit AUTH-01.

### Success State
Redirect; selected context is reflected in header brand + nav (SYS-01). No toast (navigation is self-evident).

### Mobile Behavior
Rows `h-16` (≥44px touch); school header row sticky; "Remember my choice" full-width toggle row.

### Accessibility
Rows are `<Link>`-wrapped full-area focus targets; `aria-describedby` persona label; contrast for `text-muted-foreground` meta; focus-visible ring preserved.

### Related Screens
SYS-01 (switching replaces repeated role-select), AUTH-06 (invite acceptance feeds this list), AUTH-01.

---

## Forgot Password  (ID: AUTH-03)

### Purpose
Let a Tuition user reset a forgotten password through the shared Decimal auth (product-agnostic — the same flow serves School Management). Product-coded copy switches on return path (`/tuition`).

### User
Authenticated-or-returning user who cannot sign in; also reached from Tuition login "Forgot?".

### Route
`/auth/forgot?next=/tuition` — Tuition-mutated variant of the shared auth screen.

### Navigation
From AUTH-01 "Forgot?" link. After submit → static confirmation card → "Back to sign in" link.

### Layout
```
AUTH-03  RESET PASSWORD REQUEST
┌───────────────────────────────────────────────┐
│                    ● DECIMAL                   │
│          Tuition · Teach, learn & grow         │
│                                               │
│             Forgot your password?              │
│  ┌───────────────────────────────────────────┐ │
│  │  Email  kamu@omail.ke                     │ │
│  └───────────────────────────────────────────┘ │
│  [ Send reset link (tuition variant) ]        │
│  [ Back to sign in ]                          │
└───────────────────────────────────────────────┘
```

### Components
Shared auth frame; canonical input; `Button variant="tuition"` on the SVG render for tuition-origin flows, `default` for school-origin. Turnstile preserved.

### Content & data
Email → `resetPasswordForEmail` with `redirectTo: /auth/reset?timestamp=…`. Server records request time for abuse throttle (existing policy).

### Primary CTA
"Send reset link" — spinner `Loader2` on submit.

### Secondary Actions
"Back to sign in"; "Create account" link when no account.

### Permissions
Public; no account enumeration (same response whether or not email exists).

### Empty State
N/A.

### Loading State
Button spinner + "Sending…".

### Error State
Delivery/rate-limit failure → inline banner "We couldn't send the reset link. Try again in a few minutes." 

### Success State
Static card (no email enumeration): "If an account exists for kamu@omail.ke, a reset link is on its way. Check your inbox and spam folder." Button "Done".

### Mobile Behavior
Single column; input h-12; keyboard focus on open.

### Accessibility
Associated label + `aria-describedby` helper; `role="alert"` for error; result is announced.

### Related Screens
AUTH-01, AUTH-04.

---

## Reset Password  (ID: AUTH-04)

### Purpose
Satisfy a valid reset token and set a new password, then sign in and return to Tuition.

### User
User with a live reset link.

### Route
`/auth/reset?token=…&next=/tuition`.

### Navigation
From email link; after success → auto sign-in → redirect to `next` (AUTH-02 only if now multi-context).

### Layout
```
AUTH-04  SET NEW PASSWORD
┌───────────────────────────────────────────────┐
│            Choose a new password               │
│  ┌───────────────────────────────────────────┐ │
│  │  New password   ••••••••••   (min 8, 1 cap│ │
│  │  Confirm         ••••••••••                │ │
│  └───────────────────────────────────────────┘ │
│  [ Save password (tuition variant) ]           │
└───────────────────────────────────────────────┘
```

### Components
Shared auth frame; two canonical password inputs with reveal toggles; validator (min 8, mixed case, per `_context.md` convention).

### Content & data
Token from query → `resetPassword(token, newPassword)` → `signInWithPassword` → session. 
### Primary CTA
"Save password" — spinner during reset.

### Secondary Actions
"Back to sign in".

### Permissions
Token-scoped, single-use.

### Empty State
N/A.

### Loading State
Button spinner + "Saving…".

### Error State
- Expired/invalid token: destructive banner "This reset link has expired — request a new one." + link to AUTH-03.
- Validation: inline `border-destructive` + message per field ("Password needs at least 8 characters.").

### Success State
Emerald banner "Password updated." + auto sign-in redirect to `next`; anti-flash brand spinner during redirect.

### Mobile Behavior
Single column; password inputs h-12; reveal icon ≥32px.

### Accessibility
Labels, `aria-invalid`, password requirement live region, focus on first invalid field.

### Related Screens
AUTH-01, AUTH-03, AUTH-07.

---

## Email Verification  (ID: AUTH-05)

### Purpose
Verify a new or re-confirmed email address before granting full Tuition access; handles the "account unconfirmed" login error for tuition sign-ups.

### User
New account holder or email-change pending verification.

### Route
`/auth/verify?token=…&email=…&next=/tuition`.

### Navigation
Email link → verification screen → auto-redirect to `next` `/tuition`; also reached from AUTH-01 "verify email" resend path.

### Layout
```
AUTH-05  VERIFY EMAIL
┌───────────────────────────────────────────────┐
│                    ● DECIMAL                   │
│        Verifying kamu@omail.ke…                │
│         (spinner ⟳)                            │
│  ┌───────────────────────────────────────────┐ │
│  │  success: ✓ Email verified!               │ │
│  │  Redirecting to Tuition…                  │ │
│  └───────────────────────────────────────────┘ │
│  [ Resend verification email ]  (only on error)│
└───────────────────────────────────────────────┘
```

### Components
Shared auth frame; `Loader2` pending; emerald success card (`CheckCircle` in `rounded-full bg-emerald-100` + "Redirecting…" per `03-design-system.md` §9).

### Content & data
`verificationEmailOtp`/token to supabase; read `next`. Already-verified is idempotent.

### Primary CTA
None on success (auto-redirect after 1.5s). On failure: "Resend verification email".

### Secondary Actions
"Back to sign in".

### Permissions
Token-scoped; public page, email-linked.

### Empty State
N/A.

### Loading State
`Loader2` + "Verifying your email…" while token resolves.

### Error State
Invalid/expired token → destructive banner "This verification link has expired — request a new one." + resend flow. Delivery failure on resend → banner.

### Success State
Emerald card "Email verified! Redirecting to Tuition…" auto-route.

### Mobile Behavior
Single column; card padding comfortable (p-8).

### Accessibility
`role="status"` for verification progress; screen readers announce success; focus on card.

### Related Screens
AUTH-01 (unconfirmed login), AUTH-06 (invite verify chain).

---

## School Invitation Acceptance  (ID: AUTH-06)

### Purpose
Allow a person invited into a school's Tuition (school member role, instructor, or student-account link) to accept the invitation after signing in. Uses the existing `invitations`-style flow extended for tuition personas.

### User
Teacher invited by principal to teach programmes; student joining a school programme; parent given read/write link.

### Route
`/tuition/invite/accept?token=<jwt>` (or canonical `/invitations/accept` reused with tuition context).

### Navigation
From invitation email link; after accept → success state → redirect to Tuition (or AUTH-02 when multi-context). Decline → confirmation → `/tuition` home.

### Layout
```
AUTH-06  ACCEPT INVITATION
┌────────────────────────────────────────────────┐
│  You've been invited!                           │
│  ● St. Mary's Girls High School                │
│  Role:  Tuition Teacher · Mathematics          │
│  School invited by:  Principal J. Otieno       │
├────────────────────────────────────────────────┤
│  [ Accept invitation  ]   [ Decline ]          │
│  Signed in as kamu@omail.ke  (switch account? )│
└────────────────────────────────────────────────┘
```

### Components
Sectioned card, `Avatar`, `Badge` (role), school identity block; accept uses `Button variant="tuition"`; decline `ghost` triggering a destructive confirm modal ("Decline invitation?" — `_context.md` §7 destructive recipe).

### Content & data
Token payload → invite row (school, role, inviter). POST accept: creates `school_members(user_id, school_id, role, is_active=true)` for staff roles, or links `students` row via `tuition_student_users`; duplicate-safe (idempotent, `UNIQUE(user_id, school_id, role)`). Decline: void the token.

### Primary CTA
Accept — spinner → success screen "Welcome to St. Mary's! Loading your Tuition…" → `/tuition` (or role-select).

### Secondary Actions
Decline (destructive confirm); "Switch account" (→ AUTH-01 for a different identity).

### Permissions
Token-scoped; single-use; 7-day expiry with "Request a new invitation" banner + copy to inviter. Inviter must still be `is_active`.

### Empty State
N/A (invalid token renders the Error State instead).

### Loading State
Skeleton header + action bar while token resolves.

### Error State
Invalid/expired token → destructive banner "This invitation is invalid or has expired." + "Request a new invitation" (notifies inviter). Already-accepted → "You're already part of this school — let's go." → CTA to `/tuition`.

### Success State
Emerald card "Welcome aboard! Redirecting to your Tuition…" auto-route.

### Mobile Behavior
Full-height stack; school block prominent; buttons full-width on <sm.

### Accessibility
Role/labels on action buttons; `role="alert"` for expiry; contrast for school meta.

### Related Screens
AUTH-02, AUTH-05, SYS-04 profile (new member sees school on profile).

---

## Session Expired Handling  (ID: AUTH-07)

### Purpose
Graceful re-auth when the Supabase session lapses mid-Tuition (assessment, player, or idle), without losing in-progress state.

### User
Any authenticated Tuition user whose session expires while on a tuition screen; critical on `take` (assessment) and `learn` (player) routes.

### Route
No route — a global overlay reacting to session state. Resume URL derived from current `pathname` (+interstitial params for assessments).

### Navigation
- API 401 from any tuition route → overlay (AUTH-01 next framed with resume URL).
- SSR session check fail on navigation → middleware redirect to `/login?next=<current>`.
- Long-idle countdown on `take` screens: 5-min warning banner with "Continue" reset.

### Layout
```
SESSION EXPIRED (overlay, modal recipe)
┌────────────────────────────────────────────┐
│  Session timed out for your security.      │
│  Your assessment answers are saved.        │
│  [ Sign in again  ]   [ Discard changes ]  │
└────────────────────────────────────────────┘
```

### Components
Modal per `_context.md` §1 recipe; `role="alert"`; idempotent resume URL builder; autosave flush helper (writes to `LessonProgress`/attempt buffer then IndexedDB queue before showing).

### Content & data
No data fetch — reads auth state. Autosave buffer flushed on trigger (existing sync patterns `sync.ts`/`db.ts`).

### Primary CTA
"Sign in again" (routes AUTH-01 with `next` = resume URL).

### Secondary Actions
"Discard changes" (destructive confirm only when unsaved work exists); "Continue" on idle banner (refreshes the 5-min timer).

### Permissions
Public endpoint (re-auth). State preserved server-side under the session's user.

### Empty State
N/A (modal path conditionally rendered).

### Loading State
During re-auth navigation: existing anti-flash brand spinner.

### Error State
Re-auth fails → banner within AUTH-01 (see AUTH-01 Error State); resume URL preserved.

### Success State
Session restored → redirect to resume URL; autosaved answers restored in-place (assessment/navigating scroll position).

### Mobile Behavior
Same modal `mx-4`; on `take` the timer stays visible behind the overlay (does not tick).

### Accessibility
Modal focus-trap; Survivors announce via `role="status"`; timer warning `role="status"` at 5 min and 1 min.

### Related Screens
AUTH-01, Part G Errors (session expired), `_context.md` §4 auth config.

---

# Part C — Billing integration

## Billing Integration  (ID: BILL-01)

### Purpose
Sit Tuition inside the existing billing architecture with **zero new billing infrastructure**: feature flag `decimal_tuition` (school-scoped, master switch) + `plans.features.tuition` for plan-level entitlement. School-level subscription only — no per-student billing in MVP. Show unambiguous upsell gating inside Tuition.

### User
School-level decision-makers (principal → upgrade/downgrade) and every Tuition role subject to gating (teacher, student, parent see gate/awareness states). Finance sees read-only billing + usage.

### Route
The billing *surface* stays entirely in existing School Management:
- Plans: `/principal/billing/plans` (add a Tuition row to the feature comparison).
- Billing summary: `/principal/billing` (add a "Decimal Tuition" line item + usage metrics card).
- Upgrade/downgrade path unchanged: `POST /api/billing/checkout` (M-Pesa phone modal flow), `/api/billing/subscription`.

### Navigation
- Tuition screens gate → `[Upgrade to Pro →]` → `/principal/billing/plans`; "See plans & pricing" → same page pre-scrolled to the comparison table.
- `/principal/billing` links back to Tuition via header switcher (SYS-01) once enabled.
- Billing sidebar "Plans" reachable from school Tuition dashboard usage card ("View plans" chip).

### Layout
#### Upsell gate (rendered on tuition screens for gated schools)

### Gating truth table (enforcement order)
| Check | Source | Outcome |
|---|---|---|
| Active sub (`trialing/active/past_due`) | `requireActiveSubscription(schoolId)` | else SubscriptionRequired → billing upsell banner |
| `feature_flags.decimal_tuition` on | `isFeatureEnabled("decimal_tuition")` | else "not yet enabled" banner + enable request to platform |
| `plans.features.tuition === true` | `requireBillingPlanFeature(schoolId,"tuition")` | else **"Decimal Tuition requires the Pro plan"** upsell |

Enforcement: `requireBillingPlanFeature` (guard.ts:29) already chains sub-active + feature. Every tuition server route calls it; pages that can render read-only may soft-gate (banner) instead of hard-block.

### Layout — Upsell gate (rendered on tuition screens for gated schools)
```
GATING STATE (not enrolled plan, tuition unavailable)
┌──────────────────────────────────────────────────────────────┐
│  ● DECIMAL ▾   │ (Tuition rail dimmed)                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ▣  Decimal Tuition requires the Pro plan                 │ │
│  │    Your school's Starter plan doesn't include Tuition.   │ │
│  │    Enable Teach · Learn · Assess & Network for every     │ │
│  │    student. Students keep saved work if you later        │ │
│  │    downgrade.                                            │ │
│  │    [ Upgrade to Pro  → ]   [ See plans & pricing ]       │ │
│  └─────────────────────────────────────────────────────────┘ │
│  Preview (read-only, teased):                               │
│  ▹ Learn card mock · ▹ Assess mock · ▹ Network mock          │
└──────────────────────────────────────────────────────────────┘
```
- "Upgrade to Pro →" → `/principal/billing/plans` (M-Pesa flow). "See plans & pricing" → same, pre-scrolled to comparison table (highlight Tuition row).
- A soft gate allows principal to see the dashboard shell with usage teaser; everyone else sees gate only. Content creation actions are disabled everywhere (see G-Permissions disabled actions).
- Wording rules: never claim students "lose data"; state downgrade = block new enrolments, freeze existing.

#### `/principal/billing` subscription overview line item
```
Subscription · St. Mary's Girls High School
┌──────────────────────────────────────────────────────────────┐
│ Current plan   Pro · KES 12,500/mo (annual, save 20%)        │
│ Renewal        1 Mar 2027 · M-Pesa +254 722 000 000          │
│ Line items:                                                  │
│   ▸ School Management                     KES 12,500/mo       │
│   ▸ Decimal Tuition  ✓ included (Pro)    KES 0  [included]   │
├──────────────────────────────────────────────────────────────┤
│ Decimal Tuition usage — (this period)                        │
│   Active programmes   3 /  ∞   (Pro unlimited)  ━━━━━━━━━━━  │
│   Enrolled students 1,204 / ∞   ━━━━━━━━━━━━━━━━━━           │
│   Assessments run       8 / ∞   ━━━━━━━━━━━                  │
│   Network benchmarks    2 / 4  per term  ·  [View plans]     │
│  (Free/Starter show n/m limit bars + Upgrade CTA)            │
└──────────────────────────────────────────────────────────────┘
```
Usage metrics computed from actual DB counts (like `usage.ts`) sourced from new tuition tables: `active programmes` = count(`programmes where status='published'`), `enrolled students` = distinct `programme_enrolments.student_id where status in ('active','invited')`, `assessments run` = count published with attempts, `network benchmarks` = school participation rows this term. Limits live in `plans.features`-adjacent JSON or a per-plan `tuition_limits` JSON added by migration (defaults: Free 0, Starter 0, Pro unlimited, Enterprise unlimited; network benchmark `4/term`).

### Upgrade / downgrade path
- Upgrade: existing `/principal/billing/plans` card grid; M-Pesa phone modal; `handlePlanSelect` → `/api/billing/checkout` → on receipt, `plans.features.tuition` flip is automatic (plan change) + `decimal_tuition` flag → the school's screens gate-lift the next request (5-min Redis cache; revalidate). Success toast "Subscription upgraded!" redirect to `/principal/billing`.
- Downgrade from Pro → Starter: keep entitlement until period end if `cancel_at_period_end`; banner in Tuition "Tuition stays active until 1 Mar 2027, then requires Pro." Termination mode (immediate) blocks new content + enrolments but preserves data.
- Invoices: already central `/principal/billing` invoice list; a tuition-created line or M-Pesa reference appears as normal invoice rows (billingReason). No separate invoice UI.

### Feature comparison table addition (`/principal/billing/plans`)
Add to `FEATURE_LABELS`: `tuition: "Tuition (Teach · Learn · Assess · Network)"`. Config change only — `plans.features.tuition` `true` on Pro + Enterprise, `false` on Free + Starter. Renders automatically once the row exists in the `plans.features` JSON for a plan (the table derives keys from the union). Markup for the row: highlight `text-tuition-accent` label + callout tag "New".

### Components
Reuse: billing pages as-is; `getEntitlements`, `requireBillingPlanFeature`, `requireFeature`, `checkLimit`. New: `TuitionGate` (banner + preview teaser), `TuitionUsageCard` (prose metrics), `FeatureGate` wrapper component abstracting enabled/disabled CTA states (Part G permissions).

### Content & data
- `plans.features.tuition` boolean; `feature_flags.decimal_tuition` school row.
- Usage metrics real-time DB counts: active programmes (`status='published'`), enrolled students (distinct `programme_enrolments.student_id` where `status in ('invited','active')`), assessments run (attempts), network benchmarks (school participation, capped per term).
- Subscription: plan slug, `billingInterval`, `status`, renewal date, M-Pesa phone — all existing `subscription` reads.

### Primary CTA
"Upgrade to Pro →" (principal only) → existing `/principal/billing/plans` checkout (M-Pesa phone modal). For non-principals the same panel shows "Contact your school admin".

### Secondary Actions
"See plans & pricing" (pre-scrolled comparison); "View plan" from usage card; "Enable for my school" (platform ticket) for the `decimal_tuition` flag edge case.

### Permissions
Billing views = School Management portal roles (`principal`, `finance` read). Tuition gate evaluated for all roles; only `principal` sees upgrade CTAs (teacher/student gate = "Contact your school admin" secondary text).

### Empty State
N/A for gate itself (always renders either usage or gate). Usage card empty period → "No Tuition usage this period yet."

### Loading State
Gate resolves server-side (auth sync) → static render; usage card `Skeleton` bars while metrics fetch.

### Error State
If billing/feature data fails to resolve: **fail closed** (gate renders, safe default) with muted "Couldn't verify entitlement — check back shortly." No bypass.

### Success State
Upgrade receipt → gate lifts, banner swap is instant on next nav (cache revalidate); `toast("Subscription upgraded!")` already in flow. 

### Mobile Behavior
Upsell banner becomes full-width stack; CTAs column; usage bars full width.

### Accessibility
- Gate `role="dialog"`-free (it's a page banner) but aria-live polite.
- Comparison table row focusable; `aria-label` "Tuition feature".
- Colors: `text-tuition-accent` used as annotation only; body remains default.

### Related Screens
`/principal/billing`, `/principal/billing/plans`, SYS-05 tuition settings tab, Part G permission/error canon.

---

# Part D — Modals — vertical slice wireframes

> Modal recipe (exact, must match everywhere): `fixed inset-0 z-50 flex items-center justify-center` → `absolute inset-0 bg-black/50` (backdrop click = close unless blocking) → panel `relative bg-card rounded-xl shadow-xl w-full max-w-md mx-4 ring-1 ring-foreground/10` → header (title `font-heading text-base font-medium` + X `ghost icon-sm`) → body `p-6 space-y-4` → footer `flex justify-end gap-2 p-4 border-t border-border`.
> Buttons: Tuition-primary actions use `variant="tuition"`; neutral saves `default`; destructive `destructive`. Blocking = no backdrop close while submitting; all non-destructive close on `Esc`. Validation inline (`border-destructive`, `text-xs text-destructive`).

### D-01 — Create Programme
Fields: Name (`text`, required), Short description (`textarea min-h-24`, required), Subject (select from `subjects`), Grade (multi-select from `grades`), Difficulty (segmented beginner/intermediate/advanced), Colour/cover (upload or gradient pick), Visibility (radio: private/school/classes/students/network/public — hidden until Step 4 but defaulted here). Footer: Cancel (outline) / "Create draft" (tuition) — saves `status=draft`, `is_published=false`, routes to `/tuition/teacher/programmes/[id]/edit`. Validation: name ≥ 3 chars; grade required on publish-only (draft OK without); server 409 on `UNIQUE(school_id, name)`.

### D-02 — Edit Programme
Panel loads programme; fields same as D-01 with `archived` handling disabled (archive via manage page). Footer: Cancel / "Save changes" (tuition) with dirty-state guard (un-saved warning `confirm()` on backdrop close). Saving preserves status; publishing moves to D-15.

### D-03 — Delete Programme  (destructive confirm)
Body: `TriangleAlert` icon (destructive tint), headline "Delete “Maths Prep: Quadratics”?", copy "This removes the programme, its modules, lessons and questions. Student progress is permanently deleted. This can't be undone." Input challenge: type the programme name to arm the button (`value === name`). Footer: Cancel / "Delete programme" (destructive, disabled until challenge). On confirm: `destroy`; success route → `/tuition/teacher/programmes` with toast "Programme deleted." Locked when enrolment > 0 → message "You can't delete a programme with enrolled students. Archive it instead."

### D-04 — Enrol Student
Select student (search by name/adm no from enrolled-valid school students, min 2 chars debounce), role default Student, date join (default today), Cohort (optional select). Creates `ProgrammeEnrolment` `status='invited'`. Footer: Cancel / "Send invite" (tuition) — inviting sends notification. Optional checkbox "Auto-activate (skip invite)". Validation: student not already active in programme → inline warn chip "Already enrolled."

### D-05 — Invite Teacher
Teacher identity: existing staff picker (search `staff` — name/email), or "Invite by email" input (creates pending member). Role select (Teacher / Instructor). Message (optional, `max 240`). Footer: Cancel / "Send invitation" (tuition). Success: toast + row appears in `/tuition/school/teachers`.

### D-06 — Assign Teacher (to programme/module)
Pick teacher from school staff (search) → role chip (Lead / Co-teacher) → scope chips: entire programme (default) or specific modules. Footer: Cancel / "Assign" (tuition). Validation: conflict message if assignment overlaps an active teaching slot "Mr. Kimutai teaches Gr 9 Maths on Tue — assign anyway?" (secondary confirm).

### D-07 — Create Assessment
Fields: Title (required), Description, Type segmented (MCQ-only for MVP), Source (question bank / fresh), Programme (select), Audience (class-level select — Grade+Stream), Window: Open date+time / Close date+time (native date inputs), Duration (minutes), Weight (% of course, 0–100), Publish results after close (toggle), Restrict navigation (toggle, default ON). Footer: Cancel / "Save draft" (outline) / "Save & go to builder" (tuition) → `/tuition/teacher/assessments/new?id=…`. Validation: close > open; duration ≥ 5; weight ≤ 100.

### D-08 — Publish Assessment
Confirm sheet: title, audience ("Grade 9 Yellow · 42 students"), window preview ("12 May 09:00 → 14 May 23:59 EAT"), duration ("60 min"), question count ("20 Q · 100 marks"). Warning if questions < 5: "Only 4 questions — consider adding more before publishing." Footer: Cancel / "Publish assessment" (tuition) → sets `status='scheduled'` (window future) or `open` (window started), sends notifications to enrolled students. Success toast + deep-link copy.

### D-09 — Submit Assessment  (student confirm)
"Submit “Gr 9 Maths Ass 2” now?" + summary card: answered `18/20`, flagged `2`, time left `0:42`. Unanswered alert: "You have 2 flagged questions." Footer: "Keep working" (outline) / "Submit" (tuition). On submit, second step auto-shows (blocking, no close): spinner → success card (emerald) "Submitted — redirecting to your results…" → `/tuition/assessments/[id]/result`.

### D-10 — Create Activity
Fields: Title (required), Type (select: workshop/sports/club/debate/competition/trip), Programme optional, Date+Time, Venue (text), Max participants (number), Description (`textarea`), Organiser (default teacher). Footer: Cancel / "Save as draft" (outline) / "Create & open registrations" (tuition) → `status='registrations'`, notifies. Validation: date in future; max ≥ 1.

### D-11 — Join Programme
Shown from Explore/Programme detail. Header: programme cover + title + teacher. Copy: "This programme starts 3 Feb. Free to join — your school covers tuition. You'll receive 4 lessons/week & 2 assessments/term." Consent checkbox under-18: "I have permission from my guardian" (required when age < 18). Footer: Cancel / "Join programme" (tuition → sets active enrolment, add to My Learning, toast "Welcome to Maths Prep!"). If already enrolled → button becomes "Go to My Learning".

### D-12 — Leave Programme
Destructive-ish confirm (not red? — it IS a drop, treat destructive): "Leave “Science & Society”? Your progress (62%) is kept for 30 days if you rejoin. Your lessons and assessments are paused." Footer: Cancel / "Leave programme" (destructive) → enrolment `status='dropped'`; success toast.

### D-13 — Upload Resource
Dropzone card (`FileDropzone`, `border-dashed`, accept `video/pdf/document/audio/image/presentation/link/embed`), Title (auto from filename, editable), Type (auto-detect, override select), Folder (content library folder), Lesson attach (optional), Visibility (follows programme scope; override chips), Captions (accept `.vtt` when type=video). Footer: Cancel / "Upload" (tuition) — progress bar per file; success list + "Add more". Error: file > 250 MB → inline; unsupported type → reject chip.

### D-14 — Share Resource
URL copy card (primary link), deep-link copy, access scope chips (programme-specific / school / network-public), invite-by-email row (optional). Footer: Done / "Share" (tuition) → toast "Resource link copied." Per-role visibility enforced on open.

### D-15 — Publish Programme
Step 4/5 confirm surface: visibility scope radio (private/school/classes/students/network/public) + consent "Publish to the Decimal network? Other schools can adopt your programme. You can unpublish any time." Review list: modules ×1, lessons ×8, resources ×5, assessments ×2. Requirement ticks: ✓ ≥1 module ✓ ≥3 lessons ✓ cover set. Footer: Cancel / "Publish" (tuition) → `status='published'`, `is_published=true`; if scope=network notify network coord; toast "Programme published ✓".

### D-16 — Adopt Network Assessment  (school)
Benchmark card: title, source school, zone, window, cohort size, format. Copy "Adopting runs the same assessment on your students for direct comparison. Your student names stay private — you only see your own + aggregate network." Calendar mirror option (same window vs my window). Footer: Cancel / "Adopt & schedule" (tuition) → creates local `status='scheduled'` linked to network assessment; success toast.

### D-17 — Create Event (school/activities)
Fields: Title (required), Type (curricular/extracurricular/benchmark), Date+time, Venue, Zone (for network), Target (grade/stream classes), Programme link optional, Registration deadline. Footer: Cancel / "Create event" (tuition) → event created (school `/tuition/school/events`), notify target. Validation: end ≥ start; deadline ≤ start.

### D-18 — Cancel Event
Destructive confirm "Cancel “Inter-house Athletics Trials”? All 12 registrations will be released." Challenge-free (single confirm is enough — medium-destructive) but explicit copy; Footer: Cancel / "Cancel event" (destructive) → `status='cancelled'`; notify registered students + toast.

---

# Part E — Drawers (Sheets)

> Sheet recipe: `SheetContent` side **right**, `sm:max-w-sm`, overlay light `bg-black/10 backdrop-blur-xs` (existing). Header row with title + X (ghost icon-sm); body `p-4 space-y-4 overflow-y-auto`; footer sticky `p-4 border-t border-border` when actions present.

### E-01 — Filters Drawer
Opened from Explore, teacher content, school students/enrolments, analytics, network lists.
```
┌───────────────────────┐
│ Filters          [×]  │
│───────────────────────│
│ Grade     [Gr 9 ▾]    │
│ Subject   [Maths ▾]   │
│ Status    ○ all ● pub │
│            ○ draft    │
│ Level     [＋ advanced│
│            chips]     │
│ Content   [video ✓ pdf✓│
│            docs ◯]     │
│ Region (network) [Zone B]│
│───────────────────────│
│ [Clear all]  [Apply (42)]│
└───────────────────────┘
```
Each field mirrors filters visible on the page; "Apply (n)" reflects filtered count; chips persist via URL `?f=…`. Live count in trigger.

### E-02 — Student Details Drawer
Trigger: student row anywhere (teacher/enrolment/school). Content: avatar+name+grade/house meta, KPI mini-row (enrolments/avg score/attendance present), progress bars per programme (tuition-progress), quick actions (Message, View full profile `/tuition/profile/student/[id]`, Enrol another programme). Footer: [Message] [View profile]. Role-gated: teacher sees scores; parent sees limited.

### E-03 — Teacher Details Drawer
Avatar+name+subject+TSC badge; workload KPI (active programmes/students/classes); rating (public); quick actions (Message, Assign to programme, View profile). Footer: [Assign] [View profile]. Assign → swaps to E-teacher-assign drawer without closing animation (single panel swap).

### E-04 — Programme Preview Drawer
ProgrammeCard expanded: cover, title, teacher avatar row, meta chips (grade/level/scope), description (clamped 4 lines), module list (compact, first 3 + "…"), rating, students count. Footer CTA per role: Student → [Join programme] / [View detail]; Teacher → [Manage].

### E-05 — Notifications Drawer (quick)
Reuses SYS-03 mini layout: 8 rows + "View all" footer; mark-all button header. Deep link rows.

### E-06 — Quick Actions Drawer
Role-specific action chips grid `grid-cols-2 gap-2`: Student (Join a programme, Take a quiz, Message teacher, View progress); Teacher (New programme, New assessment, Upload resource, Schedule class). Each = route/action. Pinned on teacher mobile (replaces floating bar). Keyboard opening documented in Part H.

### E-07 — Resource Preview Drawer
Content-type aware: video → `<video>` player chrome (captions on), pdf → embedded doc frame (height-limited + "Open full" link), image → `<img>`, link → preview card + domain, audio → audio player. Meta row: type icon + title + visibility scope + size. Download / Copy link secondary; "Open full screen" primary (opens `learn` route). Offline badge when queued for offline.

---

# Part F — Table system

> One reusable component: `TuitionTable` (`src/components/tuition/table`). Built on the sectioned table card recipe (`_context.md` §1) with a feature-complete toolbar. Backed by server pagination (like `super-admin/users` pattern) via tuition query params.

### Anatomy
```
┌─ TuitionTable ─────────────────────────────────────────────────┐
│ [Search]────────── ◯Status▾ ◯Level▾   [Columns▾]       [Export│
│ ┌─────────────── Toolbar (search + filters + visibility) ─┐   │
│  Student          Programme        Status      Score  ⋮       │
│ ──────────────────────────────────────────────────────────     │
│  Amani Otieno    Maths Prep: Qu…  active      82%   [⋮]       │
│  ▪ checkboxes…  ▪ sortable headers (chevrons) ▪              │
│  Zipporah Wangari Science & Soc…  invited     —     [⋮]      │
│  …                                                           │
│  ▸ Showing 12 of 1,204   ‹ 1 2 3 … 51 ›  50/page▾            │
└──────────────────────────────────────────────────────────────┘
```
- **Sorting:** clickable `th` emits ascend/descend chevron (`ArrowUp/Down` size-3.5, `text-muted-foreground` active = primary). Server-sorted columns only (whitelist per table config), URL persists `?sort=score&dir=desc`.
- **Filtering:** toolbar chips + per-column dropdown filters (status, grade, type). Mirrors E-01 drawer on mobile.
- **Search:** canonical search input, debounced 300ms, min 2 chars, on server.
- **Pagination:** `Showing {n} of {total}` + numbered controls + page size select `20/50/100`.
- **Column visibility:** `DropdownMenu` with checkbox items ("Columns: Student ✓, Programme ✓, Status ✓, Score ✓, Actions ✓"); persists in localStorage (`tuition.table.<key>`).
- **Bulk actions:** row checkboxes → sticky bulk bar replaces toolbar: "3 selected — [Enrol] [Export] [Remove]" (role-gated actions filtered). Bulk bar styled `bg-primary text-primary-foreground` when singular primary action, else `bg-card border`.
- **Row actions:** per-row `⋮` menu (View / Edit / Duplicate / Archive / Delete destructive) — role-filtered.
- **Selection:** shift-click range select; `aria-checked` checkboxes.
- **Export CSV:** "Export CSV" ghost button → server-generated file via `/api/tuition/export/...?kind=<table>&filters=…` (browser download; max 10k rows, async job + email for huge exports).
- **Mobile stacked-row fallback:** `<sm` each row renders as a bordered block: primary line (name), label/value pairs (Programme / Status / Score), action menu pinned top-right; table semantics preserved via hidden `caption`. **No horizontal scrolling when interactions matter** (per `03-design-system.md` §11).
- **Loading:** 6 skeleton rows (`animate-pulse`) + disabled toolbar controls; count only after load.
- **Empty:**
  - No data: `<td colSpan={N} className="p-8 text-center">` with contextual copy: `query ? "No X match your search." : "No X found. Add your first one to get started."`.
  - No-results-from-filter: "Nothing matches these filters — clear them to see all X."
- **States reuse:** `DataState` wrapper (loading/empty/error) around table body.
- **Accessibility:** `caption` sr-only (action label), `scope="col"` headers, sort buttons `aria-sort`, row selection announcements.

---

# Part G — States — the canon

> Every screen references these. Three-part rule for empties: **explain situation → explain what to do → provide CTA.**

## Empty states (3-part rule)
| Screen | Situation | What to do | CTA |
|---|---|---|---|
| No programmes (Explore/teacher) | "No programmes yet in this space." | "Create one or adjust your filters — great content starts small." | [New programme] / [Clear filters] |
| No assessments | "No assessments scheduled." | "Set up a quiz for your class when you're ready." | [Create assessment] |
| No students enrolled | "No students have joined this programme yet." | "Invite your class from the school roll." | [Enrol students] |
| No resources | "Nothing in the content library." | "Upload your first video, PDF or presentation." | [Upload resource] |
| No classes | "No live classes on the calendar." | "Schedule a class to go live later." | [Schedule class] |
| No network assessments | "Your school hasn't adopted a network benchmark this term." | "Adopt a common assessment for a fair zone comparison." | [Browse network] |
| No activities | "No activities have been posted." | "Create a workshop, club or sports day." | [Create activity] |

Empty visual: `EmptyState` component — faded icon `h-5 w-5 text-muted-foreground/40` + 2-line copy + CTA button (variant glow for hero empties, tuition otherwise).

## Loading states
- **Page:** target `Skeleton` per layout zone then content reveals progressively (server component pattern A — SSR shell + client hydrate). Never full-page spinner after SSR.
- **Card:** `h-40 rounded-xl bg-muted animate-pulse` per card in grid.
- **Table:** toolbar + 6 skeleton rows (`h-12`).
- **List:** 6 `h-10` rows.
- **Button:** child swap `Loader2 … animate-spin` + label keep (`disabled:opacity-50`).
- **Video lesson:** poster/cover + `h-4 w-2/3` skeleton bars; spinner only once buffering (respect `prefers-reduced-motion`).
- **Assessment:** silent — palette + timer render immediately; questions appear as skeletons ONLY first question while autosave initializes.

## Error states (What happened + What you can do)
Canonical banner: `rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive` + icon + period.
| Error | What happened | What you can do |
|---|---|---|
| Network error | "We lost our connection to the server." | "Check your connection and retry." [Retry] |
| Permission denied | "You don't have permission to do that here." | "Contact your school admin to request access." (role-appropriate) |
| Resource unavailable | "This resource was removed by its author." | "Explore similar programmes in the library." [Explore] |
| Assessment submission failure | "Your answers couldn't be submitted." | "They're safely saved on this device — retry now, or they'll sync when you're back online." [Retry]
| File upload failure | "The file didn't finish uploading." | "Check the file type and size (limit 250 MB), then try again." [Try again] |
| Video failure | "This video couldn't play." | "Try reloading, or play the transcript version." [Reload video] |
| Server error | "Something went wrong on our side." | "Please try again in a moment." [Retry] + report card |
| Invalid form | inline per-field `text-destructive` + banner | "Fix the highlighted fields and try again." |
| Session expired | (AUTH-07 modal) | "Sign in again to continue where you left off." |

## Permission states
- **Role-gated callout:** tinted info banner at top of actions the user can't take — e.g. parent on a teacher screen: `bg-tuition-accent/10 text-tuition-accent` "You're viewing as a parent — edits are disabled for your account."
- **Disabled actions with tooltips:** tooltip (inverted) on hover/focus of disabled button "Only the programme author can remove lessons." Buttons show `disabled:opacity-50` + `aria-describedby` pointing at the tooltip text. Never silently gray without explanation on focusable targets for touch (mobile uses caption text under the control).

## Offline states (PWA)
- **Offline banner:** reuse `SyncIndicator` — pill "Offline — changes will sync when you're back online." at header (and persistent on player).
- **Queued submissions:** assessment/assignment submit failing → enqueue via existing `sync.ts` pattern (IndexedDB `src/lib/db.ts`), show "Queued · will submit when online" chip + sync count badge from `useSyncQueueCount`; confirm submission locally with "Stored on this device" copy.
- **Cached lessons:** video/PDF lessons served from `NetworkFirst` cache; badge "Saved for offline" on previously-cached lessons; download manager surfaces cache usage + "Remove downloads".

---

# Part H — Responsive design

Binding breakpoints (existing Tailwind): `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280.

| Context | Desktop (≥lg) | Tablet (sm–lg) | Mobile (<sm) |
|---|---|---|---|
| **Student learning** | Player three-pane (lessons rail 288px · video · notes/tasks). Space rail visible. | Rail collapses to icon strip w-16; lesson list behind top-left drawer. | Player single-column; module list behind hamburger drawer; player chrome `lg` controls compacted; captions on. |
| **Assessment take** | Focused mode: question center + palette right 280px + sticky timer. | Timer + palette both sticky; question full width. | **Full isolation:** timer pinned top (small), palette becomes top row (horizontal chips), question single column; auto-submit at 0. |
| **Live classes** | Grid: video + side panel (chat/Q&A/polls). | Video top, chat below (2-col → 1-col). | Video full-bleed aspect-video; chat bottom sheet; raise-hand fixed FAB. |
| **Programme browsing (Explore)** | `grid-cols-2 xl:grid-cols-3` ProgrammeCards. | `sm:grid-cols-2`. | 1-col list cards; filters via E-01 drawer (no inline rail). |
| **Notifications** | Two-pane: list + detail (read) on hover expand. | Single pane w/ drawer for detail. | Single pane; rows h-16; tabs scroll. |
| **Teacher actions** | Toolbar always visible; tables dense (8-cols). | Tables scroll inside section card; actions into `⋮`. | Sidebar→bottom-sheet drawer; tables stacked rows (Part F); E-06 quick actions replaces toolbars. |
| **Admin tables** | Full TuitionTable with all columns. | Column visibility reduced by default (hide score-time drift); horizontal scroll permitted (read-heavy — `overflow-x-auto`). | Stacked rows, no horizontal scroll when actions matter; bulk bar full-width above list. |

Global reflow rules:
- Grids: KPI `grid-cols-2 lg:grid-cols-4 gap-4`; panels `grid-cols-1 lg:grid-cols-2 gap-6`; forms `grid-cols-1 sm:grid-cols-2 gap-4` (already canonical).
- Player content max-width `max-w-4xl`; admin screens full-width.
- Assessment suites & player hide ALL nav (exam isolation / immersive); back-only affordance.
- Touch targets ≥ 40px mobile (bottom bars h-14, icon buttons ≥ 32px w/ padding).
- Offline-first: downloads observable; banners sticky on mobile.
- Orientation: assessment + live class request portrait-friendly; landscape tolerated.

---

# Part I — Global navigation & product switcher consolidation

### Desktop header (shared `Header`)
```
┌────────────────────────────────────────────────────────────────────┐
│ ☰  ● DECIMAL ▾  │ SchoolMgmt · Tuition  │ (Tuition rail pills)    │
│ └─ Product switcher (SYS-01) drives both products ───────────┐   │
│ [⌕ Search Tuition ⌘K]  ⟳ SyncIndicator ○  ◐  🔔(3)  ● Avatar ▾  │
└────────────────────────────────────────────────────────────────────┘
```
Left cluster: hamburger (mobile), brand + `ProductSwitcher`, and the active product label; **space rail** (Learn/Teach/Assess/Activities/Network icons, `size-4`, active `bg-tuition-accent/10 text-tuition-accent` + dot) sits under the switcher in `TuitionShell`. Right cluster (existing order preserved): Search (tuition overlay — SYS-02 on tuition, school modal in school product), SyncIndicator, SyncConflictBadge, ThemeToggle, bell (SYS-03 preview, unread badge), avatar dropdown (Profile → SYS-04, Settings → SYS-05, Sign out).

Rules:
- Switcher is the single source of truth for product identity; header label always shows active product ("Tuition › My Learning").
- Navigation never logs out; school context persists; switching is pure routing (SYS-01).
- Protect: exact `pathname === href` active matching; navConfig stays static per role (`_context.md` — sidebar.tsx).

### Desktop sidebar (within Tuition product)
`TuitionShell` = PlatformShell geometry + rail: brand+switcher block (SYS-01) → main nav (role array from `02-information-architecture.md` §3–6, each `aria-current="page"`) → icon-only space rail (lg) → quick "+ New" pinned for teacher → footer (Profile/Notifications/Settings). Mobile `lg:hidden` hamburger opens the same as slide-over drawer (switcher first — SYS-01 mobile).

### Mobile navigation
- **Student bottom bar:** Home · Explore · My Learning (center, elevated) · Assessments · Activities — per `02-information-architecture.md` §7. Secondary (progress/profile/notifications/settings) behind rail drawer.
- **Teacher:** hamburger-drawer sidebar (same arrays), quick-actions via E-06.
- **Player/assessment:** full-screen immersive with back affordance only.

---

# Conventions index (what every formal spec above assumes)
- Page wrapper `space-y-6`; headers `h1 text-2xl font-bold` + `p text-muted-foreground mt-1`.
- Tuition hero CTAs = `variant="tuition"`; neutral = `default`; admin neutral stays `default`; glow reserved for marketing.
- `StatusPill` tone map per `_context.md` §7 exactly (programme/enrolment/lesson/assignment/assessment/activity/video states).
- Space dots: Learn=BookOpen (blue), Teach=Library (violet), Assess=ClipboardCheck (violet dark), Activities=Trophy (green), Network=Globe2 (amber).
- Currency/format: en-KE locale; prices KES (÷100). Timestamps Geist Mono `text-xs`.
- Offline/sync/feedback via existing tower: toast (`≤3s`), SyncIndicator, IndexedDB queues, `DataState`.