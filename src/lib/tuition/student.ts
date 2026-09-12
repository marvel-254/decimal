/**
 * Decimal Tuition — Slice 2: student learn journey service functions.
 *
 * Student-facing reads/mutations for the published programme catalog
 * (STU-02/03 Explore), programme detail (STU-04), My Learning (STU-05) and
 * the lesson player (STU-06/07). Server-side identity/school scoping is
 * enforced by the callers (pages + API routes); these functions use the
 * service-role client so writes are not dependent on per-row RLS.
 */
import { createAdminClient } from "@/lib/supabase/server-admin";

export interface ExploreProgramme {
  id: string;
  title: string;
  type: string;
  subjectId: string | null;
  subjectName: string | null;
  gradeId: string | null;
  gradeName: string | null;
  difficulty: string;
  durationWeeks: number;
  coverUrl: string | null;
  publishedAt: string | null;
  moduleCount: number;
  lessonCount: number;
  leadInstructor: string | null;
  studentsCount: number;
}

export interface StudentLesson {
  id: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  summary: string;
  contentType: string;
  body: unknown[];
  durationMin: number;
  position: number;
  status: string;
  isPreview: boolean;
}

export interface StudentProgrammeDetail {
  id: string;
  title: string;
  type: string;
  subjectId: string | null;
  subjectName: string | null;
  gradeId: string | null;
  gradeName: string | null;
  curriculumName: string | null;
  description: string;
  durationWeeks: number;
  difficulty: string;
  coverUrl: string | null;
  publishedAt: string | null;
  modules: {
    id: string;
    title: string;
    description: string;
    position: number;
    lessons: StudentLesson[];
  }[];
  leadInstructor: string | null;
  assistantInstructors: string[];
  visibility: string;
  enrolled: boolean;
}

export interface MyLearningEntry {
  programmeId: string;
  title: string;
  type: string;
  subjectName: string | null;
  gradeName: string | null;
  difficulty: string;
  durationWeeks: number;
  coverUrl: string | null;
  enrolmentStatus: string;
  enrolledAt: string | null;
  totalLessons: number;
  completedLessons: number;
  lessonsCompleted: string[];
}

export interface ExploreFilters {
  q?: string;
  subjectId?: string;
  gradeId?: string;
  sort?: "newest" | "rating";
}

function countAgg(items: { count?: number }[] | null | undefined): number {
  return items?.[0]?.count ?? 0;
}

/**
 * Visible programmes a student of a school can browse: published, active and
 * scoped to the school or public. Returns subject/grade/instructor display
 * names too so the catalog reads without extra round-trips.
 */
export async function listExploreProgrammes(
  schoolId: string,
  filters: ExploreFilters = {}
): Promise<{ programmes: ExploreProgramme[] }> {
  const admin = createAdminClient();

  let builder = admin
    .from("programmes")
    .select(
      "id, title, type, subject_id, grade_id, difficulty, duration_weeks, cover_url, published_at, rating_avg, students_count, is_active, curriculum_subjects(name), grades(name), programme_modules(count), programme_lessons(count), programme_instructors(staff_id, position, staff(first_name, last_name))"
    )
    .eq("school_id", schoolId)
    .eq("status", "published")
    .eq("is_active", true)
    .in("visibility", ["public", "school"]);

  if (filters.subjectId) {
    builder = builder.eq("subject_id", filters.subjectId);
  }
  if (filters.gradeId) {
    builder = builder.eq("grade_id", filters.gradeId);
  }
  if (filters.q) {
    builder = builder.ilike("title", `%${filters.q}%`);
  }
  builder =
    filters.sort === "rating"
      ? builder.order("rating_avg", { ascending: false }).order("published_at", {
          ascending: false,
        })
      : builder.order("published_at", { ascending: false }).order("rating_avg", {
          ascending: false,
        });

  const { data, error } = await builder.limit(200);
  if (error) throw error;

  const programmes: ExploreProgramme[] = (data ?? []).map(
    (r: Record<string, unknown>) => {
      const subject = (r.curriculum_subjects as
        | { name: string }[]
        | null) ?? null;
      const grade = (r.grades as { name: string }[] | null) ?? null;
      const instructors = (r.programme_instructors as unknown as
        | {
            position: string;
            staff: { first_name: string; last_name: string } | null;
          }[]
        | null) ?? null;
      const lead = instructors?.find((i) => i.position === "lead")?.staff;
      return {
        id: r.id as string,
        title: r.title as string,
        type: r.type as string,
        subjectId: (r.subject_id as string | null) ?? null,
        subjectName: subject?.[0]?.name ?? null,
        gradeId: (r.grade_id as string | null) ?? null,
        gradeName: grade?.[0]?.name ?? null,
        difficulty: r.difficulty as string,
        durationWeeks: r.duration_weeks as number,
        coverUrl: (r.cover_url as string | null) ?? null,
        publishedAt: (r.published_at as string | null) ?? null,
        moduleCount: countAgg(
          (r.programme_modules as unknown as { count?: number }[] | null) ??
            null
        ),
        lessonCount: countAgg(
          (r.programme_lessons as unknown as { count?: number }[] | null) ??
            null
        ),
        leadInstructor: lead
          ? `${lead.first_name} ${lead.last_name}`.trim()
          : null,
        studentsCount: (r.students_count as number) ?? 0,
      };
    }
  );

  return { programmes };
}

/**
 * Published curriculum subjects available for catalog filters.
 */
export async function listCatalogSubjects(): Promise<{
  subjects: { id: string; name: string }[];
}> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("curriculum_subjects")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return { subjects: data ?? [] };
}

/**
 * Full programme detail for a student (STU-04): scalar + subject/grade names +
 * module/lesson tree + instructor names + whether this student is enrolled.
 */
export async function getStudentProgrammeDetail(
  schoolId: string,
  studentId: string,
  programmeId: string
): Promise<{ programme: StudentProgrammeDetail | null }> {
  const admin = createAdminClient();

  const { data: row, error: scalarError } = await admin
    .from("programmes")
    .select(
      "id, title, type, subject_id, grade_id, curriculum_id, description, difficulty, duration_weeks, cover_url, published_at, visibility, curriculum_subjects(name), grades(name), curriculums(name), programme_instructors(staff_id, position, staff(first_name, last_name))"
    )
    .eq("id", programmeId)
    .eq("school_id", schoolId)
    .eq("status", "published")
    .eq("is_active", true)
    .in("visibility", ["public", "school"])
    .maybeSingle();
  if (scalarError) throw scalarError;
  if (!row) return { programme: null };

  const [moduleRes, lessonRes, enrolmentRes] = await Promise.all([
    admin
      .from("programme_modules")
      .select("id, title, description, position")
      .eq("programme_id", programmeId)
      .eq("is_active", true)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    admin
      .from("programme_lessons")
      .select(
        "id, module_id, title, summary, content_type, body, duration_min, is_preview, position, status"
      )
      .eq("programme_id", programmeId)
      .eq("status", "published")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    admin
      .from("programme_enrolments")
      .select("status")
      .eq("programme_id", programmeId)
      .eq("student_id", studentId)
      .maybeSingle(),
  ]);
  for (const res of [moduleRes, lessonRes, enrolmentRes]) {
    if (res.error) throw res.error;
  }

  const modules = (moduleRes.data ?? []).map((m: Record<string, unknown>) => ({
    id: m.id as string,
    title: m.title as string,
    description: (m.description as string | null) ?? "",
    position: m.position as number,
    lessons: [] as StudentLesson[],
  }));
  const lessonsByModule = new Map<string, StudentLesson[]>();
  for (const m of modules) lessonsByModule.set(m.id, []);
  for (const l of lessonRes.data ?? []) {
    const lr = l as Record<string, unknown>;
    const lesson: StudentLesson = {
      id: lr.id as string,
      moduleId: lr.module_id as string,
      moduleTitle:
        modules.find((m) => m.id === (lr.module_id as string))?.title ?? "",
      title: lr.title as string,
      summary: (lr.summary as string | null) ?? "",
      contentType: lr.content_type as string,
      body: Array.isArray(lr.body) ? (lr.body as unknown[]) : [],
      durationMin: lr.duration_min as number,
      position: lr.position as number,
      status: lr.status as string,
      isPreview: lr.is_preview as boolean,
    };
    lessonsByModule.get(lr.module_id as string)?.push(lesson);
  }
  for (const m of modules) m.lessons = lessonsByModule.get(m.id) ?? [];

  const instructors = (row.programme_instructors as unknown as
    | {
        position: string;
        staff: { first_name: string; last_name: string } | null;
      }[]
    | null) ?? null;
  const lead = instructors?.find((i) => i.position === "lead")?.staff;
  const assistants = (instructors ?? [])
    .filter((i) => i.position === "assistant")
    .map((i) => `${i.staff?.first_name ?? ""} ${i.staff?.last_name ?? ""}`.trim())
    .filter(Boolean);

  return {
    programme: {
      id: row.id as string,
      title: row.title as string,
      type: row.type as string,
      subjectId: (row.subject_id as string | null) ?? null,
      subjectName: (row.curriculum_subjects as { name: string }[] | null)?.[0]
        ?.name ?? null,
      gradeId: (row.grade_id as string | null) ?? null,
      gradeName: (row.grades as { name: string }[] | null)?.[0]?.name ?? null,
      curriculumName: (row.curriculums as { name: string }[] | null)?.[0]
        ?.name ?? null,
      description: (row.description as string | null) ?? "",
      durationWeeks: row.duration_weeks as number,
      difficulty: row.difficulty as string,
      coverUrl: (row.cover_url as string | null) ?? null,
      publishedAt: (row.published_at as string | null) ?? null,
      modules,
      leadInstructor: lead
        ? `${lead.first_name} ${lead.last_name}`.trim()
        : null,
      assistantInstructors: assistants,
      visibility: row.visibility as string,
      enrolled: (enrolmentRes.data?.status as string | undefined) != null,
    },
  };
}

/**
 * List this student's enrolments with programme meta + lesson progress
 * (STU-05 My Learning).
 */
export async function listMyLearning(
  studentId: string,
  schoolId: string
): Promise<{ enrolments: MyLearningEntry[] }> {
  const admin = createAdminClient();

  const [enrolmentRes, progressRes] = await Promise.all([
    admin
      .from("programme_enrolments")
      .select(
        "status, created_at, programme_id, programmes(id, title, type, subject_id, grade_id, difficulty, duration_weeks, cover_url, curriculum_subjects(name), grades(name), programme_lessons(count))"
      )
      .eq("student_id", studentId)
      .eq("school_id", schoolId)
      .in("status", ["invited", "active", "completed"])
      .order("created_at", { ascending: false }),
    admin
      .from("lesson_progress")
      .select("lesson_id, status, completed_at")
      .eq("student_id", studentId)
      .eq("school_id", schoolId)
      .eq("status", "completed"),
  ]);
  if (enrolmentRes.error) throw enrolmentRes.error;
  if (progressRes.error) throw progressRes.error;

  const completedLessonIds = new Set(
    (progressRes.data ?? []).map((p) => p.lesson_id as string)
  );

  const enrolments: MyLearningEntry[] = (enrolmentRes.data ?? [])
    .filter((r) => r.programmes != null)
    .map((r: Record<string, unknown>) => {
      const p = (r.programmes ?? {}) as Record<string, unknown>;
      const lessons = (p.programme_lessons as
        | { count?: number }[]
        | null) ?? null;
      return {
        programmeId: r.programme_id as string,
        title: (p.title as string) ?? "",
        type: (p.type as string) ?? "",
        subjectName: (p.curriculum_subjects as { name: string }[] | null)?.[0]
          ?.name ?? null,
        gradeName: (p.grades as { name: string }[] | null)?.[0]?.name ?? null,
        difficulty: (p.difficulty as string) ?? "beginner",
        durationWeeks: (p.duration_weeks as number) ?? 0,
        coverUrl: (p.cover_url as string | null) ?? null,
        enrolmentStatus: r.status as string,
        enrolledAt: (r.created_at as string | null) ?? null,
        totalLessons: lessons?.[0]?.count ?? 0,
        completedLessons: 0,
        lessonsCompleted: [],
      };
    });

  for (const entry of enrolments) {
    entry.completedLessons = entry.lessonsCompleted.filter((id) =>
      completedLessonIds.has(id)
    ).length;
  }

  return { enrolments };
}

/**
 * Enrol this student into a published programme (STU-04/STU-02). Idempotent:
 * an existing enrolment is returned as ok. Cannot enrol into non-published or
 * non-school/public programmes.
 */
export async function enrolStudent(
  studentId: string,
  schoolId: string,
  programmeId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();

  const { data: existing, error: existingError } = await admin
    .from("programme_enrolments")
    .select("id, status")
    .eq("programme_id", programmeId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return { ok: true };

  const { data: prog, error: progError } = await admin
    .from("programmes")
    .select("id, school_id, status, is_active, visibility")
    .eq("id", programmeId)
    .maybeSingle();
  if (progError) throw progError;
  if (!prog) return { ok: false, error: "Programme not found" };
  if (prog.school_id !== schoolId) return { ok: false, error: "Out of school" };
  if (prog.status !== "published" || !prog.is_active)
    return { ok: false, error: "Programme is not published" };

  const { error } = await admin.from("programme_enrolments").insert({
    student_id: studentId,
    programme_id: programmeId,
    school_id: schoolId,
    cohort_id: null,
    status: "active",
  });
  if (error) throw error;

  return { ok: true };
}

/**
 * Mark a lesson complete for the student and ensure a lesson_progress row
 * exists (idempotent).
 */
export async function markLessonComplete(
  studentId: string,
  schoolId: string,
  programmeId: string,
  lessonId: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();

  const { data: lesson, error: lessonError } = await admin
    .from("programme_lessons")
    .select("id, programme_id, status")
    .eq("id", lessonId)
    .eq("programme_id", programmeId)
    .eq("status", "published")
    .maybeSingle();
  if (lessonError) throw lessonError;
  if (!lesson) return { ok: false, error: "Lesson not found" };

  const { data: existing, error: existingError } = await admin
    .from("lesson_progress")
    .select("id, status")
    .eq("lesson_id", lessonId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing) {
    const { error } = await admin
      .from("lesson_progress")
      .update({
        status: "completed",
        progress_pct: 100,
        completed_at: existing.status === "completed" ? undefined : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await admin.from("lesson_progress").insert({
      lesson_id: lessonId,
      programme_id: programmeId,
      student_id: studentId,
      school_id: schoolId,
      status: "completed",
      progress_pct: 100,
      completed_at: new Date().toISOString(),
    });
    if (error) throw error;
  }

  return { ok: true };
}

/**
 * Lesson + navigation context for the player (STU-06). Only returns published
 * lessons of a published programme in the student's school.
 */
export async function getPlayerLesson(
  schoolId: string,
  programmeId: string,
  lessonId: string
): Promise<{
  lesson: StudentLesson | null;
  programme: { id: string; title: string } | null;
  prevLessonId: string | null;
  nextLessonId: string | null;
}> {
  const admin = createAdminClient();

  const { data: prog, error: progError } = await admin
    .from("programmes")
    .select("id, title, status, is_active, visibility, school_id")
    .eq("id", programmeId)
    .maybeSingle();
  if (progError) throw progError;
  const visible =
    prog &&
    prog.school_id === schoolId &&
    prog.status === "published" &&
    prog.is_active &&
    ["public", "school"].includes(prog.visibility as string);
  if (!visible) {
    return { lesson: null, programme: null, prevLessonId: null, nextLessonId: null };
  }

  const [lessonRes, lessonListRes] = await Promise.all([
    admin
      .from("programme_lessons")
      .select(
        "id, module_id, title, summary, content_type, body, duration_min, is_preview, position, status, programme_modules(title, position), curriculum_strands(name), strand_id"
      )
      .eq("id", lessonId)
      .eq("programme_id", programmeId)
      .eq("status", "published")
      .maybeSingle(),
    admin
      .from("programme_lessons")
      .select("id, position")
      .eq("programme_id", programmeId)
      .eq("status", "published")
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);
  if (lessonRes.error) throw lessonRes.error;
  if (lessonListRes.error) throw lessonListRes.error;

  if (!lessonRes.data) {
    return { lesson: null, programme: null, prevLessonId: null, nextLessonId: null };
  }

  const ids = (lessonListRes.data ?? []).map((r) => r.id as string);
  const index = ids.indexOf(lessonId);

  const row = lessonRes.data as Record<string, unknown>;
  const mod = row.programme_modules as { title: string; position: number } | null;
  const lesson: StudentLesson = {
    id: row.id as string,
    moduleId: row.module_id as string,
    moduleTitle: mod?.title ?? "",
    title: row.title as string,
    summary: (row.summary as string | null) ?? "",
    contentType: row.content_type as string,
    body: Array.isArray(row.body) ? (row.body as unknown[]) : [],
    durationMin: row.duration_min as number,
    position: row.position as number,
    status: row.status as string,
    isPreview: row.is_preview as boolean,
  };

  return {
    lesson,
    programme: {
      id: prog.id as string,
      title: prog.title as string,
    },
    prevLessonId: index > 0 ? (ids[index - 1] ?? null) : null,
    nextLessonId: index >= 0 && index < ids.length - 1 ? ids[index + 1] : null,
  };
}

/**
 * Set an enrolment status (accept → active, decline → dropped) for the
 * student's own record.
 */
export async function updateEnrolmentStatus(
  studentId: string,
  programmeId: string,
  status: "active" | "dropped"
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("programme_enrolments")
    .select("id, status")
    .eq("programme_id", programmeId)
    .eq("student_id", studentId)
    .maybeSingle();
  if (error) throw error;
  if (!row) return { ok: false, error: "Not enrolled" };

  const { error: updateError } = await admin
    .from("programme_enrolments")
    .update({ status })
    .eq("id", row.id);
  if (updateError) throw updateError;

  return { ok: true };
}

/**
 * Completed lesson ids for a student in a programme (player progress rail).
 */
export async function listCompletedLessons(
  studentId: string,
  programmeId: string
): Promise<{ completedIds: string[] }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("lesson_progress")
    .select("lesson_id")
    .eq("student_id", studentId)
    .eq("programme_id", programmeId)
    .eq("status", "completed");
  if (error) throw error;
  return { completedIds: (data ?? []).map((r) => r.lesson_id as string) };
}