import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server-admin";
import { logAudit } from "@/lib/services/audit";
import { portalRoutes } from "@/lib/auth-config";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";

/**
 * Set the user's active school — and, for super admins, enter a school.
 *
 * Body: { schoolId: string, role: string }
 *
 * Normal flow: validates that the user has an active membership with that
 * exact role in the school, persists profiles.active_school_id (which the DB
 * trigger also re-validates), and returns the portal to route to.
 *
 * Super admin "Enter School" flow: when the caller is a super admin and asks
 * for the `principal` role in a school they are not a member of, a temporary
 * principal membership is created (or reactivated) so the school's RLS
 * policies — which scope reads AND writes to members — apply. The membership
 * is tracked in the `decimal_school_mode` cookie so switching away (or
 * POST /api/admin/exit-school) can deactivate it again.
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { schoolId?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { schoolId, role } = body ?? {};
  if (!schoolId || typeof schoolId !== "string") {
    return NextResponse.json({ error: "schoolId is required" }, { status: 400 });
  }
  if (!role || typeof role !== "string") {
    return NextResponse.json({ error: "role is required" }, { status: 400 });
  }

  // Validate the exact (school, role) membership. Using a role filter here lets
  // a user who holds several roles in one school pick which portal to enter.
  const { data: membership, error: memberError } = await supabase
    .from("school_members")
    .select("id, role")
    .eq("user_id", user.id)
    .eq("school_id", schoolId)
    .eq("role", role)
    .eq("is_active", true)
    .limit(1);

  if (memberError) {
    console.error("[set-active-school] Membership check failed:", memberError);
    return NextResponse.json(
      { error: "Failed to verify school access" },
      { status: 500 }
    );
  }

  const admin = createAdminClient();

  // Super admin flag — used by the Enter School flow below and to guard the
  // school-mode cleanup (the decimal_school_mode cookie is only ever written
  // for super-admin enters).
  //
  // Goes through is_super_admin(), not a school_members lookup: a platform
  // admin holds no membership at all, so the old query reported `false` for
  // them and blocked Enter School entirely.
  const isSuperAdmin = await isPlatformAdmin(supabase);

  // Super admin "Enter School": no membership with this role, but a super
  // admin may operate any school as principal via a temporary membership.
  let tempModeValue: string | null = null;
  let enteredSchoolName: string | null = null;

  if (!membership || membership.length === 0) {
    if (!isSuperAdmin || role !== "principal") {
      return NextResponse.json(
        { error: "You do not have access to this school" },
        { status: 403 }
      );
    }

    const { data: school } = await admin
      .from("schools")
      .select("id, name, status")
      .eq("id", schoolId)
      .maybeSingle();

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
    if (school.status === "archived") {
      return NextResponse.json(
        { error: "Archived schools cannot be entered" },
        { status: 400 }
      );
    }
    enteredSchoolName = school.name ?? null;

    // Reuse a dormant leftover membership (unique(user_id, school_id, role)
    // guarantees at most one row) or create a fresh one.
    const { data: dormant } = await admin
      .from("school_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("school_id", schoolId)
      .eq("role", role)
      .maybeSingle();

    if (dormant) {
      await admin
        .from("school_members")
        .update({ is_active: true })
        .eq("id", dormant.id);
      tempModeValue = `activated:${dormant.id}`;
    } else {
      const { data: created, error: createError } = await admin
        .from("school_members")
        .insert({
          user_id: user.id,
          school_id: schoolId,
          role,
          is_active: true,
        })
        .select("id")
        .single();

      if (createError || !created) {
        console.error(
          "[set-active-school] Failed to create membership:",
          createError
        );
        return NextResponse.json(
          { error: "Failed to grant school access" },
          { status: 500 }
        );
      }
      tempModeValue = `created:${created.id}`;
    }
  }

  // If the user is in super-admin "Enter School" mode and switches to a
  // different school, end school mode: deactivate the temporary membership
  // and clear the mode cookie so the banner/principal view don't linger.
  const cookieStore = await cookies();
  const schoolMode = cookieStore.get("decimal_school_mode")?.value ?? "";
  let exitSchoolMode = false;

  if (schoolMode && isSuperAdmin) {
    const { data: profile } = await admin
      .from("profiles")
      .select("active_school_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.active_school_id && profile.active_school_id !== schoolId) {
      if (
        schoolMode.startsWith("created:") ||
        schoolMode.startsWith("activated:")
      ) {
        const tempMembershipId = schoolMode.split(":")[1];
        if (tempMembershipId) {
          await admin
            .from("school_members")
            .update({ is_active: false })
            .eq("id", tempMembershipId);
        }
      }

      await logAudit({
        schoolId: profile.active_school_id,
        userId: user.id,
        userEmail: user.email ?? undefined,
        action: "school.exit",
        resourceType: "school",
        resourceId: profile.active_school_id,
        metadata: { reason: "switched_school" },
        ipAddress:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
      });

      exitSchoolMode = true;
    }
  }

  // Upsert so the active school persists even when no profile row exists yet
  // (there is no signup trigger creating profiles). The DB trigger
  // validate_active_school_membership re-checks membership on update.
  const { error: upsertError } = await admin
    .from("profiles")
    .upsert({ id: user.id, active_school_id: schoolId }, { onConflict: "id" });

  if (upsertError) {
    console.error(
      "[set-active-school] Failed to persist active school:",
      upsertError
    );
    return NextResponse.json(
      { error: "Failed to set active school" },
      { status: 500 }
    );
  }

  // Record the enter in the audit trail (super admin entering a school).
  if (tempModeValue) {
    await logAudit({
      schoolId,
      userId: user.id,
      userEmail: user.email ?? undefined,
      action: "school.enter",
      resourceType: "school",
      resourceId: schoolId,
      metadata: { mode: "principal", schoolName: enteredSchoolName },
      ipAddress:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
  }

  const response = NextResponse.json({
    ok: true,
    redirectTo: portalRoutes[role] ?? "/teacher",
  });

  // Remember the chosen role so middleware/layouts gate by the role in the
  // active school rather than the user's first membership.
  response.cookies.set("decimal_active_role", role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });

  if (tempModeValue) {
    // Entering a school — remember the temporary membership so switching away
    // or exiting can deactivate it.
    response.cookies.set("decimal_school_mode", tempModeValue, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    });
  } else if (exitSchoolMode) {
    // Switching away from an operated school ends school mode.
    response.cookies.delete("decimal_school_mode");
  }

  return response;
}