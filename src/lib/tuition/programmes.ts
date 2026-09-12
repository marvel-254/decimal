/**
 * Decimal Tuition — Slice 1 shared contract: curriculum spine + teacher
 * programme builder.
 *
 * This file is the single source of truth for the programme-builder data
 * shapes. It is imported verbatim by the frontend agent AND by the tuition
 * API routes (src/app/api/tuition/programmes/*, /staff, /classes,
 * /curriculum).
 *
 * Server-side auth (resolveTuitionIdentity + role check + school scoping) is
 * enforced in the API routes; these functions assume the caller has already
 * resolved and validated the school.
 */
import { createAdminClient } from "@/lib/supabase/server-admin";

export type ProgrammeType =
  | "course"
  | "revision"
  | "remedial"
  | "exam_prep"
  | "club"
  | "sports"
  | "music"
  | "drama"
  | "debate"
  | "science"
  | "technology"
  | "competition"
  | "leadership"
  | "holiday"
  | "custom";
export type ProgrammeVisibility =
  | "private"
  | "school"
  | "classes"
  | "students"
  | "schools"
  | "network"
  | "public";
export type ProgrammeDifficulty = "beginner" | "intermediate" | "advanced";
export type LessonContentType =
  | "text"
  | "video"
  | "audio"
  | "document"
  | "presentation"
  | "embed"
  | "link"
  | "mixed";

export interface LessonDraft {
  id?: string;
  title: string;
  summary: string;
  contentType: LessonContentType;
  body: unknown[];
  durationMin: number;
  isPreview: boolean;
  position: number;
  strandId?: string | null;
}
export interface ModuleDraft {
  id?: string;
  title: string;
  description: string;
  position: number;
  lessons: LessonDraft[];
}
export interface InstructorRef {
  staffId: string;
  position: "lead" | "assistant";
}
export interface ProgrammeDraft {
  id: string;
  title: string;
  type: ProgrammeType;
  subjectId: string | null;
  gradeId: string | null;
  curriculumId: string | null;
  description: string;
  learningOutcomes: string[];
  prerequisites: string;
  durationWeeks: number;
  difficulty: ProgrammeDifficulty;
  visibility: ProgrammeVisibility;
  coverUrl: string | null;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  updatedAt: string | null;
}
export interface ProgrammeTree extends ProgrammeDraft {
  modules: ModuleDraft[];
  instructors: InstructorRef[];
  cohortClassIds: string[];
}
export interface ProgrammeListItem {
  id: string;
  title: string;
  type: ProgrammeType;
  subjectId: string | null;
  gradeId: string | null;
  status: string;
  visibility: ProgrammeVisibility;
  difficulty: ProgrammeDifficulty;
  durationWeeks: number;
  publishedAt: string | null;
  updatedAt: string | null;
  moduleCount: number;
  lessonCount: number;
}
export interface StaffRef {
  id: string;
  fullName: string;
}
export interface SchoolClassRef {
  id: string;
  name: string;
  gradeId: string | null;
  gradeName: string | null;
}
export interface CurriculumRef {
  id: string;
  name: string;
  code: string;
  level: string;
  subjects: {
    id: string;
    name: string;
    strands: { id: string; name: string; parentId: string | null }[];
  }[];
}
export interface PublishCheck {
  label: string;
  ok: boolean;
}

/** Content types that do not require a body — the resource itself *is* the content. */
const SELF_CONTAINED_TYPES = new Set<LessonContentType>([
  "video",
  "audio",
  "embed",
  "link",
]);

// ---------------------------------------------------------------------------
// Row mappers (createAdminClient() is intentionally untyped — no generated
// Database generic — so rows are declared locally).
// ---------------------------------------------------------------------------

type ProgrammeScalar = {
  id: string;
  title: string;
  type: string;
  subject_id: string | null;
  grade_id: string | null;
  curriculum_id: string | null;
  description: string | null;
  learning_outcomes: unknown;
  prerequisites: string | null;
  duration_weeks: number;
  difficulty: string;
  visibility: string;
  cover_url: string | null;
  status: string;
  published_at: string | null;
  updated_at: string | null;
};

function mapProgrammeDraft(row: ProgrammeScalar): ProgrammeDraft {
  return {
    id: row.id,
    title: row.title,
    type: row.type as ProgrammeType,
    subjectId: row.subject_id ?? null,
    gradeId: row.grade_id ?? null,
    curriculumId: row.curriculum_id ?? null,
    description: row.description ?? "",
    learningOutcomes: Array.isArray(row.learning_outcomes)
      ? (row.learning_outcomes as string[])
      : [],
    prerequisites: row.prerequisites ?? "",
    durationWeeks: row.duration_weeks,
    difficulty: row.difficulty as ProgrammeDifficulty,
    visibility: row.visibility as ProgrammeVisibility,
    coverUrl: row.cover_url ?? null,
    status: row.status as ProgrammeDraft["status"],
    publishedAt: row.published_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

/**
 * Fetch a full programme tree (scalars + modules + lessons + instructors +
 * cohort class ids). Throws if the programme does not exist.
 */
export async function getProgramme(
  id: string
): Promise<{ programme: ProgrammeTree }> {
  const admin = createAdminClient();

  const { data: row, error: scalarError } = await admin
    .from("programmes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (scalarError) throw scalarError;
  if (!row) throw new Error("Programme not found");

  const [moduleRes, lessonRes, instructorRes, cohortRes] = await Promise.all([
    admin
      .from("programme_modules")
      .select("id, title, description, position")
      .eq("programme_id", id)
      .eq("is_active", true)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    admin
      .from("programme_lessons")
      .select(
        "id, module_id, title, summary, content_type, body, duration_min, is_preview, position, strand_id"
      )
      .eq("programme_id", id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    admin
      .from("programme_instructors")
      .select("staff_id, position")
      .eq("programme_id", id)
      .order("created_at", { ascending: true }),
    admin
      .from("programme_cohorts")
      .select("class_id")
      .eq("programme_id", id)
      .order("created_at", { ascending: true }),
  ]);
  for (const res of [moduleRes, lessonRes, instructorRes, cohortRes]) {
    if (res.error) throw res.error;
  }

  const modules = (moduleRes.data ?? []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    title: m.title as string,
    description: (m.description as string | null) ?? "",
    position: m.position as number,
    lessons: [] as LessonDraft[],
  }));

  const { data: lessonRows } = lessonRes;
  const lessonsByModule = new Map<string, LessonDraft[]>();
  for (const m of modules) lessonsByModule.set(m.id, []);
  for (const l of lessonRows ?? []) {
    const lr = l as Record<string, unknown>;
    const lesson: LessonDraft = {
      id: lr.id as string,
      title: lr.title as string,
      summary: (lr.summary as string | null) ?? "",
      contentType: lr.content_type as LessonContentType,
      body: Array.isArray(lr.body) ? (lr.body as unknown[]) : [],
      durationMin: lr.duration_min as number,
      isPreview: lr.is_preview as boolean,
      position: lr.position as number,
      strandId: (lr.strand_id as string | null) ?? null,
    };
    lessonsByModule.get(lr.module_id as string)?.push(lesson);
  }
  for (const m of modules) m.lessons = lessonsByModule.get(m.id) ?? [];

  const instructors: InstructorRef[] = (instructorRes.data ?? []).map(
    (i: Record<string, unknown>) => ({
      staffId: i.staff_id as string,
      position: i.position === "assistant" ? "assistant" : "lead",
    })
  );

  const cohortClassIds = Array.from(
    new Set(
      (cohortRes.data ?? [])
        .map((c: Record<string, unknown>) => c.class_id)
        .filter((c): c is string => typeof c === "string")
    )
  );

  const programme: ProgrammeTree = {
    ...mapProgrammeDraft(row as unknown as ProgrammeScalar),
    modules,
    instructors,
    cohortClassIds,
  };

  return { programme };
}

/**
 * List programme summary rows (status != archived) for a school, with module
 * and lesson counts.
 */
export async function listProgrammes(
  schoolId: string
): Promise<{ programmes: ProgrammeListItem[] }> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("programmes")
    .select(
      "id, title, type, subject_id, grade_id, status, visibility, difficulty, duration_weeks, published_at, updated_at, programme_modules(count), programme_lessons(count)"
    )
    .eq("school_id", schoolId)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const programmes: ProgrammeListItem[] = (data ?? []).map(
    (r: Record<string, unknown>) => {
      const modulesAgg = r.programme_modules as
        | { count?: number }[]
        | null
        | undefined;
      const lessonsAgg = r.programme_lessons as
        | { count?: number }[]
        | null
        | undefined;
      return {
        id: r.id as string,
        title: r.title as string,
        type: r.type as ProgrammeType,
        subjectId: (r.subject_id as string | null) ?? null,
        gradeId: (r.grade_id as string | null) ?? null,
        status: r.status as string,
        visibility: r.visibility as ProgrammeVisibility,
        difficulty: r.difficulty as ProgrammeDifficulty,
        durationWeeks: r.duration_weeks as number,
        publishedAt: (r.published_at as string | null) ?? null,
        updatedAt: (r.updated_at as string | null) ?? null,
        moduleCount: modulesAgg?.[0]?.count ?? 0,
        lessonCount: lessonsAgg?.[0]?.count ?? 0,
      } satisfies ProgrammeListItem;
    }
  );

  return { programmes };
}

/**
 * Create a draft programme. The full tree is returned so the builder can
 * render synchronously after a "New programme" click.
 */
export async function createProgramme(input: {
  title: string;
  type: ProgrammeType;
  schoolId: string;
}): Promise<{ programme: ProgrammeTree }> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("programmes")
    .insert({
      school_id: input.schoolId,
      title: input.title.trim(),
      type: input.type,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("Programme insert returned no row");

  return getProgramme(data.id as string);
}

/**
 * Autosave a full programme tree. Never changes status/published_at — publish
 * goes through publishProgramme(). Idempotent: modules/lessons/instructors/
 * cohorts are reconciled against the incoming tree by id.
 */
export async function saveProgramme(
  id: string,
  tree: ProgrammeTree
): Promise<{ programme: ProgrammeTree }> {
  const admin = createAdminClient();

  const { data: existing, error: existingError } = await admin
    .from("programmes")
    .select("school_id")
    .eq("id", id)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existing) throw new Error("Programme not found");
  const schoolId = existing.school_id as string;

  // (a) Scalar fields — status/published_at deliberately untouched.
  const { error: updateError } = await admin
    .from("programmes")
    .update({
      title: tree.title,
      type: tree.type,
      subject_id: tree.subjectId,
      grade_id: tree.gradeId,
      curriculum_id: tree.curriculumId,
      description: tree.description,
      learning_outcomes: tree.learningOutcomes,
      prerequisites: tree.prerequisites,
      duration_weeks: tree.durationWeeks,
      difficulty: tree.difficulty,
      visibility: tree.visibility,
      cover_url: tree.coverUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (updateError) throw updateError;

  // (b) Sync modules + lessons. IDs the client sends are only trusted when
  // they already belong to this programme; anything else (new/forged ids) is
  // inserted fresh so we can never write across programme boundaries.
  const incomingModuleIds = tree.modules
    .map((m) => m.id)
    .filter((x): x is string => !!x);
  const incomingLessonIds = tree.modules
    .flatMap((m) => m.lessons.map((l) => l.id))
    .filter((x): x is string => !!x);

  // PostgREST rejects `not.in.<single-value>` (no parens) for single-element
  // arrays, so branch explicitly instead of chaining `.not("id","in",ids)`.
  let lessonDeleter = admin
    .from("programme_lessons")
    .delete()
    .eq("programme_id", id);
  if (incomingLessonIds.length === 1) {
    lessonDeleter = lessonDeleter.neq("id", incomingLessonIds[0]);
  } else if (incomingLessonIds.length > 1) {
    lessonDeleter = lessonDeleter.not("id", "in", incomingLessonIds);
  }
  const { error: deleteLessonError } = await lessonDeleter;
  if (deleteLessonError) throw deleteLessonError;

  let moduleDeleter = admin
    .from("programme_modules")
    .delete()
    .eq("programme_id", id);
  if (incomingModuleIds.length === 1) {
    moduleDeleter = moduleDeleter.neq("id", incomingModuleIds[0]);
  } else if (incomingModuleIds.length > 1) {
    moduleDeleter = moduleDeleter.not("id", "in", incomingModuleIds);
  }
  const { error: deleteModuleError } = await moduleDeleter;
  if (deleteModuleError) throw deleteModuleError;

  const [existingModules, existingLessons] = await Promise.all([
    admin
      .from("programme_modules")
      .select("id")
      .eq("programme_id", id),
    admin
      .from("programme_lessons")
      .select("id")
      .eq("programme_id", id),
  ]);
  if (existingModules.error) throw existingModules.error;
  if (existingLessons.error) throw existingLessons.error;
  const validModuleIds = new Set(
    (existingModules.data ?? []).map((r) => r.id as string)
  );
  const validLessonIds = new Set(
    (existingLessons.data ?? []).map((r) => r.id as string)
  );

  for (const m of tree.modules) {
    const modulePayload = {
      programme_id: id,
      school_id: schoolId,
      title: m.title,
      description: m.description ?? "",
      position: m.position,
    };
    let moduleId: string;
    if (m.id && validModuleIds.has(m.id)) {
      const { data, error } = await admin
        .from("programme_modules")
        .upsert({ id: m.id, ...modulePayload }, { onConflict: "id" })
        .select("id")
        .single();
      if (error) throw error;
      moduleId = data.id as string;
    } else {
      const { data, error } = await admin
        .from("programme_modules")
        .insert(modulePayload)
        .select("id")
        .single();
      if (error) throw error;
      moduleId = data.id as string;
    }

    for (const l of m.lessons) {
      const lessonPayload = {
        module_id: moduleId,
        programme_id: id,
        school_id: schoolId,
        title: l.title,
        summary: l.summary ?? "",
        content_type: l.contentType,
        body: l.body ?? [],
        duration_min: l.durationMin,
        is_preview: l.isPreview,
        position: l.position,
        strand_id: l.strandId ?? null,
      };
      if (l.id && validLessonIds.has(l.id)) {
        const { error } = await admin
          .from("programme_lessons")
          .upsert({ id: l.id, ...lessonPayload }, { onConflict: "id" });
        if (error) throw error;
      } else {
        const { error } = await admin
          .from("programme_lessons")
          .insert(lessonPayload);
        if (error) throw error;
      }
    }
  }

  // (c) Sync instructors (PK programme_id + staff_id).
  const { data: instructorRows, error: instructorReadError } = await admin
    .from("programme_instructors")
    .select("staff_id")
    .eq("programme_id", id);
  if (instructorReadError) throw instructorReadError;

  const incomingStaffIds = tree.instructors.map((i) => i.staffId);
  const staffToRemove = (instructorRows ?? [])
    .map((r) => r.staff_id as string)
    .filter((staffId) => !incomingStaffIds.includes(staffId));
  if (staffToRemove.length === 1) {
    const { error } = await admin
      .from("programme_instructors")
      .delete()
      .eq("programme_id", id)
      .eq("staff_id", staffToRemove[0]);
    if (error) throw error;
  } else if (staffToRemove.length > 1) {
    const { error } = await admin
      .from("programme_instructors")
      .delete()
      .eq("programme_id", id)
      .in("staff_id", staffToRemove);
    if (error) throw error;
  }
  for (const i of tree.instructors) {
    const { error } = await admin
      .from("programme_instructors")
      .upsert(
        {
          programme_id: id,
          school_id: schoolId,
          staff_id: i.staffId,
          position: i.position,
        },
        { onConflict: "programme_id,staff_id" }
      );
    if (error) throw error;
  }

  // (d) Sync cohorts (class ids).
  const incomingClassIds = Array.from(new Set(tree.cohortClassIds ?? []));
  const { data: cohortRows, error: cohortReadError } = await admin
    .from("programme_cohorts")
    .select("class_id")
    .eq("programme_id", id);
  if (cohortReadError) throw cohortReadError;

  const existingClassIds = new Set(
    (cohortRows ?? [])
      .map((r) => r.class_id)
      .filter((c): c is string => typeof c === "string")
  );
  const classesToRemove = [...existingClassIds].filter(
    (classId) => !incomingClassIds.includes(classId)
  );
  if (classesToRemove.length === 1) {
    const { error } = await admin
      .from("programme_cohorts")
      .delete()
      .eq("programme_id", id)
      .eq("class_id", classesToRemove[0]);
    if (error) throw error;
  } else if (classesToRemove.length > 1) {
    const { error } = await admin
      .from("programme_cohorts")
      .delete()
      .eq("programme_id", id)
      .in("class_id", classesToRemove);
    if (error) throw error;
  }
  const classesToAdd = incomingClassIds.filter((c) => !existingClassIds.has(c));
  if (classesToAdd.length > 0) {
    const classQuery =
      classesToAdd.length === 1
        ? admin.from("classes").select("id, name").eq("id", classesToAdd[0])
        : admin.from("classes").select("id, name").in("id", classesToAdd);
    const { data: classRows, error: classReadError } = await classQuery;
    if (classReadError) throw classReadError;
    const nameById = new Map(
      (classRows ?? []).map((r) => [r.id as string, r.name as string])
    );
    for (const classId of classesToAdd) {
      const { error } = await admin.from("programme_cohorts").insert({
        programme_id: id,
        school_id: schoolId,
        class_id: classId,
        name: nameById.get(classId) ?? classId,
      });
      if (error) throw error;
    }
  }

  return getProgramme(id);
}

/**
 * Run the publish gate; on success flips status to published. Returns the
 * validation checks either way.
 */
export async function publishProgramme(
  id: string
): Promise<{ ok: boolean; errors: PublishCheck[] }> {
  const admin = createAdminClient();
  const { programme } = await getProgramme(id);
  const errors = validateProgrammeForPublish(programme);
  if (errors.some((e) => !e.ok)) return { ok: false, errors };

  const now = new Date().toISOString();
  const { error } = await admin
    .from("programmes")
    .update({ status: "published", published_at: now, updated_at: now })
    .eq("id", id);
  if (error) throw error;

  return { ok: true, errors };
}

/**
 * Staff of a school. Staff relate to school_members via user_id (there is no
 * school_members.staff_id column), so rows are listed directly off the staff
 * table — which carries school_id — scoped by school.
 */
export async function listStaff(
  schoolId: string
): Promise<{ staff: StaffRef[] }> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("staff")
    .select("id, first_name, last_name")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .order("first_name", { ascending: true })
    .order("last_name", { ascending: true });
  if (error) throw error;

  const staff: StaffRef[] = (data ?? []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    fullName: `${r.first_name as string} ${r.last_name as string}`.trim(),
  }));

  return { staff };
}

/** Classes of a school with their grade names (joined in JS). */
export async function listClasses(
  schoolId: string
): Promise<{ classes: SchoolClassRef[] }> {
  const admin = createAdminClient();

  const [classRes, gradeRes] = await Promise.all([
    admin
      .from("classes")
      .select("id, name, grade_id")
      .eq("school_id", schoolId)
      .order("name", { ascending: true }),
    admin
      .from("grades")
      .select("id, name")
      .eq("school_id", schoolId),
  ]);
  if (classRes.error) throw classRes.error;
  if (gradeRes.error) throw gradeRes.error;

  const gradeNameById = new Map(
    (gradeRes.data ?? []).map((g) => [g.id as string, g.name as string])
  );
  const classes: SchoolClassRef[] = (classRes.data ?? []).map(
    (r: Record<string, unknown>) => {
      const gradeId = (r.grade_id as string | null) ?? null;
      return {
        id: r.id as string,
        name: r.name as string,
        gradeId,
        gradeName: gradeId ? (gradeNameById.get(gradeId) ?? null) : null,
      };
    }
  );

  return { classes };
}

/** Active curriculums with active subjects and their strands (ordered). */
export async function listCurriculum(): Promise<{
  curriculums: CurriculumRef[];
}> {
  const admin = createAdminClient();

  const [curriculumRes, subjectRes, strandRes] = await Promise.all([
    admin
      .from("curriculums")
      .select("id, name, code, level")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    admin
      .from("curriculum_subjects")
      .select("id, name, curriculum_id")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    admin
      .from("curriculum_strands")
      .select("id, name, parent_id, curriculum_subject_id")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);
  if (curriculumRes.error) throw curriculumRes.error;
  if (subjectRes.error) throw subjectRes.error;
  if (strandRes.error) throw strandRes.error;

  const strandsBySubject = new Map<string, CurriculumRef["subjects"][number]["strands"]>();
  for (const st of strandRes.data ?? []) {
    const list = strandsBySubject.get(st.curriculum_subject_id as string) ?? [];
    list.push({
      id: st.id as string,
      name: st.name as string,
      parentId: (st.parent_id as string | null) ?? null,
    });
    strandsBySubject.set(st.curriculum_subject_id as string, list);
  }

  const subjectsByCurriculum = new Map<string, CurriculumRef["subjects"]>();
  for (const s of subjectRes.data ?? []) {
    const list = subjectsByCurriculum.get(s.curriculum_id as string) ?? [];
    list.push({
      id: s.id as string,
      name: s.name as string,
      strands: strandsBySubject.get(s.id as string) ?? [],
    });
    subjectsByCurriculum.set(s.curriculum_id as string, list);
  }

  const curriculums: CurriculumRef[] = (curriculumRes.data ?? []).map(
    (c: Record<string, unknown>) => ({
      id: c.id as string,
      name: c.name as string,
      code: c.code as string,
      level: c.level as string,
      subjects: subjectsByCurriculum.get(c.id as string) ?? [],
    })
  );

  return { curriculums };
}

/**
 * Publish-readiness gate. Order and labels are part of the slice contract —
 * the builder renders these verbatim.
 */
export function validateProgrammeForPublish(
  programme: ProgrammeTree
): PublishCheck[] {
  const lessons = programme.modules.flatMap((m) => m.lessons);
  return [
    {
      label: "Programme details complete",
      ok: programme.title.trim().length > 0 && programme.type.length > 0,
    },
    {
      label: "At least one module",
      ok: programme.modules.length > 0,
    },
    {
      label: "Every module has a lesson",
      ok: programme.modules.every((m) => m.lessons.length > 0),
    },
    {
      label: "Lessons have content",
      ok: lessons.every(
        (l) =>
          (Array.isArray(l.body) && l.body.length > 0) ||
          SELF_CONTAINED_TYPES.has(l.contentType)
      ),
    },
    {
      label: "Access scope chosen",
      ok: programme.visibility !== "private" || programme.cohortClassIds.length > 0,
    },
    {
      label: "At least one lead instructor",
      ok: programme.instructors.some((i) => i.position === "lead"),
    },
  ];
}