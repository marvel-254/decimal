import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server-admin";
import { resolveTuitionIdentity } from "@/lib/tuition/identity";
import { deleteProgramme } from "@/lib/tuition/programmes";

export const runtime = "nodejs";

const STAFF_ROLES = new Set(["teacher", "timetable_manager", "principal"]);

type AuthOk = { ok: true; userId: string; schoolId: string; role: string };
type AuthResult = AuthOk | { ok: false; response: NextResponse };

async function requireStaff(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }),
    };
  }

  const identity = await resolveTuitionIdentity(user.id);
  if (
    identity.kind !== "member" ||
    !STAFF_ROLES.has(identity.role)
  ) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true,
    userId: user.id,
    schoolId: identity.schoolId,
    role: identity.role,
  };
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  const admin = createAdminClient();
  try {
    const { data: row, error } = await admin
      .from("programmes")
      .select("school_id, status")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!row) {
      return NextResponse.json({ error: "Programme not found" }, { status: 404 });
    }
    if (row.school_id !== auth.schoolId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (row.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft programmes can be deleted" },
        { status: 400 }
      );
    }

    const { ok, error: deleteError } = await deleteProgramme(id);
    if (!ok) {
      console.error(`[tuition/teacher/programmes/${id}] delete`, deleteError);
      return NextResponse.json(
        { error: deleteError ?? "Could not delete programme" },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`[tuition/teacher/programmes/${id}] delete failed:`, err);
    return NextResponse.json(
      { error: "Could not delete programme" },
      { status: 500 }
    );
  }
}