import { describe, it, expect, vi, beforeEach } from "vitest";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";

/**
 * Guards the platform-admin model introduced in
 * supabase/migrations/032_platform_admin.sql.
 *
 * The regression this file exists to prevent: super admin used to be detected
 * by querying `school_members` for `role = 'super_admin'`. That is wrong now
 * that `profiles.is_platform_admin` exists, because a platform admin holds NO
 * school membership (`school_members.school_id` is NOT NULL), so the membership
 * query returns empty for exactly the users it is meant to identify.
 *
 * These are unit tests over the helper's contract with the Supabase client —
 * the SQL function itself is verified against a real Postgres in CI-adjacent
 * manual testing, not here.
 */

function mockClient(overrides: {
  rpc?: ReturnType<typeof vi.fn>;
} = {}) {
  return {
    rpc: overrides.rpc ?? vi.fn().mockResolvedValue({ data: false, error: null }),
  } as never;
}

describe("isPlatformAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns true when is_super_admin() reports true", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });

    await expect(isPlatformAdmin(mockClient({ rpc }))).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("is_super_admin");
  });

  it("returns false when is_super_admin() reports false", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });

    await expect(isPlatformAdmin(mockClient({ rpc }))).resolves.toBe(false);
  });

  it("fails closed and logs when the RPC errors", async () => {
    const error = spyOnConsoleError();
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });

    await expect(isPlatformAdmin(mockClient({ rpc }))).resolves.toBe(false);
    expect(error).toHaveBeenCalled();
  });

  it("does not query school_members", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });

    await isPlatformAdmin(mockClient({ rpc }));

    // If this regresses, platform admins silently lose access.
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).not.toHaveBeenCalledWith("get_user_school_ids");
  });

  it("coerces a truthy non-boolean to true", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 1, error: null });

    await expect(isPlatformAdmin(mockClient({ rpc }))).resolves.toBe(true);
  });
});

function spyOnConsoleError() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}