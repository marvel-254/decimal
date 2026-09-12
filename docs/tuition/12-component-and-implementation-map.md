# DECIMAL TUITION — SPEC FILE 12 — Component & Implementation Map

> Companion to `_context.md`, `03-design-system.md`, `04-screen-inventory.md`,
> `10-route-architecture.md`, `11-data-model.md`. This file is the single
> implementation contract: which components exist, where pages live, which API
> and DB objects each screen touches, how the builders persist, how gating and
> permissions wire in, and what is inconsistent or risky.
>
> Conventions enforced throughout (from `_context.md` §1): **no `asChild`**,
> `cn()` from `@/lib/utils`, Geist Sans/Mono via CSS vars, `@base-ui/react`
> primitives only, no SWR/React Query/axios, Recharts only, `toast(message)`
> string-only, `createRoute` for custom API handlers, SSR-data→client-child fetch
> pattern. All tuition components live under `src/components/tuition/`.

---

## PART 1 — Component Architecture (brief "Part 9")

### 1.1 Token additions (prerequisite for everything below)

Add to `src/app/globals.css` `:root` **and** `.dark`, plus `@theme inline` entries
so `bg-tuition-accent`, `text-tuition-assess`, `bg-tuition-activity/10` etc. are
real Tailwind utilities (values from `03-design-system.md` §2.2):

```css
@theme inline {
  --color-tuition-accent: var(--tuition-accent);
  --color-tuition-accent-foreground: var(--tuition-accent-foreground);
  --color-tuition-learn: var(--tuition-learn);
  --color-tuition-assess: var(--tuition-assess);
  --color-tuition-activity: var(--tuition-activity);
  --color-tuition-network: var(--tuition-network);
  --color-tuition-live: var(--tuition-live);
  --color-tuition-progress: var(--tuition-progress);
}
:root {
  --tuition-accent: oklch(0.52 0.21 280);
  --tuition-accent-foreground: oklch(0.985 0 0);
  --tuition-learn: oklch(0.60 0.15 255);
  --tuition-assess: oklch(0.52 0.21 280);
  --tuition-activity: oklch(0.648 0.15 160);
  --tuition-network: oklch(0.768 0.164 85);
  --tuition-live: oklch(0.623 0.16 255);
  --tuition-progress: oklch(0.648 0.15 160);
}
.dark {
  --tuition-accent: oklch(0.62 0.22 285);
  --tuition-accent-foreground: oklch(0.985 0 0);
  --tuition-learn: oklch(0.62 0.14 255);
  --tuition-assess: oklch(0.58 0.20 285);
  --tuition-activity: oklch(0.66 0.14 160);
  --tuition-network: oklch(0.76 0.15 85);
  --tuition-live: oklch(0.66 0.15 255);
  --tuition-progress: oklch(0.66 0.14 160);
}
```

Shared types used by every component below live in
`src/components/tuition/types.ts`:

```ts
export type TuitionSpaceId = "learn" | "teach" | "assess" | "activities" | "network";
export type Tint = "learn" | "assess" | "activity" | "network" | "live" | "progress";

export type ProgrammeStatus = "draft" | "published" | "archived";
export type EnrolmentStatus = "invited" | "active" | "completed" | "dropped";
export type LessonState = "locked" | "available" | "in_progress" | "completed";
export type AssignmentStatus = "draft" | "open" | "grading" | "closed";
export type SubmissionStatus = "draft" | "submitted" | "late" | "graded";
export type AssessmentStatus = "draft" | "scheduled" | "open" | "closed" | "published_results";
export type AttemptStatus = "not_started" | "in_progress" | "submitted" | "graded";
export type ActivityStatus = "draft" | "registrations" | "in_progress" | "results" | "completed" | "cancelled";
export type ResourceType = "video" | "pdf" | "document" | "audio" | "image" | "presentation" | "link" | "embed";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type QuestionType = "mcq" | "multi_select" | "true_false" | "short_answer" | "structured" | "essay" | "practical";

export interface Space { id: TuitionSpaceId; label: string; href: string; icon: LucideIcon; }
export interface InstructorSummary { id: string; name: string; role: "lead" | "assistant"; }
export interface ProgrammeSummary {
  id: string; title: string; slug?: string; type: string;
  subjectId: string | null; gradeId: string | null; difficulty: Difficulty;
  coverUrl: string | null; ratingAvg: number; ratingCount: number; studentsCount: number;
  durationWeeks: number; visibility: string; status: ProgrammeStatus;
  instructors: InstructorSummary[];
}
export interface LessonNode { id: string; title: string; state: LessonState; isPreview: boolean; durationMin: number; contentType: string; progressPct: number; }
export interface ModuleNode { id: string; title: string; position: number; lessons: LessonNode[]; }
export interface LessonProgress { lessonId: string; status: LessonState; progressPct: number; timeSpentSec: number; lastPositionSec: number; }
export interface QuestionOption { id: string; text: string; is_correct: boolean; }
export interface QuestionItem { id: string; question_type: QuestionType; stem: string; options: QuestionOption[]; marks: number; difficulty: Difficulty; topic?: string; strand?: string; explanation?: string; }
export type AnswerValue = string | string[] | null;
```

### 1.2 Existing UI primitives reused **as-is** (`src/components/ui/`)

| Primitive | Reused as | Notes for Tuition |
|---|---|---|
| `Button` | everywhere | **+ new `variant: "tuition"`** added to `button.tsx` (see 1.4); all geometry/loading/disabled rules unchanged |
| `Card` + `CardHeader/Title/Description/Action/Content/Footer` | ProgrammeCard, BenchmarkCard, sectioned panels | default `rounded-xl ring-1 ring-foreground/10`; `size="sm"` for dense KPIs |
| `Badge` | StatusPill base, chips, counts | `rounded-4xl` pill, `h-5`; tinted variants applied via `className` |
| `Avatar` + `Fallback` + `Badge` + `Group` | teacher/instructor avatars, enrolled-student rows | `sm/default/lg` |
| `Tabs` + `TabsList/Trigger/Content` | manage-programme (TCH-08), settings (SYS-05), teacher assessment results (TCH-16) | **currently unused in the app — Tuition is the first adopter**; `line` variant for sub-nav |
| `DropdownMenu` (full set incl. check/radio/sub/shortcut) | ProductSwitcher, bulk actions, lesson `⋮` menu | reused verbatim |
| `Sheet` + `SheetContent` | mobile module drawer over PlayerFrame, TeacherMobileDrawer, ContentLibrary folder picker | unlocked by Tuition |
| `Tooltip` | icon-only row actions, player controls, palette flags | inverted (`bg-foreground text-background`) |
| `Separator` | lesson lists, table headers, settings groups | unlocked by Tuition |

**Reused platform components:** `toast` (`@/components/platform/toast`),
`SyncIndicator` (offline pill in PlayerLayout), `SchoolModeBanner` (school-mode
notice inside tuition), `SearchModal` as the anatomy for `SearchOverlay`.
`Header` and `Sidebar` (platform) are **not** reused by the tuition route group —
TuitionShell is a separate shell that owns its own chrome (see Part 2).

### 1.3 New UI primitives required

Two genuinely generic primitives deserve `src/components/ui/` because they are
not tuition-specific:

| New primitive | Path | Why |
|---|---|---|
| `Progress` | `src/components/ui/progress.tsx` | Generic determinate/indeterminate progress on `@base-ui/react` progress. `ProgressBar` (tuition) becomes a thin tinted wrapper |
| `Breadcrumbs` | `src/components/ui/breadcrumbs.tsx` | `nav` + `Separator`-separated `Link`s with `aria-current="page"`; used in TuitionShell and ContentLibrary |

Everything else (dropzone, timer, dial, table, gate) is genuinely tuition-domain
and stays in `src/components/tuition/`. No new dependencies are introduced to
support these (rich text stays a textarea; the score dial is an inline SVG ring,
not a chart lib).

### 1.4 Component registry

Unless noted, components derive from the documented patterns in `_context.md`
§3 and `03-design-system.md` §10. Paths are under `src/components/tuition/`.

#### TuitionShell

| | |
|---|---|
| **File** | `tuition-shell.tsx` |
| **Purpose** | Client shell for the whole Tuition experience: ProductSwitcher + SpaceRail + optional breadcrumbs + main; owns mobile navigation. Same geometry as `PlatformShell` |
| **Props** | `{ role: string; studentView?: boolean; spaces: Space[]; breadcrumbs?: BreadcrumbItem[]; offline?: boolean; children: React.ReactNode }` |
| **Variants/states** | role variant (student rail / teacher nav / school / network); immersive opt-out via `PlayerLayout` sibling |
| **Screens** | every tuition page except immersive players |
| **Derives from** | `@/components/platform/shell` (structure), `@/components/platform/sidebar` nav pattern |

#### ProductSwitcher

| | |
|---|---|
| **File** | `product-switcher.tsx` |
| **Purpose** | "Decimal ▾" top-of-shell dropdown switching School Management ↔ Tuition via path routing (no cookie) |
| **Props** | `{ activeProduct: "school" | "tuition"; schoolHref?: string }` |
| **Variants/states** | school active (primary dot), tuition active (violet dot); closed/open |
| **Screens** | SYS-01 (rendered in TuitionShell header) |
| **Derives from** | `@/components/platform/school-switcher` + `DropdownMenu` |

#### SpaceRail

| | |
|---|---|
| **File** | `space-rail.tsx` |
| **Purpose** | Left mini-rail mapping the five spaces (Learn/Teach/Assess/Activities/Network) with fixed icons (BookOpen/Library/ClipboardCheck/Trophy/Globe2) and dot tints |
| **Props** | `{ spaces: Space[]; active?: TuitionSpaceId; collapsed?: boolean }` |
| **Variants/states** | expanded (≥lg) / icon-only (sm–lg) / hidden below sm (student bottom bar takes over); active item `bg-tuition-accent/10 text-tuition-accent aria-current="page"` |
| **Screens** | all non-immersive tuition pages |
| **Derives from** | `@/components/platform/sidebar` nav item anatomy |

#### ProgrammeCard

| | |
|---|---|
| **File** | `programme-card.tsx` |
| **Purpose** | Course card: cover, title, instructor(s), rating, students, duration, level chips, progress bar, enrol/continue CTA |
| **Props** | `{ programme: ProgrammeSummary; meta?: { level?: string; subject?: string }; progress?: { pct: number; state: EnrolmentStatus }; cta?: { label: string; href: string } }` |
| **Variants/states** | not-enrolled (Enrol CTA), enrolled-active (Continue), completed (Review), preview-badge; grid/compact `size` |
| **Screens** | STU-02, STU-03, STU-04 (related), STU-05, TCH-02, NET-03 |
| **Derives from** | `Card` + existing KPI/card recipes |

#### ActivityCard

| | |
|---|---|
| **File** | `activity-card.tsx` |
| **Purpose** | Activity/event card for activities, sports fixtures, clubs, and school events: cover, title, type, dates, venue, participation status, teams/standings |
| **Props** | `{ activity: { id: string; title: string; type: string; coverUrl?: string \| null; venue?: string; status: ActivityStatus }; participation?: "registered" \| "open" \| "closed"; dates?: { start: string; end?: string } }` |
| **Variants/states** | `cover` (large, detail hero) / `compact` (grid rows); participation: registered (filled), open (outline CTA), closed (disabled); cancelled badge |
| **Screens** | STU-16, STU-17, TCH-20, SCH-10 |
| **Derives from** | `ProgrammeCard` (cover + CTA anatomy; activity metadata + participation replace enrolment/progress) |

#### FixtureTable

| | |
|---|---|
| **File** | `fixture-table.tsx` |
| **Purpose** | Fixtures/matches grid: teams, venue, date, result, status; results inline-editable for teacher/principal, read-only otherwise |
| **Props** | `{ fixtures: { id: string; homeTeam: string; awayTeam: string; venue?: string; date: string; status: "upcoming" \| "played" \| "cancelled"; result?: { home: number; away: number } }[]; canEditResults?: boolean; onEditResult?: (fixtureId: string, result: { home: number; away: number }) => void; onReport?: (fixtureId: string) => void }` |
| **Variants/states** | empty (`EmptyState`: "No fixtures yet"), upcoming (date/venue), played (score + result), cancelled; editable rows for teacher/principal |
| **Screens** | STU-17, TCH-20, SCH-10, NET-07 |
| **Derives from** | `TuitionTable` column config (condensed, ≤20 rows, no pagination) + `StatusPill` + `EmptyState` |

#### ProgrammeCover

| | |
|---|---|
| **File** | `programme-cover.tsx` |
| **Purpose** | `aspect-video` cover with `next/image`, gradient fallback + initials when no `cover_url` |
| **Props** | `{ src?: string | null; alt: string; fallback: string; size?: "sm" | "md" | "lg" | "hero" }` |
| **Variants/states** | image / gradient-fallback; loading shimmer; broken-image→fallback |
| **Screens** | STU-04 (hero), STU-02/03 (covers), TCH-02, TCH-08 |
| **Derives from** | `Image` + `AvatarFallback`-style initials chip, `bg-muted animate-pulse` |

#### ProgressBar

| | |
|---|---|
| **File** | `progress-bar.tsx` |
| **Purpose** | `h-2 rounded-full bg-muted overflow-hidden` fill with configurable tone |
| **Props** | `{ value: number; max?: number; tone?: Tint | "success" | "warning" | "info"; label?: string }` |
| **Variants/states** | tones: learn (blue), progress (green), assess (violet), warn (amber); label right-aligned; 0% empty, 100% full |
| **Screens** | STU-04, STU-05, STU-18, TCH-11, SCH-02 |
| **Derives from** | existing progress-bar recipe (`_context.md` §3) |

#### StatusPill

| | |
|---|---|
| **File** | `status-pill.tsx` |
| **Purpose** | Single status rendering for all seven tuition status families |
| **Props** | `{ status: string; toneMap?: Record<string, Tint> }` |
| **Variants/states** | predefined maps: programme (draft gray / published green / archived gray), enrolment, lesson, assignment/submission, assessment/attempt, activity, difficulty; tinted `bg-{tint}/10 text-{tint}` soft pills |
| **Screens** | every list/detail screen |
| **Derives from** | `Badge` + status-pill map (`_context.md` §3) |

#### LessonList

| | |
|---|---|
| **File** | `lesson-list.tsx` |
| **Purpose** | Collapsible module→lesson tree with per-lesson state icons (lock/play/check/clock) and progress |
| **Props** | `{ modules: ModuleNode[]; activeLessonId?: string; progress?: Record<string, LessonProgress>; onSelect?: (lesson: LessonNode) => void; mobile?: boolean }` |
| **Variants/states** | expanded/collapsed modules; lesson states locked/available/in_progress/completed; compact (mobile drawer) / full (desktop sidebar) |
| **Screens** | STU-04, STU-06 (player rail), STU-05 |
| **Derives from** | `Tabs`, `Separator`, lucide state icons |

#### PlayerFrame

| | |
|---|---|
| **File** | `player-frame.tsx` |
| **Purpose** | Immersive lesson/assignment/classroom layout — full-bleed, no rail, minimal top chrome, optional offline banner; max-w-4xl content |
| **Props** | `{ title: string; meta?: React.ReactNode; progress?: { value: number }; chrome?: "player" | "classroom"; offline?: boolean; banner?: React.ReactNode; mobileDrawer?: React.ReactNode; content: React.ReactNode; controls?: React.ReactNode }` |
| **Variants/states** | lesson player / live classroom; offline pill (via `SyncIndicator`); keyboard hints `[Space]` |
| **Screens** | STU-06, STU-12, STU-15 (P1), and their teacher mirrors |
| **Derives from** | `PlatformShell`-geometry reset + `Card` `rounded-2xl` container + `Sheet` for the mobile module drawer |

#### LiveRoom

| | |
|---|---|
| **File** | `live-room.tsx` |
| **Purpose** | Live/replay classroom wrapper: waiting-room → room around the Decimal replay video + chat/Q&A/polls for `provider='decimal'` (no WebRTC); optional external `meeting_url` (Google Meet/Zoom) embed surfaced as a "Join via video link" fallback; `recording_url` renders as the replay once the class ends |
| **Props** | `{ liveClass: { id: string; title: string; status: "scheduled" \| "live" \| "ended"; meeting_url?: string \| null; recording_url?: string \| null }; provider?: "decimal"; currentUser: { id: string; role: string }; onJoin?: () => void; onReplay?: () => void }` |
| **Variants/states** | scheduled (waiting-room countdown) / live (replay + chat; "Join via video link" banner when `meeting_url` set) / ended (replay from `recording_url`); offline banner via `SyncIndicator` |
| **Screens** | STU-15 (live); replay from STU-14 / TCH-19 |
| **Derives from** | `PlayerFrame` (classroom chrome) + chat recipe + `SyncIndicator` |

#### QuestionRenderer

| | |
|---|---|
| **File** | `question-renderer.tsx` |
| **Purpose** | Renders all seven question types with validation and optional feedback |
| **Props** | `{ question: QuestionItem; index: number; value: AnswerValue; onChange: (v: AnswerValue) => void; disabled?: boolean; showFeedback?: { correct: boolean; explanation?: string } | null; flagged?: boolean }` |
| **Variants/states** | per `question_type`: radio list (mcq), checkbox list (multi_select), T/F switch (true_false), input (short_answer), textarea (structured/essay), file + notes (practical); read-only feedback mode |
| **Screens** | STU-12 (take), STU-13 (review), TCH-15 (preview), TCH-18 (preview) |
| **Derives from** | canonical form controls (`_context.md` §1/§8) |

#### QuestionPalette

| | |
|---|---|
| **File** | `question-palette.tsx` |
| **Purpose** | Numbered navigator grid with answer/flag state dots |
| **Props** | `{ count: number; flags: Record<number, boolean>; answered: Record<number, boolean>; current: number; onNavigate: (n: number) => void }` |
| **Variants/states** | unanswered (outline), answered (filled), flagged (dot), current (`ring`); arrow-key navigable |
| **Screens** | STU-12 (sidebar/desktop, drawer/mobile) |
| **Derives from** | grid + `Badge` + `Tooltip` |

#### AssessmentTimer

| | |
|---|---|
| **File** | `assessment-timer.tsx` |
| **Purpose** | Countdown to deadline/duration; auto-submit at 0; warns in live region; monotonic against server `deadline` (never local-only) |
| **Props** | `{ deadline: string; onExpire: () => void; paused?: boolean; warnAtSec?: number }` |
| **Variants/states** | running / paused / warn (<5min amber) / expired; Geist Mono numerals |
| **Screens** | STU-12 |
| **Derives from** | `Badge` + `[&_svg]` conventions; interval hook `useAssessmentTimer` |

#### MarkdownText

| | |
|---|---|
| **File** | `markdown-text.tsx` |
| **Purpose** | Safe-ish renderer for lesson bodies, assignment instructions, assessment instructions. MVP: minimal inline whitelist (bold/italic/links/lists/code) on top of `prose-custom`; **no raw HTML passthrough** |
| **Props** | `{ text: string; className?: string }` |
| **Variants/states** | rendered / empty |
| **Screens** | STU-06, STU-04, STU-09, STU-11, TCH-03, TCH-05 |
| **Derives from** | `.prose-custom` (`globals.css`), `@/lib/utils.cn` |

#### NotesPanel

| | |
|---|---|
| **File** | `notes-panel.tsx` |
| **Purpose** | Per-lesson (or per-student) notes list + inline editor; writes queue to IndexedDB (`src/lib/db.ts`) when offline and flush via the sync engine when online |
| **Props** | `{ lessonId: string; studentId: string; notes: { id: string; text: string; created_at: string }[]; onAdd: (text: string) => void; onDelete?: (noteId: string) => void; offline?: boolean }` |
| **Variants/states** | empty (prompt + `EmptyState`), reading (list), editing (textarea + autosave), offline (queued + `SyncIndicator`) |
| **Screens** | STU-06 |
| **Derives from** | `Card` + canonical form controls + `src/lib/db.ts` IDB queue |

#### EmptyState

| | |
|---|---|
| **File** | `empty-state.tsx` |
| **Purpose** | Unified empty-state card (`py-12 text-center` + faded icon + 2-line copy + optional CTA) |
| **Props** | `{ icon: LucideIcon; title: string; description?: string; actionLabel?: string; href?: string; onAction?: () => void; children?: React.ReactNode }` |
| **Variants/states** | `ghost`/`glow` CTA; inherits existing empty-card recipe |
| **Screens** | every list screen (contextual message rule from `_context.md`) |
| **Derives from** | empty-card recipe (`_context.md` §3) |

#### DataState

| | |
|---|---|
| **File** | `data-state.tsx` |
| **Purpose** | Loading / empty / error wrapper around page content |
| **Props** | `{ loading?: boolean; error?: string | null; empty?: boolean; onRetry?: () => void; skeletonCount?: number; children: React.ReactNode }` |
| **Variants/states** | skeleton grid / empty (`EmptyState`) / error banner (`border-destructive/30 bg-destructive/10`) with Retry |
| **Screens** | all screens (cross-cutting state) |
| **Derives from** | `Skeleton` + `EmptyState` + error banner recipe |

#### Skeleton

| | |
|---|---|
| **File** | `skeleton.tsx` |
| **Purpose** | `animate-pulse rounded-lg bg-muted` block |
| **Props** | `{ className?: string }` |
| **Variants/states** | inherited via `cn`; used with `skeletonCount` arrays |
| **Screens** | all screens (`(tuition)/loading.tsx` globally) |
| **Derives from** | existing pulse blocks |

#### FileDropzone

| | |
|---|---|
| **File** | `file-dropzone.tsx` |
| **Purpose** | Dashed upload card + browse; multi-file list with size/mime, remove |
| **Props** | `{ accept?: string[]; multiple?: boolean; maxSizeMB?: number; value: { name: string; size: number; mime: string }[]; onFiles: (files: File[]) => void; onRemove: (name: string) => void; disabled?: boolean }` |
| **Variants/states** | idle (dashed border, UploadCloud), drag-over (`border-tuition-accent`), uploading (per-file progress), error (oversize/invalid type inline) |
| **Screens** | STU-09 (submission), TCH-05 (resource upload), TCH-09, TCH-15 (practical outline) |
| **Derives from** | modal/form recipe + `.input` border pattern |

#### ScoreDial

| | |
|---|---|
| **File** | `score-dial.tsx` |
| **Purpose** | Radial % score ring with tone (green ≥80 / amber ≥50 / red <50); Geist Mono center value |
| **Props** | `{ score: number; max?: number; size?: number }` |
| **Variants/states** | tone by threshold; small (inline lists) / large (result hero) |
| **Screens** | STU-13, TCH-16, SCH-09, NET-06 |
| **Derives from** | inline SVG stroke-dasharray ring (no chart lib), tint tokens |

#### BenchmarkCard

| | |
|---|---|
| **File** | `benchmark-card.tsx` |
| **Purpose** | Network read-only metric card: school avg, network avg, percentile, per-strand bars, participation sample |
| **Props** | `{ schoolAvg: number; networkAvg: number; percentile: number; topics: { strand: string; school: number; network: number }[]; sampleSize?: number; anonymized?: boolean }` |
| **Variants/states** | loading, no-data (sample<min), over-network (green) / under (amber) |
| **Screens** | NET-06, SCH-11, NET-05, STU-13 (barely) |
| **Derives from** | `Card` + Recharts `BarChart` (tick `hsl(var(--muted-foreground))`, stroke `hsl(var(--border))`) |

#### SearchOverlay

| | |
|---|---|
| **File** | `search-overlay.tsx` |
| **Purpose** | Global tuition search overlay (`/tuition/search`), tuple-scoped, debounced 300ms / min 2 chars |
| **Props** | `{ open: boolean; onClose: () => void; spaces?: TuitionSpaceId[]; results?: SearchResults }` |
| **Variants/states** | recent searches, query mode, grouped results (programmes/lessons/teachers/assessments/activities/resources), empty, loading; Escape/`⌘K` |
| **Screens** | SYS-02 (overlay from TuitionShell header; full page at `/tuition/search`) |
| **Derives from** | `@/components/platform/search-modal` pattern + `Sheet` |

#### TuitionTable

| | |
|---|---|
| **File** | `tuition-table.tsx` |
| **Purpose** | Modular data table: column config, sorting, filtering, server/client pagination, row selection, bulk bar, CSV export, mobile stacked rows |
| **Props** | `{ columns: Column<T>[]; rows: T[]; keyField: keyof T; sortable?: boolean; filterable?: boolean; pagination?: { page: number; pageSize: number; total: number; onChange: (p: { page: number; pageSize: number }) => void }; selection?: { selected: string[]; onSelect: (ids: string[]) => void }; bulkActions?: { label: string; onRun: (ids: string[]) => void; variant?: "secondary" \| "destructive" }[]; exportable?: { filename: string; onExport?: () => void }; loading?: boolean; emptyMessage?: string; mobile?: "stacked" \| "scroll" }` |
| **Variants/states** | desktop table (`overflow-x-auto`) vs mobile stacked label/value rows (`sm:hidden`); bulk bar appears when `selected.length > 0`; empty row `colSpan=N` per house rule |
| **Screens** | all teacher/school/network lists (TCH-02/11/13/14/16/17/19, SCH-02/04/05/06/07/09, NET-02/03/04) |
| **Derives from** | sectioned table card + `super-admin/users` server-pagination + bulk pattern (`_context.md` §3) |

```ts
// tuition-table.ts (column contract)
export interface Column<T> {
  key: string;
  label: string;
  accessor: (row: T) => string | number | null | undefined;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;      // renders a canonical search/select header cell
  hideBelow?: "sm" | "md" | "lg";
}
```

#### TuitionGate

| | |
|---|---|
| **File** | `tuition-gate.tsx` |
| **Purpose** | Billing/flag gate: renders children when tuition is enabled for the school, otherwise an upsell banner + disabled CTA |
| **Props** | `{ enabled: boolean; plan: "free" \| "starter" \| "pro" \| "enterprise"; requiredPlan: "starter"; children: React.ReactNode }` |
| **Variants/states** | enabled / gated (banner: "Tuition is available on Starter and above" + Upgrade CTA to `/principal/billing/plans`) |
| **Screens** | applied in `(tuition)/layout.tsx` root, plus per-feature in SCH-08 (adopt) |
| **Derives from** | alert-banner recipe + `Button` |

#### Mobile chrome (supplementary, part of TuitionShell)

| Component | File | Spec |
|---|---|---|
| `BottomTabBar` | `bottom-tab-bar.tsx` | Students only, <sm: `fixed bottom-0 h-14` 5 tabs (Home, Explore, Learn, Assess, More) + safe-area padding; hidden ≥sm |
| `TeacherMobileDrawer` | `teacher-mobile-drawer.tsx` | Teachers (and school/network), <sm: hamburger → `Sheet` left drawer with SpaceRail + role nav |
| `OfflineBanner` | `offline-banner.tsx` | thin amber strip under header: "You're offline — progress saves when you reconnect" |

### 1.5 Conventions checklist for every new component

1. `"use client"` only when the component owns state/effects; pages stay server where possible.
2. `cn()` first import from `@/lib/utils`; never string concatenation of classes.
3. Button variant `tuition` for the hero CTA inside tuition experiences only.
4. Touch targets ≥ 40px mobile; icon buttons `size-8+` (or `icon-sm` w/ padding).
5. Tables: caption + `scope="col"`; `aria-current="page"` on active nav/tabs.

---

## PART 2 — Layout & composition map

### 2.1 `(tuition)/layout.tsx` — composition order

```
src/app/(platform)/(tuition)/layout.tsx     (server, thin)
├─ resolves: schoolId = ctx.schoolId (5-min cache), resolved member role,
│            featureEnabled = isFeatureEnabled(schoolId, "decimal_tuition"),
│            studentView  = tuition_student_users(user_id) OR students.parent_user_id
├─ if !featureEnabled → redirect("/tuition/upgrade")  (TuitionGate page, not a 404)
└─ renders <TuitionShell role=… spaces=… studentView=…>   (client; mode by role)
     ├─ ProductSwitcher  (activeProduct="tuition")
     ├─ SpaceRail        (Learn/Teach/Assess/Activities/Network; icons + tints)
     ├─ <header> breadcrumbs (Breadcrumbs) + global tuition search trigger (bell/search bolt-on)
     ├─ <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">   (space-y-6 pages)
     └─ <BottomTabBar/> (student)  |  <TeacherMobileDrawer/> (teacher/school/network)
```

- **Space harness** derived from `PlatformShell` but with the tuition rail, violet
  `--tuition-accent` active states, and product switcher at the top. The platform
  `Sidebar` is intentionally not mounted — no double navigation.
- Role → rail default: student = Learn rail; teacher = Teach; principal/super_admin
  school-mode = School space; platform super_admin = Network.
- Role-aware `/tuition` root dispatch (per `10-route-architecture.md` §2).

### 2.2 `PlayerLayout` (immersive opt-out)

`src/app/(platform)/(tuition)/player-layout.tsx` wraps three route trees:

| Route | Chrome |
|---|---|
| `/tuition/learn/[programmeId]/[lessonId]` (STU-06) | full-bleed header (title + breadcrumb back + SyncIndicator); left module drawer (`Sheet`) on mobile; `max-w-4xl` content; progress bar; controls |
| `/tuition/assessments/[id]/take` (STU-12) | **focused mode** — no header, only timer + palette; `role="status"` timer; auto-submit at 0; Escape guarded (confirm "submit or resume") |
| `/tuition/classes/[id]` (STU-15, P1) | waiting-room → room; top chrome only (leave + join state) |

- Hides the SpaceRail entirely; hides the platform header chrome except a minimal
  top bar: back link, title, **offline banner** (`OfflineBanner`, driven by
  `useOnlineStatus`).
- Offline behavior: lesson content + covers + latest notes cached in IndexedDB
  (`src/lib/db.ts`); progress/submission writes queue through `src/lib/sync.ts`
  and flush when online (mirrors `/api/sync/attendance`).
- The player routes register their URL patterns in `src/app/sw.ts` as
  `NetworkFirst()` fallbacks so a previously opened lesson renders offline.

### 2.3 Header integration

The tuition route group uses its **own** header inside TuitionShell, but borrows:
- **Reused as-is:** `SyncIndicator`, `SyncConflictBadge`, `ThemeToggle`,
  `SchoolSwitcher` (occurs within the tuition header's `flex items-center gap-2`),
  avatar DropdownMenu anatomy, notification DropdownMenu anatomy (`header.tsx`).
- **Bolt-ons:**
  - `SearchOverlay` trigger (search icon / `⌘K`) → `/tuition/search`.
  - Bell dropdown gains tuition-aware action buttons: "View all" →
    `/tuition/notifications`; clicking a notification respects its `deep_link`
    (existing `notifications` table) which may point at `/tuition/...`.
- When in school-mode (super admin inside a school), `SchoolModeBanner` renders
  above the tuition main exactly as in `PlatformShell`.

### 2.4 Mobile rules (binding, from `03-design-system.md` §11)

| Viewport | Student | Teacher / School / Network |
|---|---|---|
| ≥ `lg` | SpaceRail expanded + page | SpaceRail expanded + page |
| `sm`–`lg` | rail icon-only; tables scroll in cards | rail icon-only; tables scroll |
| `< sm` | **BottomTabBar** (Home/Explore/Learn/Assess/More); no rail | **TeacherMobileDrawer** (Sheet) |
| Immersive | module drawer via Sheet; assessment focused mode | same |

Layout switch is purely CSS/`usePathname`-derived (active space); no state cookie.

---

## PART 3 — Screen → Page → API → DB mapping table

Legend — **Page type:** `s`=server component, `c`=client component, `s+c`=server wrapper + client child.
**Data source:** `SSR`=server supabase fetch; `API`=`/api/tuition/...` route; `BR`=browser supabase client; `IDB`=IndexedDB.
**DB:** reads▸ / writes▸ (entities from `11-data-model.md`). All paths under `src/app/(platform)/(tuition)/`.

### A. System / shared

| ID | Screen | P | Page | Type | Primary components | API route | DB reads / writes | Source |
|---|---|---|---|---|---|---|---|---|
| SYS-01 | Product Switcher | P0 | — (in TuitionShell) | c | ProductSwitcher | — | — | — |
| SYS-02 | Global search | P1 | `search/page.tsx` | s+c | SearchOverlay, TuitionTable | `GET /api/tuition/search` *(+)* | programmes, lessons, staff, assessments, activities, lessons_resources | API |
| SYS-03 | Notification center | P1 | `notifications/page.tsx` | s+c | DataState, TuitionTable, notification list | *(+)* `GET/PATCH /api/tuition/notifications` | notifications | SSR + BR |
| SYS-04 | Profile hub | P1 | `profile/page.tsx`, `profile/[type]/[id]/page.tsx` | s | Avatar, TuitionTable, ProgrammeCard | `GET /api/tuition/progress?student_id=` | profiles, students, staff, programmes, programme_reviews | SSR |
| SYS-05 | Settings | P1 | `settings/page.tsx` | s+c | Tabs, canonical forms | *(+)* `PATCH /api/tuition/profile` | profiles (learning prefs), notification_preferences | SSR + API |
| SYS-06 | Onboarding wizard | P1 | `onboarding/page.tsx` | c | Tabs-less step card, ProgrammeCard | *(+)* `POST /api/tuition/onboarding` | profiles, curriculums, curriculum_subjects, programmes | API |

### B. Student (Learn space)

| ID | Screen | P | Page | Type | Primary components | API route | DB reads / writes | Source |
|---|---|---|---|---|---|---|---|---|
| STU-01 | Student Home | P0 | `page.tsx` (role dispatch) | s+c | TuitionShell→Home, KPI blocks, ProgrammeCard, BenchmarkCard | `GET /api/tuition/my-learning`, `GET /api/tuition/progress` | programme_enrolments, lesson_progress, programmes, tuition_enrolment_daily_activity | SSR + API |
| STU-02 | Explore home | P0 | `explore/page.tsx` | s+c | SearchOverlay, ProgrammeCard, category rail | `GET /api/tuition/programmes` | programmes, curriculum_subjects, ratings | SSR |
| STU-03 | Explore filtered | P0 | `explore/page.tsx` (`?grade=&subject=`) | s+c | TuitionTable, filters, ProgrammeCard | `GET /api/tuition/programmes?grade&subject` | programmes, curriculum curricular | SSR |
| STU-04 | Programme detail | P0 | `programmes/[id]/page.tsx` | s+c | ProgrammeCover(hero), LessonList, ModuleNode, ProgrammeCard(related), reviews | `GET /api/tuition/programmes/[id]`, `POST /api/tuition/enrol` | programmes, programme_modules, programme_lessons, programme_instructors, programme_reviews ▸ programme_enrolments | SSR + API |
| STU-05 | My Learning | P0 | `my-learning/page.tsx` | s+c | ProgrammeCard, ProgressBar, StatusPill, TuitionTable | `GET /api/tuition/my-learning` | programme_enrolments, lesson_progress, programmes | SSR |
| STU-06 | Learning player | P0 | `learn/[programmeId]/[lessonId]/page.tsx` | s+c | PlayerFrame, LessonList, MarkdownText, Notes, controls | `POST /api/tuition/lessons/[id]/complete`, `GET/POST/DELETE /api/tuition/notes` | programme_lessons, lessons_resources, lesson_progress ▸ lesson_progress, notes | SSR + API + IDB |
| STU-07 | Resource states | P0 | (within STU-06) | c | PlayerFrame states, FileDropzone(practical) | same as STU-06 | lessons_resources | IDB |
| STU-08 | Assignment list | P0 | `assignments/page.tsx` | s+c | TuitionTable, StatusPill, empty states | `GET /api/tuition/assignments` | assignments (mine), submissions | SSR |
| STU-09 | Assignment detail/submit | P0 | `assignments/[id]/page.tsx` | s+c | MarkdownText, FileDropzone, SubmissionStatus, draft/late banners | `POST /api/tuition/assignments/[id]/submissions` | assignments, submissions ▸ submissions (draft/submit) | SSR + API + IDB(draft) |
| STU-10 | Assessment dashboard | P0 | `assessments/page.tsx` | s+c | TuitionTable, StatusPill, ProgressBar | `GET /api/tuition/assessments` | assessments (open to class/grade), assessment_attempts (mine) | SSR |
| STU-11 | Instructions + start | P0 | `assessments/[id]/instructions/page.tsx` | s+c | MarkdownText, AssessmentTimer preview, confirm modal | `POST /api/tuition/assessments/[id]/attempts` (start) | assessments, assessment_sections, assessment_attempts ▸ attempt | SSR + API |
| STU-12 | Assessment take | P0 | `assessments/[id]/take/page.tsx` | c | PlayerFrame(focused), QuestionRenderer, QuestionPalette, AssessmentTimer | `GET /api/tuition/assessments/[id]/attempts` (resume), `POST …/answer` (autosave), `POST …/submit` | assessment_attempts, questions, assessment_questions ▸ attempts.answers, flags | API + IDB |
| STU-13 | Result | P0 | `assessments/[id]/result/page.tsx` | s+c | ScoreDial, QuestionRenderer(review), BenchmarkCard | `GET /api/tuition/assessments/[id]/attempts` | assessment_attempts, assessment_attempt_details, curriculum_strands | SSR |
| STU-14 | Live classes dash | P1 | `classes/page.tsx` | s+c | TuitionTable, StatusPill (scheduled/live/ended) | `GET /api/tuition/classes` | live_classes (enrolled programmes) | SSR |
| STU-15 | Live classroom | P1 | `classes/[id]/page.tsx` | c | PlayerFrame(classroom), LiveRoom (`provider='decimal'`: replay+chat; optional `meeting_url` video-link embed) | *(+)* `POST /api/tuition/classes/[id]/join` | live_classes, live_class_attendees ▸ attendance | API |
| STU-16 | Activities discovery | P1 | `activities/page.tsx` | s+c | ProgrammeCard-like ActivityCard, TuitionTable | `GET /api/tuition/activities` | activities (visible scope) | SSR |
| STU-17 | Activity detail/register | P1 | `activities/[id]/page.tsx` | s+c | StatusPill, schedule/fixtures, register button | `GET /api/tuition/activities`, *(+)* `POST /api/tuition/activities/[id]/register` | activities, activity_teams, activity_matches ▸ activity_registrations | SSR + API |
| STU-18 | Progress | P0 | `progress/page.tsx` | s+c | ProgressBar, streak cards, weak-topic list, Recharts | `GET /api/tuition/progress` | lesson_progress, tuition_enrolment_daily_activity, attempts | SSR |
| STU-19 | Achievements | P2 | `achievements/page.tsx` | s+c | Sheet of badges, ProgressBar | *(+)* `GET /api/tuition/achievements` | achievements (P2 table) | SSR |
| STU-20 | Certificates | P2 | `certificates/page.tsx` | s+c | Card grid + PrintButton | *(+)* `GET /api/tuition/certificates` | certificates (P2 table) | SSR |

### C. Teacher (Teach space) — SpaceRail → Teach

| ID | Screen | P | Page | Type | Primary components | API route | DB reads / writes | Source |
|---|---|---|---|---|---|---|---|---|
| TCH-01 | Teacher dashboard | P0 | `teacher/page.tsx` | s+c | KPI blocks, ProgressBar, TuitionTable, alerts grid | `GET /api/tuition/analytics` | programmes, enrolments, assessments, upcoming classes | SSR + API |
| TCH-02 | My Programmes | P0 | `teacher/programmes/page.tsx` | s+c | TuitionTable (status filter), ProgrammeCard, StatusPill | `GET /api/tuition/programmes` | programmes (creator/staff) | SSR |
| TCH-03 | Builder Step 1 — Details | P0 | `teacher/programmes/new/page.tsx?step=1` | c | BuilderForm, FileDropzone(cover), multi-select chips | `POST /api/tuition/programmes` | programmes ▸ draft | API + IDB |
| TCH-04 | Builder Step 2 — Structure | P0 | `…?step=2` | c | ModuleNode tree, LessonList (draggable reorder) | `POST /api/tuition/programmes/[id]/modules` | programme_modules, programme_lessons | API + IDB |
| TCH-05 | Builder Step 3 — Content | P0 | `…?step=3` | c | MarkdownText, FileDropzone, lesson editor | `PATCH /api/tuition/programmes/[id]/lessons/[lid]` | programme_lessons, lessons_resources | API + IDB |
| TCH-06 | Builder Step 4 — Access | P0 | `…?step=4` | c | visibility radio/select (scope), cohorts | `PATCH /api/tuition/programmes/[id]` | programmes.visibility, programme_cohorts | API + IDB |
| TCH-07 | Builder Step 5 — Review & Publish | P0 | `…?step=5` | c | review checklist, ProgressBar | `POST /api/tuition/programmes/[id]/publish` | programmes.status ▸ published, published_at | API |
| TCH-08 | Manage programme | P0 | `teacher/programmes/[id]/page.tsx` (`?tab=overview\|students\|content\|assess\|results`) | s+c | Tabs, TuitionTable, LessonList, BenchmarkCard | `GET /api/tuition/programmes/[id]`, `GET …/modules`, `GET …/analytics` | programmes, enrolments, lessons, attempts, submissions | SSR + API |
| TCH-09 | Content Library | P1 | `teacher/content/page.tsx` | s+c | TuitionTable, FileDropzone, folder picker (Sheet) | *(+)* `GET/POST /api/tuition/content` | lessons_resources, content folders | SSR + API |
| TCH-10 | Content detail/preview | P1 | `teacher/content/[id]/page.tsx` | s+c | PlayerFrame(preview), FileDropzone | `PATCH /api/tuition/programmes/[id]/lessons/[lid]` | lessons_resources | SSR + API |
| TCH-11 | Students | P0 | `teacher/students/page.tsx` | s+c | TuitionTable, ProgressBar, StatusPill | `GET /api/tuition/progress?student_id=` | programme_enrolments, lesson_progress | SSR |
| TCH-12 | Student profile (teacher) | P1 | `teacher/students/[id]/page.tsx` | s+c | ProgressBar, Recharts, notes | *(+)* `GET/POST /api/tuition/teacher-notes` | teacher_student_notes ▸ notes | SSR + API |
| TCH-13 | Assignments manage | P0 | `teacher/assignments/page.tsx` | s+c | TuitionTable, StatusPill, create modal | `GET/POST /api/tuition/assignments` | assignments ▸ assignments | SSR + API |
| TCH-14 | Assessments manage | P0 | `teacher/assessments/page.tsx` | s+c | TuitionTable, StatusPill | `GET/POST /api/tuition/assessments` | assessments | SSR + API |
| TCH-15 | Assessment Builder | P0 | `teacher/assessments/new/page.tsx` | c | settings card, QuestionPalette, QuestionRenderer, sections/reorder | `POST /api/tuition/assessments`, `GET /api/tuition/question-bank`, `POST …/[id]/attempts`? *(+)* `POST /api/tuition/assessments/[id]/questions` | assessment_sections, assessment_questions, questions | API + IDB |
| TCH-16 | Assessment results | P0 | `teacher/assessments/[id]/results/page.tsx` | s+c | ScoreDial, TuitionTable, per-question bars, export | `GET /api/tuition/assessments/[id]/attempts` | assessment_attempts, assessment_attempt_details | SSR |
| TCH-17 | Question Bank | P0 | `teacher/question-bank/page.tsx` | s+c | TuitionTable (type/difficulty filters), UsageCount | `GET/POST/PATCH/DELETE /api/tuition/question-bank` | questions | SSR + API |
| TCH-18 | Question editor | P0 | `teacher/question-bank/new/page.tsx` | c | QuestionRenderer(edit), options editor, markup fields | `POST/PATCH /api/tuition/question-bank` | questions ▸ questions | API |
| TCH-19 | Live classes manage | P1 | `teacher/classes/page.tsx` | s+c | TuitionTable, schedule form, replay list | `GET /api/tuition/classes`, *(+)* `POST /api/tuition/classes` | live_classes | SSR + API |
| TCH-20 | Teacher Activities | P2 | `teacher/activities/page.tsx` | s+c | TuitionTable, ActivityCard | `GET /api/tuition/activities` | activities, activity_registrations | SSR |
| TCH-21 | Teacher Analytics | P1 | `teacher/analytics/page.tsx` | s+c | KPI blocks, Recharts, struggling-students list | `GET /api/tuition/analytics` | tuition_enrolment_daily_activity, attempts, submissions | SSR + API |

### D. School admin

| ID | Screen | P | Page | Type | Primary components | API route | DB reads / writes | Source |
|---|---|---|---|---|---|---|---|---|
| SCH-01 | School Tuition dashboard | P0 | `school/page.tsx` | s+c | KPI blocks, TuitionTable, BenchmarkCard | `GET /api/tuition/analytics`, `GET /api/tuition/network` | enrolments, programmes, attempts, network benches | SSR + API |
| SCH-02 | School Programmes | P0 | `school/programmes/page.tsx` | s+c | TuitionTable (adoption status), ProgrammeCard | `GET /api/tuition/programmes` | programmes (school), network_adoptions | SSR |
| SCH-03 | Programme analytics | P1 | `school/programmes/[id]/page.tsx` | s+c | KPI blocks, Recharts, TuitionTable | `GET /api/tuition/programmes/[id]`, `GET /api/tuition/analytics?programme_id` | enrolments, progress, assessment attempts | SSR + API |
| SCH-04 | Teachers | P1 | `school/teachers/page.tsx` | s+c | TuitionTable, workload badges | `GET /api/tuition/analytics?staff_id` | staff, programme_instructors | SSR |
| SCH-05 | Students | P1 | `school/students/page.tsx` | s+c | TuitionTable, ProgressBar | `GET /api/tuition/progress?school-wide` | students, tuition_student_users, enrolment | SSR |
| SCH-06 | Enrolments | P1 | `school/enrolments/page.tsx` | s+c | TuitionTable, bulk enrol modal, cohort select | *(+)* `POST /api/tuition/enrolments` (bulk class→programme) | programme_enrolments, programme_cohorts, classes | SSR + API |
| SCH-07 | School Assessments | P0 | `school/assessments/page.tsx` | s+c | TuitionTable (school + adopted), StatusPill | `GET /api/tuition/assessments` | assessments (publisher school or adopted), network_adoptions | SSR |
| SCH-08 | Adopt network assessment | P1 | `school/assessments/adopt/page.tsx` | s+c | TuitionTable, adopt confirm | *(+)* `POST /api/tuition/network/adopt` | network_publications ▸ network_adoptions, assessments copy | API |
| SCH-09 | Assessment participation | P1 | `school/assessments/[id]/page.tsx` | s+c | TuitionTable, ScoreDial, per-strand | `GET /api/tuition/assessments/[id]/attempts` | attempts, details, strands | SSR |
| SCH-10 | Activities & events | P1 | `school/activities/page.tsx` + `school/events/page.tsx` | s+c | TuitionTable, approve modal, fixtures | `GET /api/tuition/activities`, *(+)* `PATCH /api/tuition/activities/[id]` | activities ▸ status, activity_matches | SSR + API |
| SCH-11 | Network hub (school) | P1 | `school/network/page.tsx` | s+c | BenchmarkCard, TuitionTable, adopt CTAs | `GET /api/tuition/network`, `POST /api/tuition/network/adopt` | network_publications, network_benchmarks ▸ adoptions | SSR + API |
| SCH-12 | School analytics | P1 | `school/analytics/page.tsx` | s+c | KPI blocks, Recharts, BenchmarkCard | `GET /api/tuition/analytics`, `GET /api/tuition/network` | rollups, benchmarks | SSR + API |

### E. Network / platform

| ID | Screen | P | Page | Type | Primary components | API route | DB reads / writes | Source |
|---|---|---|---|---|---|---|---|---|
| NET-01 | Network dashboard | P1 | `network/page.tsx` | s+c | KPI blocks, BenchmarkCard | `GET /api/tuition/network` | network_publications, network_benchmarks | SSR |
| NET-02 | Network schools | P1 | `network/schools/page.tsx` | s+c | TuitionTable (aggregate only, no PII) | `GET /api/tuition/network?schools=1` | network_benchmarks, schools (name/count) | SSR |
| NET-03 | Network programmes | P1 | `network/programmes/page.tsx` | s+c | ProgrammeCard, adoption count | `GET /api/tuition/programmes?visibility=network` | network_publications(programme), programmes | SSR |
| NET-04 | Network assessments | P1 | `network/assessments/page.tsx` | s+c | TuitionTable, StatusPill, adopt CTA | `GET /api/tuition/assessments?publisher=network` | network_publications(assessment), assessments | SSR |
| NET-05 | Assessment detail/adopt | P1 | `network/assessments/[id]/page.tsx` | s+c | BenchmarkCard, adopt/participate | `GET /api/tuition/assessments/[id]`, `POST /api/tuition/network/adopt` | assessments, network_publications, network_benchmarks | SSR + API |
| NET-06 | Benchmarking dashboard | P1 | `network/benchmarking/page.tsx` | s+c | BenchmarkCard, ScoreDial, Recharts | `GET /api/tuition/network` | network_benchmarks (per_strand/percentile) | SSR |
| NET-07 | Activities network | P2 | `network/activities/page.tsx` | s+c | TuitionTable, leagues/standings | `GET /api/tuition/activities?network=1` | activities, activity_matches (aggregate) | SSR |
| NET-08 | Moderation queue | P2 | `network/moderation/page.tsx` | s+c | TuitionTable (pending), approve/reject | *(+)* `POST /api/tuition/network/moderate` | network_publications ▸ status, moderated_by | API |

`*(+)*` = endpoint proposed in Part 5 beyond `10-route-architecture.md` §4.

---

## PART 4 — Builder implementation mapping

### 4.1 Programme builder (`/tuition/teacher/programmes/new?step=1..5`)

| Step | Route | UI | Draft persistence | Server writes |
|---|---|---|---|---|
| 1 Details | `?step=1` | title, type, subject/grade/curriculum, difficulty, description, learning outcomes, cover dropzone, prerequisites | **IDB key** `tuition:programme-draft:{draftId}` (debounced 800ms) | `POST /api/tuition/programmes` → row `status=draft`; returns `programmeId`; subsequent saves `PATCH /api/tuition/programmes/[id]` |
| 2 Structure | `?step=2` | module tree + lesson rows; add/reorder/delete | IDB same key (structure subtree) | `POST /api/tuition/programmes/[id]/modules` (whole JSON normalized to `programme_modules`/`programme_lessons` rows; deleted rows soft-deleted) |
| 3 Content | `?step=3` | lesson editor (body markdown, resources via FileDropzone) | IDB (content per lesson) | `PATCH /api/tuition/programmes/[id]/lessons/[lid]`; resource upload via *(+)* `POST /api/tuition/upload` → `lessons_resources` |
| 4 Access | `?step=4` | visibility scope select, cohort mapping | IDB | `PATCH /api/tuition/programmes/[id]` (`visibility`, `programme_cohorts`) |
| 5 Review & Publish | `?step=5` | checklist + final `tuition`-variant Publish button | clear IDB (`DELETE` key) on success | `POST /api/tuition/programmes/[id]/publish` |

**Save-draft semantics**
- Autosave: local-first → IDB every 800ms after change; flush to server on "Save & exit" / step change / navigate away (with `beforeunload`), and on mutations (each step's server write also persists the draft row).
- Resume: on mount of `/new` (or `/new?step=` with a `draftId`), render repopulates from IDB first, then reconciles server draft (`GET /api/tuition/programmes/[id]`). "Continue editing" on TCH-02 drafts deep-links to `?step=` of the furthest-saved step.
- Draft list: TCH-02 shows `status=draft` rows under a "Drafts" filter tab.

**Publish validation — client & server (both must run)**
1. title ≥ 4 chars, description ≥ 10; 2. ≥ 1 module and ≥ 1 lesson per module; 3. every lesson has body or ≥ 1 resource; 4. subject/grade/curriculum set when type requires; 5. duration_weeks > 0; 6. visibility ∈ `private|school|classes|students|schools|network|public`; 7. cover optional (falls back to gradient).
- Server returns `VALIDATION_ERROR` (422, `metadata.details[]`) on failure; client blocks the Publish button until checklist green.

**Versioning**
- MVP: single version; publish overwrites live columns and stamps `published_at`. `programme_snapshots` (content hash) is a P2 — any in-flight "published" content that teachers are mid-edit on remains visible as the published row until republish. Flagged `TODO-consistency-note` (see Part 7).

### 4.2 Assessment builder (`/tuition/teacher/assessments/new`)

| Phase | Draft state | Endpoints | Notes |
|---|---|---|---|
| Settings | **IDB** `tuition:assessment-draft:{id}` — title, description, grade/subject/curriculum, duration, grader, result_visibility, availability window, attempt_limit, shuffle | `POST /api/tuition/assessments` (creates `status=draft`), `PATCH /api/tuition/assessments/[id]` | grader auto for mcq/TF/multi-select; manual for essay; hybrid otherwise |
| Sections + questions | IDB (same key) + server `assessment_sections` + `assessment_questions` bridge | *(+)* `POST /api/tuition/assessments/[id]/sections`, `POST /api/tuition/assessments/[id]/questions`; question picker reads `GET /api/tuition/question-bank` | reorder via position; inline "create new question" calls `POST /api/tuition/question-bank` |
| Publish | clear IDB on success | `POST /api/tuition/assessments/[id]/publish` *(equivalent of programme publish)* | see validation below |

**Publish validation**
1. ≥ 1 section; 2. ≥ 1 question per section; 3. `sum(marks)` == `total_marks` set; 4. every question type answerable + options valid (mcq/TF require `is_correct`; essay/practical require rubric note); 5. duration_min > 0; 6. attempt display of `result_visibility` sane for chosen grader; 7. uniqueness — `assessment_questions` PK `(assessment_id, question_id)` prevents double-add.

**Versioning:** attempt data is immutable once submitted; republishing after results must version (`assessment_version int`) and never mutate answered questions. MVP ships version 1 only; P2 adds version field. Same `TODO` flag as 4.1.

---

## PART 5 — New API contracts (skim-level)

All under `src/app/api/tuition/`. Every handler: `export const GET/POST/... = createRoute(async ({ request, user, supabase, searchParams }) => {...})`. Auth order inside handler: `requireSchoolContext(user.id)` → `requirePermission(user.id, ctx.schoolId, resource, action)` → optional `requireBillingPlanFeature`/`requireFeature`.

Permissions use tuition resources/actions (Part 6): e.g. `tuition_programme.read` etc. Student/parent operations instead verify the identity link (`tuition_student_users`/`students.parent_user_id`) — not member roles.

| # | Method & path | Auth (`requirePermission`) | Request body | Response | Key validation | Consumes (screens) |
|---|---|---|---|---|---|---|
| 1 | `GET /api/tuition/programmes` | `tuition_programme.read` | — | `{ programmes: ProgrammeSummary[] }` (scoped by role: own/published/school/network) | `visibility` filter, `status` filter, search `q`, `grade`/`subject` | STU-02/03, TCH-01/02, SCH-01/02, NET-03 |
| 2 | `POST /api/tuition/programmes` | `tuition_programme.create` (teacher/principal; requires feature flag) | `{ title, type, subject_id?, grade_id?, curriculum_id?, description, learning_outcomes[], difficulty, cover_url?, visibility? }` | `201 { programme: { id, status: "draft" } }` | title ≥4, description ≥10, type enum; scope validated to school | TCH-03 |
| 3 | `GET /api/tuition/programmes/[id]` | `tuition_programme.read` + ownership/visibility | — | `{ programme, modules[], instructors[], reviews[] }` | 404 if not visible; draft requires owner/principal | STU-04, TCH-08 |
| 4 | `PATCH /api/tuition/programmes/[id]` | `tuition_programme.update` + creator/principal | partial programme fields | `{ programme }` | not allowed on `archived`; updater must be owner staff or principal | TCH-04/06 |
| 5 | `DELETE /api/tuition/programmes/[id]` | `tuition_programme.delete` | — | `204` | soft-delete `is_active=false`; reject if published + has live enrolments (→ archive instead) | TCH-02 |
| 6 | `POST /api/tuition/programmes/[id]/modules` | `tuition_programme.update` | `{ modules: ModuleNode[] }` (whole structure) | `200 { modules }` | normalize to programme_modules/programme_lessons; ordering by `position` | TCH-04 |
| 7 | `GET/PATCH /api/tuition/programmes/[id]/lessons/[lid]` | `tuition_lesson.read` / `tuition_lesson.update` | body: `{ title?, summary?, content_type?, body?, duration_min?, is_preview?, status? }` | `{ lesson, resources[] }` | content_type enum; `body` JSON; lesson belongs to programme | TCH-05/10 |
| 8 | `POST /api/tuition/programmes/[id]/publish` | `tuition_programme.publish` (creator/principal) | — | `200 { status: "published", published_at }` | runs Part 4.1 checklist → 422 with details | TCH-07 |
| 9 | `POST /api/tuition/enrol` | `tuition_programme.enrol` (student or teacher-on-behalf) | `{ programme_id, cohort_id? }` via query `?programme_id=` | `201 { enrolment }` or `200 { enrolled: true }` | programme published + visible + not already active; attempt_limit semantics N/A | STU-04, SCH-06 |
| 10 | `DELETE /api/tuition/enrol` | `tuition_programme.enrol` | — | `200 { dropped: true }` (status → dropped) | cannot drop completed with certificates | STU-05 |
| 11 | `GET /api/tuition/my-learning` | student identity OR `tuition_programme.read` | — | `{ programmes[] }` each `{ programme, progressPct, enrolmentStatus, nextLessonId }` | scoped to caller's students | STU-01/05 |
| 12 | `GET /api/tuition/progress` | student self OR `tuition_programme.read`/`tuition_lesson.read` with `student_id` query | `?student_id=` (teacher/school) | `{ streaks, subjectProgress[], completionPct, weakTopics[], perProgramme[] }` | only caller's students unless teacher/principal | STU-01/18, TCH-11, TCH-12 |
| 13 | `POST /api/tuition/lessons/[id]/complete` | `tuition_lesson.read` + student owns enrolment | `{ progress_pct, time_spent_sec, last_position_sec? }` | `200 { lesson_progress, next_lesson_id? }` | lesson unlocked; video lessons require ≥ last_position_sec | STU-06 |
| 14 | `GET/POST/DELETE /api/tuition/notes` | student self (or teacher read) | POST `{ lesson_id, text }` | `200 { note }` | `lesson_id` belongs to enrol; text ≤ 20k chars | STU-06 |
| 15 | `GET /api/tuition/assignments` | student: own list via identity link (always); teacher: `tuition_assessment.read` (programme-scoped) | — | `{ assignments[] }` | role-scoped visibility | STU-08, TCH-13 |
| 16 | `POST /api/tuition/assignments` | `tuition_assessment.create` (within a programme context — an assignment **is** a manual-grade assessment; there is no separate assignment resource) | assignment fields | `201 { assignment }` | open_at < due_at; allow_late; points ≥0 | TCH-13 |
| 17 | `GET /api/tuition/assignments/[id]/submissions` | teacher: `tuition_assessment.grade` | — | `{ submissions[] }` | only for assignments owned/taught | TCH-13 grading |
| 18 | `POST /api/tuition/assignments/[id]/submissions` | student self (submit/update draft) | `{ action: "draft"\|"submit", body?, files?[] }` | `200 { submission, status }` | after due_at → `late` (if `allow_late`) else 409; UNIQUE(assignment_id, student_id) | STU-09 |
| 19 | `GET/POST /api/tuition/assessments` | read: `tuition_assessment.read`; create: `tuition_assessment.create` | POST assessment fields | `201 { assessment }` | status transitions; duration_min>0; publisher=network requires moderation | STU-10, TCH-14, SCH-07, NET-04 |
| 20 | `GET /api/tuition/assessments/[id]/attempts` | student self (resume/result); teacher/school `tuition_assessment.grade`/`read` | `?student_id=` | `{ attempt }` + questions (student: own) or per-student list (teacher) | in-progress returns sanitized (no correct_answers) | STU-12/13, TCH-16, SCH-09 |
| 21 | `POST /api/tuition/assessments/[id]/attempts` | student self + enrolled | `{ action: "start"\|"answer"\|"submit", question_id?, answer?, flag? }` | `200 { attempt }` / `201 { graded_results }` | start: status→in_progress, honor attempt_limit; answer: autosave `attempts.answers` jsonb; submit: grades auto/hybrid, computes `assessment_attempt_details` | STU-11/12 |
| 22 | `GET /api/tuition/question-bank` (`?q&type&difficulty&page`) | `tuition_content.read` (teacher) | — | `{ questions[], total }` | school-scoped rows | TCH-15/17 |
| 23 | `POST/PATCH/DELETE /api/tuition/question-bank` | `tuition_content.create/update/delete` | question fields + options/answers | `201/200/204` | marks>0; mcq/TF need is_correct; stem non-empty | TCH-17/18 |
| 24 | `GET /api/tuition/activities` | `tuition_activity.read` | — | `{ activities[] }` | role/scope visibility | STU-16/17, TCH-20, SCH-10, NET-07 |
| 25 | `POST /api/tuition/activities` (`register` payload) | `tuition_activity.enrol` (student) / `tuition_activity.create` (teacher) | `{ activity_id?, action: "register"\|"create", ... }` | `201 { registration }` / `201 { activity }` | capacity gate; status=registrations only | STU-17, TCH-20, SCH-10 |
| 26 | `GET /api/tuition/classes` | `tuition_live.read` | — | `{ upcoming[], live[], replays[] }` | joined via programme enrolment | STU-14, TCH-19 |
| 27 | `GET /api/tuition/network` | `tuition_network.read` (principal+super_admin; teacher read-only adopt view) | `?schools=1&assessment_id=` | `{ benchmarks[], participation[], leagues[] }` **aggregate only** | never returns student rows; `sample_size` floor before showing percentile | NET-01/02/05/06, SCH-01/11/12 |
| 28 | `GET /api/tuition/analytics` | `tuition_programme.read`/`tuition_activity.read` | `?programme_id&staff_id&school_wide` | `{ enrolments, completion, assessmentMean, engagement[], struggling[] }` | reads rollups (`tuition_enrolment_daily_activity`) when available | TCH-01/08/21, SCH-01/03/04/12 |

**Additional proposed endpoints** (not in spec file 10 §4; required by the matrix above — flag as additions):
| Method & path | Auth | Purpose | Consumers |
|---|---|---|---|
| `GET/POST/PATCH/DELETE /api/tuition/notifications` | read self / write self | tuition-specific notification prefs + read/patch | SYS-03 |
| `GET /api/tuition/search` | any tuition role | cross-entity search | SYS-02 |
| `POST /api/tuition/upload` | `tuition_content.create` | presign+record lesson/submission file uploads (resolved storage per Part 7 risk) | STU-09, TCH-05/09 |
| `POST /api/tuition/enrolments` | `tuition_programme.enrol` (principal/teacher) | bulk class→programme enrol | SCH-06 |
| `POST /api/tuition/network/adopt` | `tuition_network.create` (principal) | copy assessment/programme into school | SCH-08/11, NET-05 |
| `POST /api/tuition/network/moderate` | `tuition_network.update` (super_admin) | publication approve/reject | NET-08 |
| `POST /api/tuition/classes/[id]/join` | `tuition_live.enrol` | live attendance | STU-15 |
| `POST /api/tuition/assessments/[id]/publish` | `tuition_assessment.publish` | assessment publish (parallel to programme publish) | TCH-15 |
| `POST /api/tuition/onboarding` | student self | onboarding prefs + recommendations | SYS-06 |
| `GET/POST /api/tuition/teacher-notes` | `tuition_lesson.update` + teacher | notes/interventions | TCH-12 |

**Live classes — provider decision (settled, was T8).** `live_classes.provider`
defaults to `'decimal'`: the live room is a **Decimal replay + chat room — no
WebRTC in P1**. `LiveRoom` (Part 1.4) renders the replay video + chat/Q&A/polls
for `provider='decimal'`, and surfaces an optional external `meeting_url`
(Google Meet/Zoom) embed on the room as a **"Join via video link"** fallback when
a teacher supplies one. `recording_url` holds the replay after the class ends,
moving the class into the STU-14/TCH-19 replay list. First-party WebRTC rooms are
**Phase 2** and out of scope for P1; `join_links jsonb` is retained for that
future provider slot. (Risk R7 annotated RESOLVED — see Part 7.3.)

---

## PART 6 — Gating, flags & permissions wiring

### 6.1 Feature flag (master switch)

| Field | Value |
|---|---|
| table | `feature_flags` |
| `key` | `decimal_tuition` |
| `name` | `Tuition (Learn/Teach/Assess/Activities/Network)` |
| `description` | Master switch for the Tuition product across all portals |
| `scope` | `school` — schools override via `school_feature_flags` |
| default `is_enabled` | `true` (seeded `ON` in migration **034**; platform can disable per school) |

Checked by `isFeatureEnabled(schoolId, "decimal_tuition")` in `(tuition)/layout.tsx`
and `requireFeature` in every tuition mutation API (guards in 6.4).

### 6.2 Billing plan feature

`plans.features` (billing JSON) gains `"tuition": true` on **starter, pro, enterprise**; **free** omits it.

- `requireBillingPlanFeature(schoolId, "tuition")` on `POST`-family tuition endpoints (create/publish/adopt) and on layout first-load alongside the flag.
- **Free-plan gate:** tuition routes render `TuitionGate` (full-page upsell at
  `/tuition/upgrade`): "Tuition is available on Starter and above" + upgrade CTA
  → `/principal/billing/plans`. Read-only student view on free is also blocked —
  gate applies to the product, not per-action.
- Billing resolution: reads active sub (trialing/active/past_due) then entitlement.

### 6.3 Permission resources & role matrix

New resources (insert into `permissions`): `tuition_programme`, `tuition_lesson`,
`tuition_assessment`, `tuition_activity`, `tuition_live`, `tuition_network`,
`tuition_content`. Actions: `read, create, update, delete, publish, enrol, grade`.
Insert `(resource, action)` pairs + `role_permissions` rows in migration **034**.

| resource \ role | super_admin | principal | teacher | timetable_manager | finance | admissions_officer | secretary |
|---|---|---|---|---|---|---|---|
| `tuition_programme` | all 7 | all 7 | read, create, update, publish, enrol | read | read | read | read |
| `tuition_lesson` | all 7 | all 7 | read, create, update, publish, enrol | read | read | read | read |
| `tuition_assessment` | all 7 | all 7 | read, create, update, publish, grade | read | read | read | read |
| `tuition_activity` | all 7 | all 7 | read, create, update, publish, enrol | read | read | read | read |
| `tuition_live` | all 7 | all 7 | read, create, update, publish, enrol | read | read | read | read |
| `tuition_network` | all 7 | all 7 | read | read | read | — | — |
| `tuition_content` | all 7 | all 7 | read, create, update, delete, publish | read | read | — | — |

(`enrol` grants both self-enrol and on-behalf enrolement; `grade` covers attempt/submission grading.)

**Assignments use `tuition_assessment` entirely (settled, was T9).** An assignment
**is** a manual-grade assessment scoped to a programme module — there is no
`tuition_assignment` resource and no `tuition_lesson`/`tuition_activity` mapping.
Create/update/publish assignment → `tuition_assessment.create` / `.update` /
`.publish` within a programme context; grade/submissions →
`tuition_assessment.grade`; view own submissions → student via the identity link,
**always** (no permission row). Part 5 rows 15–16 and the `tuition_assessment`
column above are authoritative.

**Students & parents are resolved separately — NOT via `member_role`:**
- `student` ⇀ linked via `tuition_student_users` (or `students.parent_user_id`); the layout resolves `StudentView` and APIs verify the identity link, then allow `read`, `enrol`, answer/`submit` (attempt), upload submission. No `role_permissions` row.
- `parent` ⇀ read-only mirror of their linked children's tuition view (progress, results, assignments); no writes.

### 6.4 Where guards are invoked

| Layer | Guard | Location |
|---|---|---|
| Middleware | `isProtectedPath("/tuition")` + `routeRoleMap` coarse space gate | `src/lib/auth-config.ts` (**edit**: add `/tuition` to `protectedPaths`; add the 4 routeRoleMap entries from `10-route-architecture.md` §3 — see Part 7 TODO for the missing roles in those lists) |
| Layout | role resolution, student identity link, `isFeatureEnabled("decimal_tuition")`, `requireBillingPlanFeature` for write-capable users | `(tuition)/layout.tsx` + `player-layout.tsx` |
| Page (server) | `requireSchoolContext` (from `(platform)/layout`), per-resource `requirePermission(resource, "read")` | each tuition page server wrapper |
| API | `createRoute` → `requireSchoolContext(user.id)` → `requirePermission(user.id, ctx.schoolId, resource, action)` → `requireBillingPlanFeature` | every `/api/tuition/...` handler |
| API (student) | identity-link check instead of `has_permission` (attempts, notes, enrol, submissions) | student-facing tuition handlers |
| Service | `hasPermission`/`requirePermission` from `@/lib/services/rbac` against Postgres `has_permission` | reused verbatim |

---

## PART 7 — Consistency & gap audit

### 7.1 Inconsistencies between the spec files (`TODO-consistency-note`)

1. **T1 — Screen-count math.** **RESOLVED** — P0/P1/P2 inventory recounted (full 67-screen enumeration: 6 SYS + 20 STU + 21 TCH + 12 SCH + 8 NET) and the P0 cut (~33) reconciled with the MVP scope statement; owner: `04-screen-inventory.md` (sibling editor).
2. **T2 — `"student"` / `"parent"` are not `member_role` values.** **RESOLVED** — the tuition **layout** resolves student/parent identity links (middleware stays member-role-only), and read-only roles `finance`, `admissions_officer`, `secretary` were added to `routeRoleMap` per the Part 6 matrix; owners: `02-information-architecture.md` + `10-route-architecture.md` (sibling editors).
3. **T3 — `/tuition/network` role list.** **RESOLVED** — teacher is a permitted participant/adopter per `tuition_network.read`; role maps reconciled with the inventory; owners: `10-route-architecture.md` / `04-screen-inventory.md` (sibling editors).
4. **T4 — Stray editor note in data model.** **RESOLVED** — `programme_enrolments` block cleaned to `programme_id` only; owner: `11-data-model.md` (sibling editor).
5. **T5 — `programme_modules`/`programme_lessons` naming.** **RESOLVED** — exact table names `programme_modules`, `programme_lessons` kept; route endpoints pluralise the table names; naming aligned across both files; owners: `11-data-model.md` + `10-route-architecture.md` (sibling editors).
6. **T6 — Attempt uniqueness.** **RESOLVED** — `attempt_no` on **all** attempts with a partial unique index `UNIQUE(assessment_id, student_id) WHERE attempt_no = 1` when limit=1; owner: `11-data-model.md` (sibling editor).
7. **T7 — Button variant.** **RESOLVED (this file)** — `variant="tuition"` → `bg-tuition-accent text-white hover:bg-tuition-accent/90 focus-visible:ring-tuition-accent/50`, inheriting existing size/geometry/loading/disabled rules from `@/components/ui/button`. Prerequisites: `--tuition-accent` token in `globals.css` §1.1 **and** the `tuition` variant added to `button.tsx` (§1.2). Must land **before any tuition component**.
8. **T8 — `live_classes.provider` placeholder.** **RESOLVED (this file)** — `provider` settles to `'decimal'` = Decimal replay + chat (no WebRTC); optional external `meeting_url` embed surfaces as "Join via video link"; `recording_url` holds the post-end replay; WebRTC is Phase 2. See Part 5 note + `LiveRoom` registry entry; risk R7 annotated RESOLVED.
9. **T9 — Assignment permission homes.** **RESOLVED (this file)** — assignments reuse **`tuition_assessment`** entirely (an assignment **is** a manual-grade assessment scoped to a programme module): create/update/publish → `tuition_assessment.create` / `.update` / `.publish`; grade/submissions → `tuition_assessment.grade`; students always view own submissions via the identity link. See Part 5 rows 15–16 and Part 6.3.
10. **T10 — Notifications deep links.** **RESOLVED** — SYS-03 render rule for `deep_link` values starting `/tuition` specified in the system/wireframe doc; owner: `08-wireframes-system.md` (sibling editor).
11. **T11 — `programme_reviews`.** **RESOLVED** — table added to the migration set (028/032); owner: `11-data-model.md` (sibling editor).

### 7.2 Missing screens/components (P2 backlog — reasonably expected)

- Parent portal tuition mirror (parent read-only dashboards: `/parent/tuition/...`) — currently parents only get the shared student view.
- Discussion/Q&A per lesson (thread comments) — no screen/table (P2; DB `lesson_discussions`).
- Co-hort management UI beyond SCH-06 bulk enrol (cohort create/rename/archive).
- Teacher assignment-grading detail page (per-submission grade+feedback modal is folded into TCH-13; a dedicated `assignments/[id]/grade` is cleaner).
- Programme clone/duplicate action; assessment duplicate-to-question-bank.
- Live class replay detail + recording management (P2; `recording_url` exists).
- Batch/queue view for tuition offline sync (which lessons/attempts pending flush).
- Badges/certificate admin (issuance rules) — STU-19/20 consume but nothing creates.
- Network moderation detail view (NET-08 list only).
- Notifications preferences for tuition channels (`notification_preferences` exists).
- Reportable school tuition export bundle (PDF grade + analytics — consumes `PrintButton`).
- ~~Missing components:~~ `ActivityCard`, `NotesPanel`, `LiveRoom`, `FixtureTable` — **added to the Part 1.4 registry** (no longer missing; removed from this P2 backlog).

### 7.3 Engineering risk list

| Risk | Detail | Mitigation |
|---|---|---|
| **R1 — Offline player** | Lesson content, covers, notes, and video must work offline on PWA; serwist caching target complexity, stale content | `NetworkFirst()` for lesson URLs + `CacheFirst` for covers/assets; IDB mirrors lesson JSON + notes; sync engine flushes `lesson_progress` + `notes` + submission drafts; `OfflineBanner` + `SyncIndicator`; version cache keys on publish |
| **R2 — Assessment anti-abuse** | Timer drift, tab-switching, copy/paste, multi-tab attempts, answer tampering | Server-side authoritative `deadline` (client countdown ⇀ render only); autosave answers server-side each change; `attempt_status` + `started/submitted_at` logged; resubmit rejected after `submitted`; answer digest check on submit (auto question types); attempt opened in single Session-scoped lock (409 on parallel window); flag-only palette, no copy for essay until submit |
| **R3 — Network PII** | `network_benchmarks`/network screens must never leak student identity; RLS cross-school breach | Benchmarks written only by service-role cron from `assessment_attempt_details` grouped by `school_id`; read policy `school_id IN get_user_school_ids()`; API strips student rows before network response; `sample_size` floor (e.g. ≥5) before percentiles; audit log on moderation |
| **R4 — RLS recursion on `school_members`** | New tuition policies must not call `get_user_school_ids()` inside a `school_members` policy (house rule); easy to reintroduce with "teachers of programme X" joins | Copy boilerplate verbatim from `_context` §5; join via `programme_instructors`/`programme_enrolments`/`students.class_id` instead of querying school_members in-policy; regression-check migration 026-style fixes |
| **R5 — File upload storage** | Lesson resources + submissions + practical answers; Supabase Storage bucket/RLS, S3 costs, virus scanning, large video | New bucket(s) `tuition-resources`, `tuition-submissions` with storage RLS (school/lesson-scoped); presign uploads via `POST /api/tuition/upload`; mime/size whitelist; video transcode later (P2) — MVP streams original with `<video>` |
| **R6 — Builder data loss** | Browser crash mid-step, nav away, stale drafts | IDB-first resume + debounced autosave + `beforeunload` flush; server draft rows (status=draft) as durable fallback; never auto-publish drafts |
| **R7 — Live classes provider lock-in** | **RESOLVED (T8).** `provider` settled to `'decimal'` = Decimal replay + chat (no WebRTC); external video via optional `meeting_url` "Join via video link" embed; `recording_url` holds the post-end replay | `LiveRoom` hides the provider behind its `provider` prop; P1 ships `'decimal'` only; first-party WebRTC is **Phase 2**; `join_links jsonb` retained for that future slot |
| **R8 — Markdown XSS** | Lesson/instruction bodies from teachers render in player | Whitelist renderer (no raw HTML), `dangerouslySetInnerHTML` only for sanitized output or not at all; server strips `<script`/styles on PATCH |
| **R9 — Attempt concurrency + grade consistency** | Simultaneous autosave vs submit; manual grading race | Row-level `assessment_attempts` update only when `status='in_progress'`; submit transitions atomically (`status` guard in WHERE); grading writes to `assessment_attempt_details` after final submit only |
| **R10 — Scale of aggregation** | Realtime analytics on `lesson_progress`/attempts grows fast | `tuition_enrolment_daily_activity` rollup via cron (034); analytics endpoints read rollups, fall back to live counts only under threshold rows |

---

### Document end

This map is the implementation contract for the Tuition build. Work items that
touch `button.tsx`, `auth-config.ts`, `globals.css`, or migration numbering must
land before the components/pages that depend on them. All `TODO-consistency-note`
items (T1–T11) should be resolved in the relevant half of the spec before coding
the affected screens.