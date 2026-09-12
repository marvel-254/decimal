import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server-admin";

export const runtime = "nodejs";

function shortId(len = 6) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function uniqueAdmissionNumber(admin: ReturnType<typeof createAdminClient>) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `T-${shortId()}`;
    const { data, error } = await admin
      .from("students")
      .select("id")
      .eq("admission_number", candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
  }
  throw new Error("Could not allocate an admission number");
}

/**
 * STU-01 grade-picker onboarding. Creates a minimal student profile + the
 * tuition_student_users identity bridge for the signed-in account.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let body: { schoolId?: string; gradeId?: string; name?: string | null };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const schoolId = body.schoolId?.trim();
  const gradeId = body.gradeId?.trim();
  if (!schoolId || !gradeId) {
    return NextResponse.json(
      { error: "schoolId and gradeId are required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // SYS-06: onboarding links an account to a school. Membership is NOT
  // required — students and parents resolve their identity through the
  // bridge, so a brand-new Decimal account can onboard into tuition too.
  const { data: school } = await admin
    .from("schools")
    .select("id")
    .eq("id", schoolId)
    .maybeSingle();
  if (!school) {
    return NextResponse.json({ error: "Unknown school" }, { status: 403 });
  }

  // Idempotency: if the identity bridge already exists, return the existing
  // student instead of creating a duplicate row (stale-tab double submits).
  const { data: existingBridge } = await admin
    .from("tuition_student_users")
    .select("student_id")
    .eq("user_id", user.id)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (existingBridge) {
    return NextResponse.json({ ok: true, studentId: existingBridge.student_id });
  }

  // Resolve the class from the requested grade, falling back to any class in
  // the school so class_id stays populated.
  const { data: grade } = await admin
    .from("grades")
    .select("id, classes(id)")
    .eq("id", gradeId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!grade) {
    return NextResponse.json({ error: "Unknown grade" }, { status: 400 });
  }

  let classId: string | null = (grade.classes as { id: string }[] | null)?.[0]?.id ?? null;
  if (!classId) {
    const { data: fallbackClass } = await admin
      .from("classes")
      .select("id")
      .eq("school_id", schoolId)
      .limit(1)
      .maybeSingle();
    classId = fallbackClass?.id ?? null;
  }
  if (!classId) {
    return NextResponse.json(
      { error: "No class is set up in this school yet" },
      { status: 400 }
    );
  }

  const fullName = body.name?.trim();
  const first = fullName?.split(/\s+/)[0] ?? "Student";
  const last = fullName ? fullName.split(/\s+/).slice(1).join(" ") || "Learner" : "Learner";

  const admissionNumber = await uniqueAdmissionNumber(admin);

  const { data: student, error: studentError } = await admin
    .from("students")
    .insert({
      school_id: schoolId,
      class_id: classId,
      first_name: first,
      last_name: last,
      admission_number: admissionNumber,
      is_active: true,
    })
    .select("id")
    .single();

  if (studentError || !student) {
    console.error("[tuition/onboarding] student insert failed:", studentError);
    return NextResponse.json(
      { error: "Could not create the student profile" },
      { status: 500 }
    );
  }

  const { error: bridgeError } = await admin.from("tuition_student_users").insert({
    user_id: user.id,
    student_id: student.id,
    school_id: schoolId,
  });
  if (bridgeError) {
    // Roll back the orphaned student row so retries stay idempotent.
    await admin.from("students").delete().eq("id", student.id);
    console.error("[tuition/onboarding] bridge insert failed:", bridgeError);
    return NextResponse.json(
      { error: "Could not link your student identity" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, studentId: student.id });
}