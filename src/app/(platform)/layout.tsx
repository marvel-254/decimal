import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlatformShell } from "@/components/platform/shell";
import { resolvePortalRole, ROLE_LABELS } from "@/lib/auth-config";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: members } = await supabase
    .from("school_members")
    .select("role, school_id")
    .eq("user_id", user.id)
    .eq("is_active", true);

  const cookieStore = await cookies();
  const cookieRole = cookieStore.get("decimal_active_role")?.value ?? null;

  let role = members?.[0]?.role ?? "teacher";
  let activeSchoolId: string | null = null;

  // Multi-school users: show the shell for the role in their active school.
  if ((members?.length ?? 0) > 1) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("active_school_id")
      .eq("id", user.id)
      .maybeSingle();

    activeSchoolId = profile?.active_school_id ?? null;
    role =
      resolvePortalRole(members ?? [], activeSchoolId, cookieRole) ?? role;
  } else if (members && members.length === 1) {
    activeSchoolId = members[0].school_id;
  }

  // Super admin operating inside a school as principal ("Enter School" flow).
  // Goes through is_super_admin() rather than inspecting `members`, because a
  // pure platform admin has no memberships at all and `members` is empty.
  const isSuperAdmin = await isPlatformAdmin(supabase);
  const schoolMode =
    isSuperAdmin && Boolean(cookieStore.get("decimal_school_mode")?.value);

  let shellRole = role;
  let roleLabel = ROLE_LABELS[role] ?? "User";
  let schoolContext: { schoolName: string } | null = null;

  // A platform admin with no membership has no portal role to resolve, so
  // `role` fell back to "teacher" above. Show the super-admin shell instead of
  // a teacher shell with an empty sidebar.
  if (isSuperAdmin && (members?.length ?? 0) === 0 && !schoolMode) {
    shellRole = "super_admin";
    roleLabel = ROLE_LABELS.super_admin ?? "Super Admin";
  }

  if (schoolMode) {
    shellRole = "principal";
    roleLabel = "Principal View";

    const { data: school } = await supabase
      .from("schools")
      .select("name")
      .eq("id", activeSchoolId ?? "")
      .maybeSingle();

    schoolContext = { schoolName: school?.name ?? "School" };
  }

  return (
    <PlatformShell
      role={shellRole}
      roleLabel={roleLabel}
      userName={user.email ?? ""}
      schoolContext={schoolContext}
    >
      {children}
    </PlatformShell>
  );
}