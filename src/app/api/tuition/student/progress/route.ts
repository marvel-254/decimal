import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveTuitionIdentity } from "@/lib/tuition/identity";
import { markLessonComplete } from "@/lib/tuition/student";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const identity = await resolveTuitionIdentity(user.id);
  if (
    identity.kind !== "student" &&
    !(identity.kind === "member" && identity.studentId)
  ) {
    return NextResponse.json({ error: "Not a student" }, { status: 403 });
  }

  const body = await request.json();
  const programmeId =
    typeof body.programmeId === "string" ? body.programmeId : null;
  const lessonId =
    typeof body.lessonId === "string" ? body.lessonId : null;
  if (!programmeId || !lessonId)
    return NextResponse.json(
      { error: "Missing programmeId or lessonId" },
      { status: 400 }
    );

  const studentId =
    identity.kind === "student"
      ? identity.studentId
      : (identity.studentId as string);
  const schoolId = identity.schoolId;

  try {
    const result = await markLessonComplete(
      studentId,
      schoolId,
      programmeId,
      lessonId
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
