# Decimal → WorkOS AuthKit — Integration Notes (Wave 1 test surface)

> Companion to `docs/migration/PLAN.md`. Status: **test spike only** — additive, does NOT
> alter the live Supabase login flow or the global proxy. Last updated 2026-09-12.

## What this is

A self-contained WorkOS @AuthKit test flow under `/auth/workos`:

| Route | Purpose |
|-------|---------|
| `GET /auth/workos/sign-in` | Starts AuthKit sign-in (PKCE). Redirects to the WorkOS-hosted login. |
| `GET /auth/workos/callback` | `handleAuth()` — exchanges the code, writes the `wos-session` cookie, redirects to `/auth/workos`. |
| `GET /auth/workos` | Landing page — shows signed-in/signed-out state, user info, sign in / sign out. |

The callback returns to `/auth/workos` (never deep-links into a portal) and works for **any**
authenticated person — the user does not need to be a Decimal school member.

**Scope guardrails:** `src/middleware.ts`, `package.json`, `.env*`, Supabase/Convex, API routes
and all portal pages are untouched. The Supabase login page still works; the SSO button on
`/login` is an additive entry point into this test flow.

## How the flow works

1. User hits `/auth/workos/sign-in` → `getSignInUrl()` (`@workos-inc/authkit-nextjs`).
   The lib reads the redirect URI from env, generates a PKCE code verifier, seals OAuth state
   (including the verifier) with `WORKOS_COOKIE_PASSWORD`, sets a per-flow `wos-auth-verifier-<hash>`
   cookie (`httpOnly`, short-lived) and 307-redirects to WorkOS AuthKit.
2. User authenticates with WorkOS. WorkOS redirects to the registered Redirect URI
   (`/auth/workos/callback?code=…&state=…`).
3. `handleAuth()` (installed in `src/app/auth/workos/callback/route.ts`) verifies the cookie↔state
   pair (CSRF + PKCE — strict since v3, always-on in v4), calls
   `userManagement.authenticateWithCode` with the client id + code verifier, deletes the PKCE
   cookie, sets the sealed `wos-session` cookie, then redirects to `returnPathname` (`/auth/workos`).
4. `/auth/workos` renders. Signed-in state comes from `withAuth()` (server) / `useAuth()` (client
   buttons). Both depend on the AuthKit proxy headers — see [Proxy status](#proxy-status).

## Environment variables

`.env.local` already carries everything **the installed v4.3.1 code actually reads**:

| Name | In `.env.local`? | Notes |
|------|------------------|-------|
| `WORKOS_API_KEY` | ✅ yes | Test key (`sk_test_…`) |
| `WORKOS_CLIENT_ID` | ✅ yes | `client_01M2…` |
| `WORKOS_COOKIE_PASSWORD` | ✅ yes | ≥ 32 chars; required (36 chars present) |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | ✅ yes | `http://localhost:3000/auth/workos/callback` |

**No additional env var is required for the installed package.** VERIFIED against
`node_modules/@workos-inc/authkit-nextjs/src/env-variables.ts` (v4.3.1): the redirect URI is read
from `process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI` only.

> ⚠️ The non-prefixed `WORKOS_REDIRECT_URI` (mentioned in the AuthKit README and in
> `.env.local.example`) is **NOT read by v4.3.1**. Adding it is harmless but inert. If an
> upstream version starts reading the plain name, keep the two in sync. Flagging for the env
> thread: `.env.local.example` documents `WORKOS_REDIRECT_URI` as required — the live code
> disagrees; `NEXT_PUBLIC_WORKOS_REDIRECT_URI` is the operative one.

Optional (all have safe defaults in v4.3.1, none set here): `WORKOS_COOKIE_NAME` (default
`wos-session` — the landing page honors it), `WORKOS_COOKIE_MAX_AGE`, `WORKOS_COOKIE_DOMAIN`,
`WORKOS_API_HOSTNAME`, `WORKOS_API_HTTPS`, `WORKOS_API_PORT`, `WORKOS_COOKIE_SAMESITE`,
`WORKOS_CLAIM_TOKEN`.

## WorkOS dashboard — what to register

1. **Redirect URI** — must match `NEXT_PUBLIC_WORKOS_REDIRECT_URI` exactly:
   - Dev: `http://localhost:3000/auth/workos/callback`
   - Deployed: `https://decimal-app.vercel.app/auth/workos/callback` (Vercel preview domains need
     their own entry or a dynamic redirect URI at cutover).
2. **Sign-in URL** (`initiate_login_uri`) — point it at the sign-in route:
   - Dev: `http://localhost:3000/auth/workos/sign-in`
   - Deployed: `https://decimal-app.vercel.app/auth/workos/sign-in`
   - Required for dashboard-initiated flows (e.g. impersonation) so PKCE/state is set up before
     WorkOS redirects; sign-in also requires it to complete PKCE verification on every callback.
3. **Default Logout URI** (Redirects) — set, e.g. `http://localhost:3000/auth/workos` (and the
   deployed equivalent). The sign-out button passes `returnTo: ${origin}/auth/workos`, so it also
   works per-call without the dashboard default, but a default is the robust fallback.
4. **Client ID / API key** — the ones already in `.env.local` must be for the same WorkOS
   environment (test keys ↔ test redirect URIs).

## Testing

### Locally
```bash
cd decimal-app
npm run dev
# open: http://localhost:3000/auth/workos
```
Click **Continue with SSO** (or the equivalent on `http://localhost:3000/login`), authenticate in
AuthKit, and you should be returned to `/auth/workos`. The diagnostic row shows the status of the
`wos-session` cookie. Sign out returns you to `/auth/workos`.

### Deployed (Vercel)
1. Set `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_COOKIE_PASSWORD`,
   `NEXT_PUBLIC_WORKOS_REDIRECT_URI` on the project (no secrets in this file).
2. In the dashboard, register the deployed Redirect URI (`https://<env>.vercel.app/auth/workos/callback`),
   Sign-in URL and Logout URI.
3. Visit `https://<env>.vercel.app/auth/workos`.

## Proxy status ⚠️

**The AuthKit proxy is REQUIRED to display session state, but is intentionally NOT wired yet.**

Verified in v4.3.1 source: `withAuth()` (server) and `useAuth()` (client, via the
`getAuthAction` server action) both require the `x-workos-middleware` request header that only the
AuthKit proxy sets. Without it, `withAuth()` throws
`...isn't covered by the AuthKit middleware` and `useAuth()` degrades to signed-out.

The sign-in **route** and the **callback** do NOT require the proxy — they generate/set cookies
directly. So today the OAuth round trip completes and the `wos-session` cookie is written, but the
landing page cannot resolve the signed-in user until the proxy is wired.

Why it wasn't wired now — hard constraints:

- **Next.js 16 allows exactly ONE proxy file.** `proxy.ts` is the convention; legacy `middleware.ts`
  still works but is deprecated. The build **fails** (error `E900`) if BOTH `middleware.ts` and
  `proxy.ts` exist, and any other filename (e.g. `src/workos-middleware.ts`) is **ignored** by the
  framework — it would be dead code, so it was not created.
- `src/middleware.ts` (Supabase session) is explicitly out of scope for this task, and a second
  proxy file cannot coexist with it. Altering it is the cutover step, not a spike step.

Consequences: acceptable for a spike. The channels that matter (PKCE sign-in → callback → cookie)
are validated end-to-end; the cookie diagnostic row confirms the session write.

## Cutover checklist (when the whole app moves to WorkOS)

- [ ] **Rename `src/middleware.ts` → `src/proxy.ts`** and compose AuthKit in — single file. The
      AuthKit README's "Composable proxy/middleware" pattern is the supported way to merge with the
      existing Supabase logic. Sketch (run past the team owning global auth before applying; note
      `handleAuthkitHeaders`/`handleAuthkitProxy` builds its own `NextResponse` — it does not take an
      existing response, so branch by path):
      ```ts
      // src/proxy.ts
      import { NextRequest, NextResponse } from 'next/server';
      import { authkit, handleAuthkitHeaders } from '@workos-inc/authkit-nextjs';
      import { updateSession } from '@/lib/supabase/middleware';

      export default async function proxy(request: NextRequest) {
        const { headers } = await authkit(request); // AuthKit session headers

        // Start with the WorkOS test surface, verify, then widen to protected routes.
        if (request.nextUrl.pathname.startsWith('/auth/workos')) {
          return handleAuthkitHeaders(request, headers); // authkit owns the response here
        }

        // Existing Supabase gate — preserved bit-for-bit until parity passes (PLAN.md Wave 6).
        // Note: protected pages that later call withAuth() also need the authkit request
        // headers forwarded; plan that merge when widening the matcher.
        return await updateSession(request);
      }
      export const config = { matcher: ['/auth/workos/:path*'] };
      ```
- [ ] Move the WorkOS env vars to Vercel project env + CI.
- [ ] Set `returnPathname` to the real post-login destination (role-portal router, e.g. the school
      picker), and point the `/login` SSO button at it.
- [ ] Map WorkOS identity → Decimal identity: preserve `auth.users.id` as `users.legacyId`
      (PLAN.md), and resolve roles via WorkOS org/role claims instead of `school_members`.
- [ ] Decide `middlewareAuth.enabled` (secure-by-default) vs per-page `withAuth({ ensureSignedIn })`.
- [ ] Register production Redirect/Sign-in/Logout URIs in the dashboard before deploy.
- [ ] Keep Supabase readable for parity (PLAN.md Wave 6) — global proxy still gates `/teacher` etc.
      until WorkOS covers them.
- [ ] Remove or promote `/auth/workos` demo page; keep or remove `isAuthPath('/auth/workos')`
      redundancy in `src/lib/auth-config.ts` (it is currently redundant because `/auth` already
      matches — safe either way).
- [ ] Run the PLAN.md validation gates (`npx tsc --noEmit`, lint, tests, build).

## v4 API differences vs. prior knowledge (verified against installed 4.3.1)

- **Redirect URI env var:** v4.3.1 reads `NEXT_PUBLIC_WORKOS_REDIRECT_URI` only — a bare
  `WORKOS_REDIRECT_URI` is not consulted by the installed build.
- **Proxy naming:** Next.js 16 uses `authkitProxy()` in `proxy.ts`; `authkitMiddleware()` is a
  deprecated alias. One proxy file per project (E900 if `proxy.ts` + `middleware.ts` coexist).
- **PKCE is mandatory:** per-flow `wos-auth-verifier-<fnv1a-hash>` cookies; strict cookie↔state
  verification (no silent fallback). `WORKOS_ENABLE_PKCE` is obsolete.
- **`getSignInUrl({ returnTo })`** (or `state`) seals the redirect target into the OAuth state;
  `handleAuth` honors it over the static `returnPathname` option.
- **`withAuth` requires the proxy** — that hasn't changed, but the failure mode (throw vs
  signed-out) is sharp: an uncovered route throws inside server components unless guarded.
- **Runtime:** AuthKit code uses Node-only APIs (iron-session, `crypto`), so the WorkOS routes are
  pinned with `export const runtime = 'nodejs'` (default in Next 16, explicit for safety).

## Files owned by this spike

- `src/app/auth/workos/sign-in/route.ts` — sign-in route (`runtime = 'nodejs'`)
- `src/app/auth/workos/callback/route.ts` — callback (`returnPathname: '/auth/workos'`, node)
- `src/app/auth/workos/page.tsx` — landing/test page (added)
- `src/components/auth/workos-auth-buttons.tsx` — useAuth-backed buttons + user info
- `src/lib/auth-config.ts` — verified: `/auth/workos` already exempt via the `/auth` auth-path
  check; no portal routes affected
- This file.