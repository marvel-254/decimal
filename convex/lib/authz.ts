/**
 * Reusable authorization utilities.
 *
 * Uses the generated context types (`../_generated/server`) so `requireSession`
 * etc. type-check against the project's real DataModel. Runs on both queries
 * and mutations (they share the `auth` + `db` surface we use).
 *
 * The coarse-grained map below mirrors the legacy RLS policies
 * (supabase/migrations/001, 003, 007 + 010/012) and PLAN.md's identity chain:
 *
 *   WorkOS user → Decimal user → membership(org) → role → permission → data access
 *
 * Record-level scoping that RLS granted implicitly (e.g. a parent seeing only
 * their own children) is NOT enforceable here — that is checked per-function
 * in business logic (e.g. "is this studentId one of my child links?").
 */
import type { Doc, Id } from "../_generated/dataModel";
import type { DatabaseReader } from "../_generated/server";
import type { Auth } from "convex/server";
import { unauthenticatedError, forbiddenError } from "./errors";

export type Role =
  | "super_admin"
  | "principal"
  | "teacher"
  | "finance"
  | "admissions_officer"
  | "secretary"
  | "parent"
  | "timetable_manager";

export type Permission =
  | "students:read"
  | "students:write"
  | "staff:read"
  | "staff:write"
  | "classes:read"
  | "classes:write"
  | "subjects:read"
  | "subjects:write"
  | "academicYears:read"
  | "academicYears:write"
  | "terms:read"
  | "terms:write"
  | "enrollments:read"
  | "enrollments:write"
  | "memberships:read"
  | "memberships:write"
  | "organizationSettings:read"
  | "organizationSettings:write"
  | "auditLogs:read"
  | "timetable:read"
  | "timetable:write";

/** Every permission; super_admin gets all of it. */
const ALL_PERMISSIONS: readonly Permission[] = [
  "students:read",
  "students:write",
  "staff:read",
  "staff:write",
  "classes:read",
  "classes:write",
  "subjects:read",
  "subjects:write",
  "academicYears:read",
  "academicYears:write",
  "terms:read",
  "terms:write",
  "enrollments:read",
  "enrollments:write",
  "memberships:read",
  "memberships:write",
  "organizationSettings:read",
  "organizationSettings:write",
  "auditLogs:read",
  "timetable:read",
  "timetable:write",
];

/** Anything a tenant member can read (001/007: "members can view"). */
const READ_BASE: readonly Permission[] = [
  "students:read",
  "staff:read",
  "classes:read",
  "subjects:read",
  "academicYears:read",
  "terms:read",
  "enrollments:read",
  "memberships:read",
  "organizationSettings:read",
  "auditLogs:read",
  "timetable:read",
];

/**
 * Role → permission map, derived from legacy RLS:
 * - 001: students/staff writes = super_admin + principal.
 * - 005: admissions_officer + secretary manage student/staff enrollment records.
 * - 007: academic years/classes/subjects/terms writes = super_admin + principal;
 *        timetable_slots writes add timetable_manager.
 * - 012: audit_logs readable by members, writable only by service code.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  super_admin: ALL_PERMISSIONS,
  principal: ALL_PERMISSIONS,
  teacher: READ_BASE,
  finance: READ_BASE,
  admissions_officer: [
    ...READ_BASE,
    "students:write",
    "staff:write",
    "enrollments:write",
  ],
  secretary: [
    ...READ_BASE,
    "students:write",
    "staff:write",
    "enrollments:write",
    "organizationSettings:write",
  ],
  parent: [
    "students:read",
    "classes:read",
    "subjects:read",
    "academicYears:read",
    "terms:read",
    "enrollments:read",
  ],
  timetable_manager: [...READ_BASE, "timetable:write"],
};

/**
 * Require a signed-in identity. Throws `{ code: "UNAUTHENTICATED" }`.
 *
 * Works for query & mutation ctx (and plain objects exposing `auth`),
 * which keeps this helper usable from actions too.
 */
export async function requireSession(ctx: { auth: Auth }) {
  const identity = await ctx.auth.getUserIdentity();
  if (identity === null) {
    throw unauthenticatedError();
  }
  return identity;
}

/** The signed-in user's Decimal `users` doc, or UNAUTHENTICATED. */
export async function getCurrentDecimalUser(ctx: { auth: Auth; db: DatabaseReader }): Promise<Doc<"users">> {
  const identity = await requireSession(ctx);
  const user = await ctx.db
    .query("users")
    .withIndex("by_workosUserId", (q) => q.eq("workosUserId", identity.subject))
    .first();
  if (user === null) {
    throw unauthenticatedError("No Decimal user is linked to this identity.");
  }
  return user;
}

/** Require an ACTIVE membership in the given org. Throws `{ code: "FORBIDDEN" }`. */
export async function requireOrgMembership(
  ctx: { auth: Auth; db: DatabaseReader },
  organizationId: Id<"organizations">,
): Promise<Doc<"memberships">> {
  const user = await getCurrentDecimalUser(ctx);
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_organizationId_userId", (q) =>
      q.eq("organizationId", organizationId).eq("userId", user._id),
    )
    .first();
  if (membership === null || membership.status !== "active") {
    throw forbiddenError("You are not an active member of this organization.");
  }
  return membership;
}

/** Require a specific `resource:action` permission within an org. */
export async function requirePermission(
  ctx: { auth: Auth; db: DatabaseReader },
  organizationId: Id<"organizations">,
  permission: Permission,
): Promise<Doc<"memberships">> {
  const membership = await requireOrgMembership(ctx, organizationId);
  const granted = ROLE_PERMISSIONS[membership.role];
  if (!granted.includes(permission)) {
    throw forbiddenError(`Missing permission: ${permission}.`);
  }
  return membership;
}