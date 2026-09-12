import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveTuitionIdentity } from "@/lib/tuition/identity";

/**
 * Server-only helper: resolve the school context for tuition pages that sit
 * under the RouteGuard (layout already resolves identity, so by the time a
 * page renders the caller is a member/student row with a school id).
 */
export async function getCurrentSchoolId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const identity = await resolveTuitionIdentity(user.id);
  if (identity.kind === "member" || identity.kind === "student") {
    return identity.schoolId;
  }
  redirect("/tuition");
}