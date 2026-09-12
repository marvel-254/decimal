# Decimal Tuition — Product & UX Specification Suite

> Working spec for the **Decimal Tuition** sub-product. Doc-first: nothing below is
> implemented yet. Review this suite, resolve the consistency flags (§7), then build
> in vertical slices per `12-component-and-implementation-map.md`.

## Reading order

| # | File | What it covers |
|---|---|---|
| 0 | `_context.md` | **Source of truth.** Tokens, statuses, routes, roles, conventions. Read before everything. |
| 1 | `01-product-vision.md` | Mission, problems solved, value props, personas, scope, success metrics |
| 2 | `02-information-architecture.md` | Info architecture, role spaces, nav, sitemap, baseline test |
| 3 | `03-design-system.md` | Decimal tokens + Tuition extension (tuition accent/tints, new button variant), components |
| 4 | `04-screen-inventory.md` | Master screen list SYS/STU/TCH/SCH/NET × priorities (P0/P1/P2) |
| 5 | `05-wireframes-student.md` | Student screens STU-01…20 + onboarding (SYS-06) — full wireframes |
| 6 | `06-wireframes-teacher.md` | Teacher screens TCH-01…21 incl. 5-step Programme Builder — full wireframes |
| 7 | `07-wireframes-school-network.md` | School SCH-01…12 + Network NET-01…08 — full wireframes |
| 8 | `08-wireframes-system.md` | SYS screens, auth, billing/gating, modals, drawers, table system, state canon, responsive, nav |
| 9 | `09-user-flows-and-phases.md` | 14 master user flows, responsive rules, state round-up, MVP cut (9 slices), Phase 2, Future |
| 10 | `10-route-architecture.md` | Route groups, middleware/auth-config changes, `/api/tuition/*` surface |
| 11 | `11-data-model.md` | Proposed migration 028-034 tables, RLS, screen→entity mapping |
| 12 | `12-component-and-implementation-map.md` | Component registry, layout composition, screen→page→API→DB map, MVP slices, risks, **consistency flags T1–T11** |

## Spec volume

**75 screens specified** (6 system + 20 student + 21 teacher + 12 school + 8 network +
7 auth + 1 billing — see `04-screen-inventory.md`, authoritative recount) with per-screen
wireframes including layout ASCII, components, data, CTAs, permissions,
empty/loading/error/success/mobile/accessibility states.

**Key decisions locked in `_context.md`:** route prefixes `/tuition`, `/tuition/teacher`,
`/tuition/school`, `/tuition/network`; new permission resources (`tuition_programme`,
`tuition_lesson`, `tuition_assessment`, `tuition_activity`, `tuition_live`, `tuition_network`,
`tuition_content`); Programme as core object (Programme → Modules → Lessons); tuition
`--tuition-accent` violet token; student/PWA offline via IndexedDB + serwist; network
benchmarking **aggregated/anonymized only**; gated by feature flag `decimal_tuition` +
`plans.features.tuition` (Pro for network participation).

## Status legend

Each screen uses statuses defined in `_context.md` §7 — programme (draft/published/archived),
module, lesson (draft/published), enrolment (invited/active/completed/dropped), lesson progress
(in_progress/completed), assignment (draft/open/grading/closed), submission
(none/draft/submitted/late/graded), assessment (draft/scheduled/open/closed/published_results),
attempt (not_started/in_progress/submitted/graded), live class (scheduled/live/ended/cancelled),
activity (draft/registrations/in_progress/results/completed/cancelled), publication
(pending/approved/rejected/published).

## Resolution checklist before coding (from Part 7 of file 12)

1. **T1** ✅ RESOLVED — screen count reconciled at **75** (SYS 6 + STU 20 + TCH 21 + SCH 12 + NET 8 + AUTH 7 + BILL 1), P0 = 48 · P1 = 25 · P2 = 2 (04).
2. **T2** ✅ RESOLVED — identity bridge (student/parent at tuition layout via `tuition_student_users`/`students.parent_user_id`, not `member_role`) + finance/admissions_officer/secretary read-only tuition access (02, 10).
3. **T3** ✅ RESOLVED — teacher added to `/tuition/network` as read + participate; adopt/publish = principal+; moderation = super_admin (02, 10, 04).
4. **T4** ✅ RESOLVED — stray editor note cleaned; `programme_enrolments` → `programme_id` only (11).
5. **T5** ✅ RESOLVED — table names `programme_modules`, `programme_lessons` kept; routes pluralise (11, 10).
6. **T6** ✅ RESOLVED — `attempt_no` on all attempts + partial unique index `UNIQUE(assessment_id, student_id) WHERE attempt_no = 1` for limit=1 (11).
7. **T7** ✅ RESOLVED — `variant: "tuition"` → `bg-tuition-accent text-white hover:bg-tuition-accent/90 focus-visible:ring-tuition-accent/50`, landed before any tuition component (12).
8. **T8** ✅ RESOLVED — `live_classes.provider` defaults `'decimal'` (replay + chat); optional `meeting_url` embed; `recording_url` replay; WebRTC Phase 2 (11, 12).
9. **T9** ✅ RESOLVED — assignments use `tuition_assessment` entirely (assignment = manual-grade assessment; create/update/publish/.grade, student reads own submissions via identity link) (12).
10. **T10** ✅ RESOLVED — tuition `deep_link`s product-aware, `localStorage` key `decimal:lastProduct`, permission guardrail (08).
11. **T11** ✅ RESOLVED — `programme_reviews` added to migration set (032) (11).

Resolved in this pass by parallel editorial review (T1: 04, T2/T3: 02+10, T4/T5/T6/T11: 11, T7/T8/T9: 12, T10: 08). Remaining review gate: human sign-off on MVP slice list in 09, per file 12 §7.1.

## Build sequence (from file 09)

Slices 0..8 in file 09 Part 4 — Shell+auth → curriculum+programme → learner experience →
content+question bank → assessment engine → teacher operations → school admin →
network benchmarking → billing gating polish. Each slice independently ship-able.