import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server-admin";
import { rateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/services/audit";

export async function PATCH(request: Request) {
  const rl = await rateLimit(request, { maxRequests: 10, windowMs: 60_000, prefix: "admin:update-school" });
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: isAdmin } = await supabase.rpc("is_super_admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { schoolId, status, subscriptionStatus } = body;

  if (!schoolId) {
    return NextResponse.json({ error: "schoolId is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (status !== undefined) updates.status = status;
if (subscriptionStatus !== undefined) updates.subscription_status = subscriptionStatus;

  const VALID_STATUSES = ["pending", "approved", "active", "rejected", "suspended", "archived"];

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("schools")
    .update(updates)
    .eq("id", schoolId)
    .select("id, status, subscription_status")
    .single();

  // Previously the error was logged and swallowed, so the super admin UI saw
  // a success toast for a write that never happened (e.g. the "rejected"
  // status, which was not a member of the school_status enum).
  if (error) {
    console.error("[update-school] Failed:", error);
    return NextResponse.json({ error: "Failed to update school" }, { status: 500 });
  }

  // Suspending, rejecting or archiving a school is a sensitive, auditable
  // action — it was previously unrecorded.
  await logAudit({
    schoolId,
    userId: user.id,
    userEmail: user.email,
    action: "school.update",
    resourceType: "school",
    resourceId: schoolId,
    metadata: { updates },
    ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  return NextResponse.json({ ok: true, school: data });
}
