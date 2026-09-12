import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server-admin";
import { resolveTuitionIdentity } from "@/lib/tuition/identity";
import {
  getProgramme,
  saveProgramme,
  type LessonDraft,
  type ModuleDraft,
  type ProgrammeTree,
} from "@/lib/tuition/programmes";

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

/** 404 if missing, 403 if the programme belongs to another school. */
async function verifyOwnership(
  programmeId: string,
  schoolId: string
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("programmes")
    .select("school_id")
    .eq("id", programmeId)
    .maybeSingle();
  if (error) throw error;
  if (!row) {
    return { ok: false, response: NextResponse.json(
      { error: "Programme not found" },
      { status: 404 }
    ) };
  }
  if (row.school_id !== schoolId) {
    return { ok: false, response: NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    ) };
  }
  return { ok: true };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isLessonDraft(v: unknown): v is LessonDraft {
  if (!isRecord(v)) return false;
  return (
    typeof v.title === "string" &&
    typeof v.summary === "string" &&
    typeof v.contentType === "string" &&
    Array.isArray(v.body) &&
    typeof v.durationMin === "number" &&
    typeof v.isPreview === "boolean" &&
    typeof v.position === "number" &&
    (v.id === undefined || typeof v.id === "string") &&
    (v.strandId === undefined ||
      v.strandId === null ||
      typeof v.strandId === "string")
  );
}

function isModuleDraft(v: unknown): v is ModuleDraft {
  if (!isRecord(v)) return false;
  return (
    typeof v.title === "string" &&
    typeof v.description === "string" &&
    typeof v.position === "number" &&
    (v.id === undefined || typeof v.id === "string") &&
    Array.isArray(v.lessons) &&
    v.lessons.every(isLessonDraft)
  );
}

function isInstructorRef(v: unknown): boolean {
  return (
    isRecord(v) &&
    typeof v.staffId === "string" &&
    (v.position === "lead" || v.position === "assistant")
  );
}

function isProgrammeTree(v: unknown): v is ProgrammeTree {
  if (!isRecord(v)) return false;
  return (
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    typeof v.type === "string" &&
    (v.subjectId === undefined ||
      v.subjectId === null ||
      typeof v.subjectId === "string") &&
    (v.gradeId === undefined ||
      v.gradeId === null ||
      typeof v.gradeId === "string") &&
    (v.curriculumId === undefined ||
      v.curriculumId === null ||
      typeof v.curriculumId === "string") &&
    Array.isArray(v.modules) &&
    v.modules.every(isModuleDraft) &&
    Array.isArray(v.instructors) &&
    v.instructors.every(isInstructorRef) &&
    Array.isArray(v.cohortClassIds) &&
    v.cohortClassIds.every((c) => typeof c === "string")
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const owned = await verifyOwnership(id, auth.schoolId);
    if (!owned.ok) return owned.response;

    const { programme } = await getProgramme(id);
    return NextResponse.json({ programme });
  } catch (err) {
    console.error(`[tuition/programmes/${id}] get failed:`, err);
    return NextResponse.json(
      { error: "Could not load programme" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!isProgrammeTree(body) || body.id !== id) {
    return NextResponse.json(
      { error: "Invalid programme payload" },
      { status: 400 }
    );
  }

  try {
    const owned = await verifyOwnership(id, auth.schoolId);
    if (!owned.ok) return owned.response;

    const { programme } = await saveProgramme(id, body);
    return NextResponse.json({ programme });
  } catch (err) {
    console.error(`[tuition/programmes/${id}] save failed:`, err);
    return NextResponse.json(
      { error: "Could not save programme" },
      { status: 500 }
    );
  }
}