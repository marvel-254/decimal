# Decimal → Convex + WorkOS — Migration Plan

> Status: **Wave 1 in progress** (auth + tenant core, dev/staging) — see `INTEGRATION-NOTES.md`
> when it exists. Last updated 2026-09-12.

## Decisions (confirmed by product owner)
1. Finish Tuition MVP is DEFERRED: pivot to the migration now; Tuition resumes afterward
   (resume point: `docs/tuition/SLICE-LOG.md`).
2. Dev/staging FIRST using:
   - Convex dev deployment `third-snail-415`
     (`NEXT_PUBLIC_CONVEX_URL=https://third-snail-415.convex.cloud`, dev admin key in `.env.local`).
   - WorkOS **test** keys (env in `.env.local`; `WORKOS_CLIENT_ID=client_01M2A7T72PZAM6XSJAFACF1TF7`,
     `WORKOS_API_KEY=sk_test_…`).
   Production keys added at promotion time.
3. Wave 1 scope = **auth + tenant core**, reviewed before widening.
4. Users: password reset + legacy-id mapping (a user's old `auth.users.id` preserved as
   `users.legacyId`); no password porting.
5. Subagents delegated for implementation work; main thread integrates + commits.

## Target architecture
```
Browser / Native (Capacitor, Tauri)
   │
   ├─ WorkOS — identity only (login/logout/session/OAuth/SSO/MFA)
   │
   └─ Next.js 16 app
        ├─ Convex — app DB, queries/mutations/actions, RBAC, tenant scoping, realtime, storage
        └─ Next API routes — ONLY thin HTTP adapters for external systems
             (M-Pesa Daraja webhook, sync ingest, crons, demo pipeline)
```

Identity chain enforced server-side in every Convex function:
```
WorkOS user → Decimal user → membership(org) → role → permission → data access
```

## Multi-tenancy
Every tenant-owned doc carries `organizationId` (Convex `string` id or legacy UUID string).
No frontend-only filtering; Convex functions validate the whole chain.

## Target data model (Wave 1 skeleton — extend per domain waves)
```
users { id, workosUserId, legacyId, email, name, status }
organizations { id, legacyId, name, settings… }
memberships { organizationId, userId, role, legacyId, status }
roles+permissions (mapped from existing member_role enum + RLS)
students/guardians/studentGuardians (org-scoped, legacyId)
academicYears/terms/classes/subjects/enrollments(class_teachers)
organizationSettings, auditLogs
```
Only entities actually required — no auto-copy of all ~100 SQL tables.

## Phases
- **Phase A** Tuition MVP (PAUSED; resume after wave 1 proves out).
- **Phase B** Groundwork (dev env, deps `convex` + WorkOS SDK, env, CSP/headers).
- **Wave 1** Auth (WorkOS AuthKit: sign-in/sign-out/callback/session) + Convex schema
  skeleton + RBAC utilities + tenant-core migration tooling with parity validation.
- Wave 2 attendance + reporting/exams/report-cards.
- Wave 3 fees/invoices/payments + billing (subscriptions→Convex; M-Pesa STK push action;
  Daraja callback via thin route → mutation; renewal cron).
- Wave 4 messaging/notifications/audit/webhooks/documents (**Convex storage**, 20MB cap).
- Wave 5 offline sync engine (`/api/sync/*` → Convex http/actions), PWA/native re-verify,
  demo pipeline re-target.
- Wave 6 parity + security review + staging → production cutover (flag-based rollback,
  Supabase stays readable until parity passes → retirement).

## Migration tooling (design)
Node/TS runner: read Supabase via service-role REST → transform
(UUID→legacyId string, enum→string, JSONB→object, nullable dates) → write via Convex
admin/internal migration function → explicit per-record error report (never silent drop) →
post-import validation: org/user/student/staff/class counts + relationship probes
(student→org→class, teacher→org→class).

## Validation gates (per wave)
- Cross-tenant probe (Org A creds on Org B data) MUST fail.
- Privilege-escalation probe MUST fail.
- Unauthenticated/unauthorized 401/403 semantics preserved.
- `npx tsc --noEmit`, `npm run lint`, `npm run test`, `npm run build` green.
- Docs updated; env spec updated; rollback procedure exists.

## Environment variables (names; see `.env.local.example`)
WorkOS: `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`, `WORKOS_REDIRECT_URI`, `WORKOS_COOKIE_PASSWORD`.
Convex: `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_ADMIN_KEY` (dev).
Existing Supabase env stays until cutover.

## Audit snapshot (from Phase 1, commit 685ac1f)
- ~100 SQL tables, 8 enums, ~404 policies/functions/triggers, 29 migrations (001–029).
  Auth: Supabase GoTrue + @supabase/ssr middleware; RLS everywhere; tenancy = schools +
  `school_members` + `profiles.active_school_id`; roles enum.
  API: ~60 route handlers; services: 28 modules; billing: M-Pesa + self-built subscriptions +
  Upstash Redis (cache/rate-limit); offline: IndexedDB + `/api/sync/*`; native: Capacitor/Tauri;
  CI/CD: GitHub Actions (Vercel deploy) + demo-video pipeline (Supabase reset + R2 + wrangler).
- Risks: RLS→app-auth rewrite (dominant effort), user re-auth, offline sync + native wrappers,
  billing/postgres-isms, storage caps, Next 16 compat with Convex client (verify).