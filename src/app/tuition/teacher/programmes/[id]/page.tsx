import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { getCurrentSchoolId } from "@/lib/tuition/current-school";
import {
  getProgramme,
  listClasses,
  listCurriculum,
  listStaff,
  type ProgrammeTree,
} from "@/lib/tuition/programmes";
import { ProgrammeManage } from "@/components/tuition/programme-manage";
import { EmptyState } from "@/components/tuition/empty-state";

export const dynamic = "force-dynamic";

export default async function ProgrammeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const schoolId = await getCurrentSchoolId();

  const [{ staff }, { classes }, { curriculums }] = await Promise.all([
    listStaff(schoolId),
    listClasses(schoolId),
    listCurriculum(),
  ]);

  let programme: ProgrammeTree | null = null;
  let loadFailed = false;
  try {
    const { programme: p } = await getProgramme(id);
    programme = p;
  } catch {
    loadFailed = true;
  }

  const subjectNameById: Record<string, string> = {};
  for (const c of curriculums) {
    for (const s of c.subjects) subjectNameById[s.id] = s.name;
  }
  const curriculumNameById: Record<string, string> = Object.fromEntries(
    curriculums.map((c) => [c.id, c.name])
  );
  const gradeNameById: Record<string, string> = {};
  const classNamesById: Record<string, string> = {};
  for (const c of classes) {
    classNamesById[c.id] = c.name;
    if (c.gradeId && c.gradeName) gradeNameById[c.gradeId] = c.gradeName;
  }
  const staffNameById: Record<string, string> = Object.fromEntries(
    staff.map((s) => [s.id, s.fullName])
  );

  if (loadFailed && !programme) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/tuition/teacher/programmes"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to programmes
        </Link>
        <EmptyState
          icon={BookOpen}
          title="Couldn't load this programme"
          description="It may no longer exist, or it belongs to another school."
          actionHref="/tuition/teacher/programmes"
          actionLabel="My programmes"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/tuition/teacher/programmes"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to programmes
      </Link>

      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-tuition-accent" />
            <p className="text-sm text-muted-foreground">Loading programme…</p>
          </div>
        }
      >
        <ProgrammeManage
          programmeId={id}
          initial={programme}
          subjectNameById={subjectNameById}
          gradeNameById={gradeNameById}
          curriculumNameById={curriculumNameById}
          classNamesById={classNamesById}
          staffNameById={staffNameById}
        />
      </Suspense>
    </div>
  );
}