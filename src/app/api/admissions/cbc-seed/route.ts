import { NextResponse } from "next/server";
import { resolveTuitionIdentity } from "@/lib/tuition/identity";
import { createAdminClient } from "@/lib/supabase/server-admin";

const JUNIOR_SCHOOL_SUBJECTS = [
  { name: "Mathematics", code: "MAT" },
  { name: "English", code: "ENG" },
  { name: "Kiswahili", code: "KIS" },
  { name: "Integrated Science", code: "SCI" },
  { name: "Social Studies", code: "SST" },
  { name: "Creative Arts and Sports", code: "CAS" },
  { name: "Christian Religious Education", code: "CRE" },
  { name: "Islamic Religious Education", code: "IRE" },
  { name: "Hindu Religious Education", code: "HRE" },
  { name: "Pre-Technical and Pre-Career Studies", code: "PTS" },
  { name: "Digital Literacy", code: "DL", required_room_type: "computer" },
  { name: "Home Science", code: "HSC" },
];

const SENIOR_SCHOOL_SUBJECTS = [
  { name: "Mathematics", code: "MAT" },
  { name: "English", code: "ENG" },
  { name: "Kiswahili", code: "KIS" },
  { name: "Community Service Learning", code: "CSL" },
  { name: "Physics", code: "PHY", required_room_type: "lab" },
  { name: "Chemistry", code: "CHM", required_room_type: "lab" },
  { name: "Biology", code: "BIO", required_room_type: "lab" },
  { name: "Computer Science", code: "CMP", required_room_type: "computer" },
  { name: "History", code: "HIS" },
  { name: "Geography", code: "GEO" },
  { name: "Business Studies", code: "BUS" },
  { name: "Religious Studies", code: "RLS" },
  { name: "Fine Art", code: "FAR" },
  { name: "Music", code: "MUS" },
  { name: "Sports Science", code: "SPT" },
  { name: "Home Science", code: "HSC" },
  { name: "Agriculture", code: "AGP" },
];

export async function POST(request: Request) {
  const supabase = await createAdminClient();

  const { data: session, error: userError } = await supabase.auth.getUser();

  if (userError || !session?.user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Verify the user is in school_members with a valid school_id
  const { data: member } = await supabase
    .from("school_members")
    .select("school_id")
    .eq("user_id", session.user.id)
    .eq("is_active", true)
    .single();

  if (!member || !member.school_id) {
    return NextResponse.json({ error: "No school access" }, { status: 403 });
  }

  const schoolId = member.school_id;

  const { data: existing } = await supabase
    .from("subjects")
    .select("id")
    .eq("school_id", schoolId)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ inserted: 0, message: "Already seeded" });
  }

  // Get school's education level to determine subjects
  const { data: school } = await supabase
    .from("schools")
    .select("education_level")
    .eq("id", schoolId)
    .single();

  const level = school?.education_level || "junior_senior";
  const subjects =
    level === "junior"
      ? JUNIOR_SCHOOL_SUBJECTS
      : level === "senior"
      ? SENIOR_SCHOOL_SUBJECTS
      : [...JUNIOR_SCHOOL_SUBJECTS, ...SENIOR_SCHOOL_SUBJECTS];

  if (subjects.length === 0) {
    return NextResponse.json({ inserted: 0 });
  }

  const rows = subjects.map((s) => ({
    school_id: schoolId,
    name: s.name,
    code: s.code,
    required_room_type: s.required_room_type || null,
  }));

  const { error } = await supabase.from("subjects").insert(rows);

  if (error) {
    return NextResponse.json(
      { error: `Failed to seed subjects: ${error.message}` },
      { status: 500 }
    );
  }

  await supabase
    .from("schools")
    .update({ curriculum_subjects_loaded: true })
    .eq("id", schoolId);

  return NextResponse.json({ inserted: rows.length });
}