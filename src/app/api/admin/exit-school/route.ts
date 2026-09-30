import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server-admin";
import { logAudit } from "@/lib/services/audit";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";

/**
 * Super admin "Exit School".
 *
 * Reverses Enter School: deactivates the temporary `principal` membership
 * (only the one created/activated by the enter flow), restores the admin's
 * home school as active, and clears the school-mode cookies. Idempotent — a
 * call without a school-mode cookie just returns to the super admin portal.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Super admin only.
  const isSuperAdmin = await isPlatformAdmin(supabase);
  if (!isSuperAdmin) {
    return NextResponse.json(
      { error: "Super admin access required" },
      { status: 403 }
    );
  }

  const admin = createAdminClient();

  // The school being exited, recorded before the profile is reset.
  const { data: profile } = await admin
    .from("profiles")
    .select("active_school_id")
    .eq("id", user.id)
    .maybeSingle();
  const exitedSchoolId = profile?.active_school_id ?? null;

  const cookieStore = await cookies();
  const mode = cookieStore.get("decimal_school_mode")?.value ?? "";

  // Deactivate only the temporary membership we created/activated. An
  // "existing" membership (the admin genuinely being a principal there) is
  // left untouched.
  if (mode.startsWith("created:") || mode.startsWith("activated:")) {
    const membershipId = mode.split(":")[1];
    if (membershipId) {
      await admin
        .from("school_members")
        .update({ is_active: false })
        .eq("id", membershipId);
    }
  }

  // Restore the admin's home school (first remaining active membership).
  const { data: home } = await admin
    .from("school_members")
    .select("school_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  await admin
    .from("profiles")
    .update({ active_school_id: home?.school_id ?? null })
    .eq("id", user.id);

  await logAudit({
    schoolId: exitedSchoolId,
    userId: user.id,
    userEmail: user.email ?? undefined,
    action: "school.exit",
    resourceType: "school",
    resourceId: exitedSchoolId ?? undefined,
    metadata: {},
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  const response = NextResponse.json({ ok: true, redirectTo: "/super-admin" });
  response.cookies.delete("decimal_school_mode");
  response.cookies.delete("decimal_active_role");

  return response;
}