import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { getCurrentSchoolId } from "@/lib/tuition/current-school";
import {
  getProgramme,
  listClasses,
  listCurriculum,
  listStaff,
  type CurriculumRef,
  type ProgrammeTree,
  type SchoolClassRef,
  type StaffRef,
} from "@/lib/tuition/programmes";
import { ProgrammeBuilder } from "@/components/tuition/programme-builder";
import { EmptyState } from "@/components/tuition/empty-state";

export const dynamic = "force-dynamic";

export default async function EditProgrammePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const schoolId = await getCurrentSchoolId();

  let staff: StaffRef[] = [];
  let classes: SchoolClassRef[] = [];
  let curriculums: CurriculumRef[] = [];
  let refsFailed = false;
  try {
    const [staffRes, classesRes, curriculumsRes] = await Promise.all([
      listStaff(schoolId),
      listClasses(schoolId),
      listCurriculum(),
    ]);
    staff = staffRes.staff;
    classes = classesRes.classes;
    curriculums = curriculumsRes.curriculums;
  } catch {
    refsFailed = true;
  }

  let initial: ProgrammeTree | null = null;
  try {
    const { programme } = await getProgramme(id);
    initial = programme;
  } catch {
    initial = null;
  }

  if (refsFailed || !initial) {
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
          description="There was a problem loading it or its builder data. It may no longer exist, or it belongs to another school. Go back to your programme list to pick another."
          actionHref="/tuition/teacher/programmes"
          actionLabel="My programmes"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-1">
        <Link
          href={`/tuition/teacher/programmes/${id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to programme
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Edit programme
        </h1>
        <p className="text-sm text-muted-foreground">
          Refine the details, structure and content before it goes live.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-tuition-accent" />
            <p className="text-sm text-muted-foreground">Opening the builder…</p>
          </div>
        }
      >
        <ProgrammeBuilder
          key={id}
          schoolId={schoolId}
          mode="edit"
          initial={initial}
          staff={staff}
          classes={classes}
          curriculums={curriculums}
        />
      </Suspense>
    </div>
  );
}