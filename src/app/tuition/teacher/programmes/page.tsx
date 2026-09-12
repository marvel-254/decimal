import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { getCurrentSchoolId } from "@/lib/tuition/current-school";
import {
  listClasses,
  listCurriculum,
  listProgrammes,
} from "@/lib/tuition/programmes";
import { ProgrammesList } from "@/components/tuition/programme-list";
import { Button } from "@/components/ui/button";

export default async function TeacherProgrammesPage() {
  const schoolId = await getCurrentSchoolId();

  const [{ programmes }, { classes }, { curriculums }] = await Promise.all([
    listProgrammes(schoolId),
    listClasses(schoolId),
    listCurriculum(),
  ]);

  const subjectNameById: Record<string, string> = {};
  for (const c of curriculums) {
    for (const s of c.subjects) subjectNameById[s.id] = s.name;
  }
  const gradeNameById: Record<string, string> = {};
  for (const c of classes) {
    if (c.gradeId && c.gradeName) gradeNameById[c.gradeId] = c.gradeName;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/tuition/teacher"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            My Programmes
          </h1>
          <p className="text-sm text-muted-foreground">
            Plan, structure and publish the programmes you teach.
          </p>
        </div>
        <Link href="/tuition/teacher/programmes/new">
          <Button variant="tuition">
            <Plus className="h-4 w-4" /> New programme
          </Button>
        </Link>
      </div>

      <ProgrammesList
        programmes={programmes}
        subjectNameById={subjectNameById}
        gradeNameById={gradeNameById}
      />
    </div>
  );
}