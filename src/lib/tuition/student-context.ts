import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveTuitionIdentity } from "@/lib/tuition/identity";

/**
 * Server-only helper for student-focused tuition pages: resolves the school +
 * student context, redirecting if the caller is not a student (or a member
 * linked to a student).
 */
export async function getStudentContext(): Promise<{
  schoolId: string;
  studentId: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const identity = await resolveTuitionIdentity(user.id);
  if (identity.kind === "student") {
    return { schoolId: identity.schoolId, studentId: identity.studentId };
  }
  if (identity.kind === "member" && identity.studentId) {
    return { schoolId: identity.schoolId, studentId: identity.studentId };
  }
  redirect("/tuition");
}