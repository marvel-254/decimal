import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveTuitionIdentity } from "@/lib/tuition/identity";
import { listCurriculum } from "@/lib/tuition/programmes";

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
    return { ok: false, response: NextResponse.json(
      { error: "Unauthenticated" },
      { status: 401 }
    ) };
  }

  const identity = await resolveTuitionIdentity(user.id);
  if (
    identity.kind !== "member" ||
    !STAFF_ROLES.has(identity.role)
  ) {
    return { ok: false, response: NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    ) };
  }

  return {
    ok: true,
    userId: user.id,
    schoolId: identity.schoolId,
    role: identity.role,
  };
}

export async function GET() {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;

  try {
    const { curriculums } = await listCurriculum();
    return NextResponse.json({ curriculums });
  } catch (err) {
    console.error("[tuition/curriculum] list failed:", err);
    return NextResponse.json(
      { error: "Could not load curriculum" },
      { status: 500 }
    );
  }
}