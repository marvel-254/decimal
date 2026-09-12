'use client';

import Link from 'next/link';
import { useAuth } from '@workos-inc/authkit-nextjs/components';

export function WorkOSSignInButton() {
  return (
    <Link
      href="/auth/workos/sign-in"
      className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
      Continue with SSO
    </Link>
  );
}

export function WorkOSSignOutButton() {
  const { signOut, loading } = useAuth();

  return (
    <button
      onClick={() =>
        signOut({
          returnTo: `${window.location.origin}/auth/workos`,
        })
      }
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? 'Signing out...' : 'Sign Out'}
    </button>
  );
}

export function WorkOSUserInfo() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/20 bg-white/10 px-4 py-2">
      {user.profilePictureUrl && (
        <img
          src={user.profilePictureUrl}
          alt={user.firstName || 'User'}
          className="h-8 w-8 rounded-full"
        />
      )}
      <div className="text-sm">
        <p className="font-medium text-white">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-white/60">{user.email}</p>
      </div>
    </div>
  );
}
