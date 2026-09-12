import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveTuitionIdentity } from "@/lib/tuition/identity";
import {
  createProgramme,
  listProgrammes,
  type ProgrammeType,
} from "@/lib/tuition/programmes";

export const runtime = "nodejs";

const PROGRAMME_TYPES = new Set<ProgrammeType>([
  "course",
  "revision",
  "remedial",
  "exam_prep",
  "club",
  "sports",
  "music",
  "drama",
  "debate",
  "science",
  "technology",
  "competition",
  "leadership",
  "holiday",
  "custom",
]);

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

export async function GET(request: Request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;

  const schoolParam = new URL(request.url).searchParams.get("school")?.trim();
  if (schoolParam && schoolParam !== auth.schoolId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { programmes } = await listProgrammes(schoolParam ?? auth.schoolId);
    return NextResponse.json({ programmes });
  } catch (err) {
    console.error("[tuition/programmes] list failed:", err);
    return NextResponse.json(
      { error: "Could not list programmes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireStaff();
  if (!auth.ok) return auth.response;

  let body: { title?: unknown; type?: unknown; schoolId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const type = typeof body.type === "string" ? body.type : "";
  const schoolId = typeof body.schoolId === "string" ? body.schoolId.trim() : "";

  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!PROGRAMME_TYPES.has(type as ProgrammeType)) {
    return NextResponse.json({ error: "Invalid programme type" }, { status: 400 });
  }
  if (!schoolId || schoolId !== auth.schoolId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { programme } = await createProgramme({
      title,
      type: type as ProgrammeType,
      schoolId,
    });
    return NextResponse.json({ programme }, { status: 201 });
  } catch (err) {
    console.error("[tuition/programmes] create failed:", err);
    return NextResponse.json(
      { error: "Could not create programme" },
      { status: 500 }
    );
  }
}