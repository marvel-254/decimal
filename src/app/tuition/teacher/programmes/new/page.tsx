import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getCurrentSchoolId } from "@/lib/tuition/current-school";
import {
  listClasses,
  listCurriculum,
  listStaff,
} from "@/lib/tuition/programmes";
import { ProgrammeBuilder } from "@/components/tuition/programme-builder";

export const dynamic = "force-dynamic";

export default async function NewProgrammePage() {
  const schoolId = await getCurrentSchoolId();

  const [{ staff }, { classes }, { curriculums }] = await Promise.all([
    listStaff(schoolId),
    listClasses(schoolId),
    listCurriculum(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-1">
        <Link
          href="/tuition/teacher/programmes"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to programmes
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          New programme
        </h1>
        <p className="text-sm text-muted-foreground">
          Plan the details, structure lessons against the curriculum, then
          choose who takes it.
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
          schoolId={schoolId}
          mode="create"
          initial={null}
          staff={staff}
          classes={classes}
          curriculums={curriculums}
        />
      </Suspense>
    </div>
  );
}