import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Is the current user a platform super admin?
 *
 * Delegates to the `is_super_admin()` SQL function so server code and RLS can
 * never drift apart on the definition. That function accepts EITHER:
 *
 *   - `profiles.is_platform_admin` — a platform-scoped operator holding NO
 *     school membership, or
 *   - a `super_admin` row in `school_members` — the legacy per-school role.
 *
 * Use this instead of querying `school_members` for `role = 'super_admin'`
 * directly: `school_members.school_id` is NOT NULL, so a pure platform admin
 * has no rows there and that query silently returns `false` for exactly the
 * users it is meant to identify.
 */
export async function isPlatformAdmin(
  supabase?: SupabaseClient
): Promise<boolean> {
  const client = supabase ?? (await createClient());

  const { data, error } = await client.rpc("is_super_admin");

  if (error) {
    console.error("[isPlatformAdmin] is_super_admin failed:", error);
    return false;
  }

  return Boolean(data);
}