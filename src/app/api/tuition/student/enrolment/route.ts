import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveTuitionIdentity } from "@/lib/tuition/identity";
import { updateEnrolmentStatus } from "@/lib/tuition/student";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const identity = await resolveTuitionIdentity(user.id);
  let studentId: string | null = null;
  if (identity.kind === "student") {
    studentId = identity.studentId;
  } else if (identity.kind === "member" && identity.studentId) {
    studentId = identity.studentId;
  }
  if (!studentId)
    return NextResponse.json({ error: "Not a student" }, { status: 403 });

  const body = await request.json();
  const programmeId =
    typeof body.programmeId === "string" ? body.programmeId : null;
  const action = body.action;
  if (!programmeId || (action !== "accept" && action !== "decline")) {
    return NextResponse.json(
      { error: "Missing programmeId or action" },
      { status: 400 }
    );
  }

  try {
    const result = await updateEnrolmentStatus(
      studentId,
      programmeId,
      action === "accept" ? "active" : "dropped"
    );
    if (!result.ok)
      return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}