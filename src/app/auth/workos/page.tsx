import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import type { User } from '@workos-inc/node';
import { withAuth } from '@workos-inc/authkit-nextjs';
import {
  WorkOSSignInButton,
  WorkOSSignOutButton,
  WorkOSUserInfo,
} from '@/components/auth/workos-auth-buttons';

export const metadata: Metadata = {
  title: 'WorkOS Auth — Migration Test',
  description: 'Test surface for the Decimal → WorkOS AuthKit migration.',
};

const WORKOS_SESSION_COOKIE = process.env.WORKOS_COOKIE_NAME ?? 'wos-session';

export default async function WorkosAuthPage() {
  let user: User | null = null;
  let authError: string | null = null;

  try {
    const auth = await withAuth();
    user = auth.user;
  } catch (error) {
    authError = error instanceof Error ? error.message : String(error);
  }

  const cookieStore = await cookies();
  const hasWorkosSession = cookieStore.has(WORKOS_SESSION_COOKIE);

  const proxyMissing =
    authError !== null && authError.includes("isn't covered by the AuthKit middleware");

  return (
    <section
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-12"
      style={{ backgroundImage: "url('/login-get-started-bg.jpg')" }}
    >
      <div className="absolute inset-0 -z-10 bg-black/50" />

      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-center gap-2">
          <Image
            src="/logo.jpeg"
            alt="Decimal"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <span className="text-xl font-bold tracking-tight text-white">Decimal</span>
        </div>

        <div className="rounded-xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-xl transition-colors duration-300 hover:border-white/30">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/20 px-3 py-1 text-xs font-medium text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Migration test surface — Wave 1 · WorkOS AuthKit
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
            WorkOS AuthKit sign-in
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Self-contained test flow under <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs">/auth/workos</code>.
            It does not touch the Supabase login flow or any portal route — anyone can authenticate
            here and land back on this page, whether or not they are a Decimal member.
          </p>

          {authError && (
            <div className="mt-5 rounded-lg border border-yellow-200/40 bg-yellow-100/10 p-4 text-sm">
              <p className="font-medium text-yellow-100">Session state unavailable</p>
              <p className="mt-1 text-yellow-100/70">
                {proxyMissing ? (
                  <>
                    The AuthKit proxy is not wired yet (Next.js 16 allows only one proxy file and{' '}
                    <code className="font-mono text-xs">src/middleware.ts</code> must not change until
                    cutover). The sign-in/OAuth round trip still works and sets the{' '}
                    <code className="font-mono text-xs">{WORKOS_SESSION_COOKIE}</code> cookie, but the
                    signed-in user can only be displayed once the cutover proxy runs{' '}
                    <code className="font-mono text-xs">authkit()</code>. See{' '}
                    <code className="font-mono text-xs">docs/migration/INTEGRATION-NOTES.md</code>.
                  </>
                ) : (
                  authError
                )}
              </p>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {user ? (
              <>
                <WorkOSUserInfo />
                <p className="text-xs text-white/60">
                  user.id: <code className="font-mono">{user.id}</code>
                </p>
                <div className="pt-1">
                  <WorkOSSignOutButton />
                </div>
              </>
            ) : (
              <WorkOSSignInButton />
            )}
          </div>

          <dl className="mt-6 flex items-center justify-between rounded-lg border border-white/15 bg-black/20 px-4 py-3 text-xs">
            <dt className="text-white/60">Session diagnostic</dt>
            <dd className="flex items-center gap-2 text-white/80">
              <span
                className={`h-2 w-2 rounded-full ${
                  hasWorkosSession ? 'bg-[var(--success)]' : 'bg-[var(--destructive)]'
                }`}
              />
              <code className="font-mono">
                {WORKOS_SESSION_COOKIE}: {hasWorkosSession ? 'present' : 'not set'}
              </code>
            </dd>
          </dl>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-white/70 hover:text-white hover:underline">
              &larr; Back to the standard login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}