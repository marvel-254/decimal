/**
 * Decimal Tuition — identity bridge (settled decision T2, context §8.1).
 *
 * student/parent are PRODUCT USER TYPES, not member_role values. Middleware
 * only gates member-role portals; the tuition layout resolves identity here:
 *   member  → school_members row (role in active school)
 *   student → tuition_student_users.user_id
 *   parent  → students.parent_user_id (read-only mirror of children)
 */

import { createAdminClient } from "@/lib/supabase/server-admin";
import type { TuitionShellMode } from "@/lib/tuition/types";

export type TuitionIdentity =
  | {
      kind: "member";
      userId: string;
      role: string;
      schoolId: string;
      studentId?: string | null;
    }
  | {
      kind: "student";
      userId: string;
      schoolId: string;
      studentId: string;
    }
  | {
      kind: "parent";
      userId: string;
      schoolId: string | null;
      childStudentIds: string[];
    }
  | { kind: "none"; userId: string };

const MEMBER_SPACE_ROLE: Record<string, "teacher" | "school" | "network"> = {
  super_admin: "school",
  principal: "school",
  teacher: "teacher",
  timetable_manager: "teacher",
  finance: "school",
  admissions_officer: "school",
  secretary: "school",
  parent: "school",
};

/**
 * Resolve a user's tuition identity. Member context wins (a member who is also
 * linked as a student keeps member routing; the student id is attached for
 * enrolement/submission checks).
 */
export async function resolveTuitionIdentity(
  userId: string
): Promise<TuitionIdentity> {
  const admin = createAdminClient();

  const [memberRes, studentRes, parentRes] = await Promise.all([
    admin
      .from("school_members")
      .select("school_id, role")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("joined_at", { ascending: true })
      .limit(50),
    admin
      .from("tuition_student_users")
      .select("student_id, school_id")
      .eq("user_id", userId)
      .limit(5),
    admin
      .from("students")
      .select("id, school_id")
      .eq("parent_user_id", userId)
      .eq("is_active", true)
      .limit(50),
  ]);

  const { data: profile } = await admin
    .from("profiles")
    .select("active_school_id")
    .eq("id", userId)
    .maybeSingle();

  const members = memberRes.data ?? [];
  const students = studentRes.data ?? [];
  const children = parentRes.data ?? [];

  // member → resolve against the active school exactly like the platform shell.
  if (members.length > 0) {
    const activeSchoolId = profile?.active_school_id ?? null;
    const inActive = activeSchoolId
      ? members.find((m) => m.school_id === activeSchoolId)
      : undefined;
    const member = inActive ?? members[0];

    const linked = students.find((s) => s.school_id === member.school_id);
    return {
      kind: "member",
      userId,
      role: member.role,
      schoolId: member.school_id,
      studentId: linked?.student_id ?? null,
    };
  }

  // student (tuition-registered, not a member)
  if (students.length > 0) {
    const first = students[0];
    return {
      kind: "student",
      userId,
      schoolId: first.school_id,
      studentId: first.student_id,
    };
  }

  // parent of one or more students
  if (children.length > 0) {
    return {
      kind: "parent",
      userId,
      schoolId: children[0].school_id,
      childStudentIds: children.map((c) => c.id),
    };
  }

  return { kind: "none", userId };
}

/**
 * Which space shell a resolved identity should see.
 */
export function tuitionShellMode(identity: TuitionIdentity): TuitionShellMode {
  if (identity.kind === "student" || identity.kind === "parent") return "student";
  if (identity.kind === "member") {
    return MEMBER_SPACE_ROLE[identity.role] ?? "student";
  }
  return "student";
}

/**
 * Where the /tuition root should land a member-of-staff identity. Students/
 * parents stay on /tuition itself.
 */
export function tuitionHomeRedirect(
  identity: TuitionIdentity
): string | null {
  if (identity.kind !== "member") return null;
  switch (identity.role) {
    case "super_admin":
      return "/tuition/network";
    case "principal":
      return "/tuition/school";
    case "teacher":
    case "timetable_manager":
      return "/tuition/teacher";
    default:
      return "/tuition/school";
  }
}

export function memberRoleFromIdentity(
  identity: TuitionIdentity
): string | null {
  return identity.kind === "member" ? identity.role : null;
}