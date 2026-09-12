# Convex CLI — Notes (dev deployment `third-snail-415`)

> Status: WORKING. Last updated 2026-09-12.

## The blocker and the fix

The Convex CLI in v1.45.0 reads the deployment for local dev from
`CONVEX_DEPLOYMENT` (a bare `dev:<name>` selector). Setting
`CONVEX_DEPLOYMENT=dev:third-snail-415|<admin-jwt>` does NOT authenticate: the
CLI parses it as a plain deployment-name URL segment, tries
`GET /api/deployment/<name>/team_and_project` with no bearer token, and fails
with `401 MissingAccessToken`.

The supported non-interactive credential is the **deploy key**, read from a
different env var:

- `CONVEX_DEPLOY_KEY` (or `CONVEX_DEPLOYMENT_TOKEN`) — value in the same format
  as an admin key: `dev:<deployment-name>|<jwt>`.
- The CLI detects it via `isDeploymentKey` (`/^(dev|prod):.*\|/`) in
  `node_modules/convex/dist/cjs/cli/lib/deployment.js`, and then resolves the
  deployment URL and team/project **from the key itself**, without any personal
  access token:
  - `POST /api/deployment/url_for_key`
  - `POST /api/deployment/team_and_project_for_key`
- No `.env.local` edit is needed: setting `CONVEX_DEPLOY_KEY` in the shell
  environment (or via `convex --env-file <file>`) takes precedence, and the
  leftover `CONVEX_DEPLOYMENT` in `.env.local` is ignored (the key is checked
  first in `getDeploymentSelectionFromEnv`).

`.env.local` is deliberately left untouched (read-only per task rules).

## One-shot commands (non-interactive, CI-safe)

```bash
# value = the CONVEX_DEPLOYMENT value already in .env.local (dev:third-snail-415|<jwt>)
export CONVEX_DEPLOY_KEY="$(awk -F= '/^CONVEX_DEPLOYMENT=/{v=$2; gsub(/^"/,"",v); gsub(/"$/,"",v); print v}' .env.local)"

# 1. Generate convex/_generated/ local types
npx convex codegen --typecheck disable

# 2. Push schema + functions to the dev deployment
npx convex deploy --typecheck disable --skip-workos-check
```

`--skip-workos-check` avoids the optional AuthKit provisioning check during
deploy (no WorkOS integration signed off yet). `npx convex dev --once` also
works with the same env var.

## Schema fix required by v1.45.0

The Wave-1 schema originally had
`.index("by_organizationId_creationTime", ["organizationId", "_creationTime"])`
on `auditLogs`. `_creationTime` is appended to every index automatically and
must NOT be listed explicitly — the push failed with
`IndexFieldsContainCreationTime`. Fixed in `convex/schema.ts` to
`.index("by_organizationId", ["organizationId"])`.

## Verified state

- `convex/_generated/` exists with `api`, `server`, `dataModel` (`.d.ts` + `.js`).
- `npx tsc --noEmit` exits 0.
- Schema pushed to `third-snail-415`; `npx convex data` lists 13 tables:
  `users, organizations, memberships, permissionsConfig, staff, students,
  studentGuardians, academicYears, terms, classes, subjects, enrollments,
  organizationSettings, auditLogs`.

## Env vars probed (v1.45.0, `node_modules/convex/dist/cjs/cli/lib/utils/utils.js`)

- `CONVEX_DEPLOY_KEY` — deploy key (dev/prod: `<name>|<jwt>`) ✅ works non-interactively
- `CONVEX_DEPLOYMENT_TOKEN` — same handling as `CONVEX_DEPLOY_KEY` (read in `readDeployKeyFromEnv`)
- `CONVEX_DEPLOYMENT` — dev-name selector only, no embedded-token support
- `CONVEX_OVERRIDE_ACCESS_TOKEN` — overrides all auth in `getBigBrainAuth`
- `CONVEX_SELF_HOSTED_URL` / `CONVEX_SELF_HOSTED_ADMIN_KEY` — self-hosted pair
- `CONVEX_DEPLOY_KEY` `preview:<team>:<project>|...` keys are NOT supported by
  `codegen` (crash by design); `project:<...>|` keys and `--deployment
  <team>:<project>:<name>` selectors also exist
- No machine credential file was required at any point; no `npx convex login`
  needed.