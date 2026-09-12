export const portalRoutes: Record<string, string> = {
  super_admin: "/super-admin",
  principal: "/principal",
  teacher: "/teacher",
  timetable_manager: "/teacher",
  finance: "/finance",
  admissions_officer: "/admissions-officer",
  secretary: "/secretary",
  parent: "/parent",
};

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  principal: "Principal",
  teacher: "Teacher",
  timetable_manager: "Timetable Manager",
  finance: "Finance",
  admissions_officer: "Admissions Officer",
  secretary: "Secretary",
  parent: "Parent",
};

export const routeRoleMap: Record<string, string[]> = {
  "/super-admin": ["super_admin"],
  "/onboarding": ["principal", "super_admin"],
  "/principal": ["principal", "super_admin"],
  "/teacher": ["teacher", "timetable_manager", "super_admin"],
  "/parent": ["parent", "super_admin"],
  "/admissions-officer": ["admissions_officer", "principal", "super_admin"],
  "/finance": ["finance", "principal", "super_admin"],
  "/secretary": ["secretary", "principal", "super_admin"],
  "/dashboard": Object.keys(portalRoutes),
  // Tuition: member-role spaces only. Student/parent identities are NOT member
  // roles — they are resolved by the tuition layout's identity bridge
  // (tuition_student_users / students.parent_user_id), never here.
  "/tuition/teacher": ["teacher", "timetable_manager", "principal", "super_admin"],
  // parent = read-only mirror of the school corner
  "/tuition/school": ["principal", "super_admin", "finance", "admissions_officer", "secretary", "parent"],
  // teacher = read + participate; adopt/publish = principal+; moderate = super_admin
  "/tuition/network": ["super_admin", "principal", "teacher"],
};

export function getAllowedRoles(pathname: string): string[] | null {
  for (const [route, roles] of Object.entries(routeRoleMap)) {
    if (pathname.startsWith(route)) {
      return roles;
    }
  }
  return null;
}

export const protectedPaths = [
  "/dashboard",
  "/school-picker",
  "/onboarding",
  "/super-admin",
  "/principal",
  "/teacher",
  "/parent",
  "/admissions-officer",
  "/finance",
  "/secretary",
  "/platform",
  "/tuition",
];

/**
 * Resolve the role a user should be treated as for a given school.
 *
 * Used after sign-in and in middleware/layouts so multi-school users are
 * gated and routed by the role in the school they selected (their active
 * school), rather than the first membership on their account.
 *
 * - `preferredRole` (e.g. the role chosen at the school picker) wins when the
 *   user still holds it in the active school.
 * - Otherwise the first role held in the active school is used.
 *
 * Returns undefined when there is no active school or the active school is no
 * longer an active membership — callers should then fall back to the user's
 * first membership.
 */
export function resolvePortalRole(
  members: { role: string; school_id: string }[],
  activeSchoolId?: string | null,
  preferredRole?: string | null
): string | undefined {
  if (!activeSchoolId) return undefined;
  const activeMembers = members.filter(
    (m) => m.school_id === activeSchoolId
  );
  if (activeMembers.length === 0) return undefined;
  if (
    preferredRole &&
    activeMembers.some((m) => m.role === preferredRole)
  ) {
    return preferredRole;
  }
  return activeMembers[0].role;
}

export function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some((p) => pathname.startsWith(p));
}

export function isAuthPath(pathname: string): boolean {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/callback") ||
    pathname.startsWith("/mfa") ||
    pathname.startsWith("/oauth")
  );
}
