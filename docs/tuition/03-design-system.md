# DECIMAL TUITION — SPEC FILE 03 — Design System (wireframe level)

> Built on the audited Decimal tokens (see `_context.md`). Tuition **extends**, never replaces.

## 1. Typography

Font families: **Geist Sans** (`--font-geist-sans`) for everything UI; **Geist Mono** (`--font-geist-mono`) for timestamps, codes, IDs, marks. Headings use Geist Sans with `font-heading` mapping.

| Role | Font/weight | Size / line-height | Track | Usage |
|---|---|---|---|---|
| Display | Geist Sans 700 | text-4xl (2.25rem) / 1.1 | -0.03em | Player page, programme hero, welcome |
| H1 | Geist Sans 700 | text-2xl (1.5rem) / 1.25 | -0.02em | Page headers (matches Decimal `text-2xl font-bold`) |
| H2 | Geist Sans 600 | text-lg (1.125rem) / 1.4 | 0 | Section titles in pages |
| H3 | Geist Sans 600 | text-base (1rem) / 1.5 | 0 | Card titles (`font-heading text-base font-medium` existing) |
| H4 | Geist Sans 500 | text-sm (0.875rem) / 1.5 | 0 | Sub-group labels |
| Body | Geist Sans 400 | text-sm / 1.5 | 0 | Default UI text (Decimal standard) |
| Body small | Geist Sans 400 | text-xs / 1.5 | 0 | Dense captions, meta rows |
| Caption | Geist Sans 500 | text-xs / 1.4 | +0.04em uppercase | Eyebrows, table headers (`uppercase tracking-wide` existing) |
| Label | Geist Sans 500 | text-sm / 1.5 | 0 | Form labels (`text-sm font-medium`) |
| Navigation | Geist Sans 500 | text-sm | 0 | Sidebar/bottom bar items |
| Table text | Geist Sans 400/500 | text-sm (rows), text-xs (dense) | 0 | Tables |
| Code / technical | Geist Mono 400 | text-xs | 0 | Student IDs, refs, marks |
| Numeric emphasis | Geist Sans 700 | text-2xl | -0.02em | KPIs, scores |

## 2. Color system

### 2.1 Core (inherited, exact) — see `_context.md` §2. Reused verbatim: background, foreground, card/popover, primary, primary-foreground, secondary, muted, accent, destructive, border, input, ring, success, warning, info, sidebar family, chart-1..5.

### 2.2 NEW Tuition semantic tokens (add to `globals.css` `:root` + `.dark`)

Derived from the Decimal brand (indigo primary + violet→cyan glow). Tuition uses a **violet-lavender identity** ("learn" signal) distinct from School Management's neutral/indigo primary:

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--tuition-accent` | oklch(0.52 0.21 280) (`#594DDC`) | oklch(0.62 0.22 285) | Tuition primary controls, active nav, progress fills |
| `--tuition-accent-foreground` | oklch(0.985 0 0) | oklch(0.985 0 0) | Text on accent |
| `--tuition-learn` | oklch(0.60 0.15 255) | oklch(0.62 0.14 255) | Learning/programme tint (blue) |
| `--tuition-assess` | oklch(0.52 0.21 280) | oklch(0.58 0.20 285) | Assessments/quizzes tint (violet) |
| `--tuition-activity` | oklch(0.648 0.15 160) | oklch(0.66 0.14 160) | Activities/sport tint (green) — reuse `--success` hue family |
| `--tuition-network` | oklch(0.768 0.164 85) | oklch(0.76 0.15 85) | Network/benchmark tint (amber) — reuse `--warning` hue family |
| `--tuition-live` | oklch(0.623 0.16 255) | oklch(0.66 0.15 255) | Live classes tint (blue) — reuse `--info` hue family |
| `--tuition-progress` | oklch(0.648 0.15 160) | oklch(0.66 0.14 160) | Progress/completion fills (green) |

Usage rules:
- The **primary action** CTA inside Tuition uses `bg-tuition-accent text-tuition-accent-foreground hover:bg-tuition-accent/85` instead of `bg-primary`, giving instant visual differentiation while keeping the same geometry.
- **Tints are used as soft backgrounds at low opacity** for icon chips and badges (e.g. `bg-tuition-assess/10 text-tuition-assess`), never as full-page fills.
- The 5 Tuition spaces map to a fixed color dot/eyebrow: Learn=blue, Teach=violet, Assess=violet (dark variant), Activities=green, Network=amber.
- **Do not overuse color.** Default surfaces stay `bg-card`/`bg-background`. Tint only where it answers a question (status, space, warning).

## 3. Spacing (Tailwind default scale)

- Component spacing: 1 (0.25rem) granular.
- Page rhythm: `space-y-6` between page sections; `gap-4` in grids; `p-6` card padding, `p-5` KPI cards, `p-4` section headers.
- Content max-width: player/story screens `max-w-4xl`; admin/dense screens full width with `space-y-6`.
- Breakpoints: `sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 (matches existing).

## 4. Radius

| Element | Value |
|---|---|
| Buttons | `rounded-lg` (existing) |
| Cards / tables / inputs | `rounded-xl` (existing) |
| Modals / sheets | `rounded-xl` |
| Badges / pills / tags | `rounded-4xl` (existing — full pill) |
| Icon chips | `rounded-lg` |
| Container (immersive player chrome) | `rounded-2xl` |

## 5. Shadows (from `--shadow-*` — extend existing palette)

| Level | Spec |
|---|---|
| none | default |
| subtle | `shadow-sm` (list rows, cards-in-cards) |
| elevated | `shadow-md` (sectioned cards, dropdowns — existing `shadow-md`) |
| modal | `shadow-xl ring-1 ring-foreground/10` (existing modal recipe) |

## 6. Icons

- **Lucide** (inherited). `size-4` default in buttons (`[&_svg:not([class*='size-'])]:size-4`), `size-3.5`/`size-3` in sm/xs, `size-4` in list rows, `h-5 w-5` in empty states.
- Stroke weight default, no filled variants.
- Space marker icons (fixed): Learn=BookOpen, Teach=Library, Assess=ClipboardCheck, Activities=Trophy, Network=Globe2.

## 7. Buttons (extend Button component — new variant `tuition`)

`variant: "tuition"` → `bg-tuition-accent text-tuition-accent-foreground hover:bg-tuition-accent/85` (same base geometry as `default`). All other variants reused as-is:

| Variant | When |
|---|---|
| `default` | neutral primary actions (enrol, save) inside Admin screens |
| `tuition` | the *hero* CTA inside Tuition experiences (Start Learning, Publish, Take Assessment) |
| `glow` | marketing/hero emphasis only (landing, empty states) |
| `outline` | secondary actions, "Save & later" |
| `secondary` | bulk row actions, toolbar buttons |
| `ghost` | icon rows, toolbar helpers, close |
| `destructive` | destructive confirmations |
| `link` | inline navigation "View all" |
| icon sizes | `icon-sm` in table rows, `icon` in toolbars, `icon-lg` in player chrome |

Loading: swap child for `<Loader2 className="mr-2 h-4 w-4 animate-spin" />` + label. Disabled: `disabled:opacity-50`.

## 8. Forms

All inputs follow the existing canonical class (see `_context.md` §1) and `space-y-1.5` label clusters; labels `text-sm font-medium`, required `*`, helper text `text-xs text-muted-foreground`.

| Control | Spec |
|---|---|
| text / email / password / number / tel | canonical input class |
| textarea | same + `min-h-24 resize-y` |
| select | canonical + `appearance-none` + chevron |
| multi-select | chips input: pill tags + `X` remove + `+ Add`; or `DropdownMenu` with check items |
| search | canonical search input (icon left) |
| date picker | native `date` input styled to canonical (avoids new dep) |
| file upload | dropzone card `border-dashed` + browse button; list uploaded |
| rich text editor | plain textarea first (MVP); future TipTap only if needed (avoid new deps in MVP) |
| checkbox / radio | native styled with `accent-primary` or shadcn pattern |
| toggle | existing `button` switch pill pattern (annual toggle in billing) |
| slider | range input styled; used for marks/weight |

Validation: `err?.field ? "text-destructive"` + `border-destructive` + inline `text-xs text-destructive` message. Submit disabled while pending; failure → inline banner, not toast.

## 9. Feedback

| Kind | Spec |
|---|---|
| Toast | existing `toast(message)` — success/neutral (string only). Reserve for transient confirms. |
| Alert banner | `rounded-lg border border-{destructive|amber-300|emerald-300}/30 bg-{destructive|amber-50|emerald-50}/10 p-3 text-sm` + icon (existing pattern) |
| Confirm destructive | dedicated modal, destructive button untinted, explicit danger copy + entity name |
| Success state | full-screen success card on flow completion (`CheckCircle` in `rounded-full bg-emerald-100` + "Redirecting…") or inline emerald banner |
| Inline validation | under-field, red, with focus ring `border-destructive` |

## 10. New shared Tuition components (all in `src/components/tuition/`)

| Component | Props | Notes |
|---|---|---|
| `TuitionShell` | role, productSwitcher, children | same geometry as `PlatformShell`; adds Tuition rail + breadcrumbs; distinct rail accent |
| `ProductSwitcher` | activeProduct | dropdown (School Management / Tuition) |
| `SpaceRail` | spaces[] | left mini-rail mapping to the 5 spaces (Learn/Teach/Assess/Activities/Network) |
| `ProgrammeCard` | programme, meta, progress | cover, title, teacher, rating, students, duration, level chips, progress bar, enrol/continue state |
| `ProgrammeCover` | src, fallback, size | aspect-video cover w/ gradient fallback + initials |
| `ProgressBar` | value, tone (tuition-progress/success/warning) | `h-2 rounded-full bg-muted` + fill |
| `StatusPill` | status, toneMap | `StatusPill` around Badge (programme/enrolment/lesson/assignment/assessment/activity statuses per `_context.md` §7) |
| `LessonList` | modules, activeLessonId, progress | collapsible module tree with per-lesson state icons |
| `PlayerFrame` | chrome (header/progress/controls), content | immersive lesson layout |
| `QuestionRenderer` | question, answer, onChange | renders all question types (MCQ, multi-select, T/F, short answer, structured, essay, practical) |
| `QuestionPalette` | questions, flags, current | assessment navigator grid (numbered with flag markers) |
| `AssessmentTimer` | deadline, remaining | countdown; auto-submit at 0 |
| `MarkdownText` | text | safe-ish renderer (or plain `prose-custom`) |
| `EmptyState` | icon, title, action, actionLabel, children | unified empty-state card |
| `DataState` | loading/empty/error; skeleton | unified wrapper |
| `Skeleton` | className | `animate-pulse rounded-lg bg-muted` |
| `FileDropzone` | accept, onFiles | dashed upload card |
| `ScoreDial` | score, max | radial % + color tone for results |
| `BenchmarkCard` | schoolAvg, networkAvg, percentile, topics | network read-only metrics |
| `SearchOverlay` | query, results | global `/tuition/search` overlay |

## 11. Responsive rules (binding)

- **Desktop (≥lg):** two-pane (space rail + content) or three-pane (player). Dense tables visible.
- **Tablet (sm–lg):** rail collapses to icons; tables scroll within section cards; two-column grids collapse to one.
- **Mobile (<sm):** bottom tab bar for students; drawer for teacher; **player is single-column** with collapsed module list behind top-left drawer; assessment in focused mode (timer + palette); tables become stacked rows (label/value pairs) rather than horizontal scroll where interaction matters.
- **Offline/PWA:** lesson content, covers, and notes cache in IndexedDB via existing `src/lib/db.ts`/`sync.ts` patterns; show `Offline` pill (reuse `SyncIndicator`); queue submissions like `sync.ts` does for attendance.

## 12. Accessibility (WCAG 2.2 AA)

- Focus visible: existing `focus-visible:ring-3 focus-visible:ring-ring/50` preserved everywhere.
- Color contrast: tinted text always paired with sufficient-value token (use 500-weight+ on tinted backgrounds; check 4.5:1; body text never below `--muted-foreground` on `--background`).
- Touch targets ≥ 40px on mobile (bottom bars h-14, icon buttons ≥ 32px with padding).
- Keyboard: all overlays focus-trap + Escape closes; palettes arrow-key navigable; player has obvious `[Space]` play/pause + skip.
- Screen readers: `aria-label`s on icon-only buttons; `aria-current="page"` on active nav; tables with `caption` + `scope="col"`; live regions (`role="status"`) for autosave/timer warnings.
- Reduced motion: `prefers-reduced-motion` disables drift/zoom (existing pattern); animations are transitions only.
- Captions: video lessons MUST accept caption files; transcripts available.

## 13. Tokens summary (new additions only)

`--tuition-accent`, `--tuition-accent-foreground`, `--tuition-learn`, `--tuition-assess`, `--tuition-activity`, `--tuition-network`, `--tuition-live`, `--tuition-progress`, plus derived Tailwind utilities via `@theme inline` (`bg-tuition-accent`, `text-tuition-assess`, `bg-tuition-activity/10`, etc.). All other values inherited (see `_context.md §2`).