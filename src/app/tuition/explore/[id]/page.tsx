import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Library,
  ShieldCheck,
} from "lucide-react";
import { getStudentContext } from "@/lib/tuition/student-context";
import { getStudentProgrammeDetail } from "@/lib/tuition/student";
import { StudentEnrolButton } from "@/components/tuition/student-enrol-button";
import { Button } from "@/components/ui/button";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const metadata = { title: "Programme | Tuition" };

export default async function StudentProgrammeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { schoolId, studentId } = await getStudentContext();

  const { programme } = await getStudentProgrammeDetail(
    schoolId,
    studentId,
    id
  );
  if (!programme) notFound();

  const lessonCount = programme.modules.reduce(
    (n, m) => n + m.lessons.length,
    0
  );
  const minutes = programme.modules.reduce(
    (n, m) =>
      n + m.lessons.reduce((x, l) => x + (l.durationMin || 0), 0),
    0
  );

  const instructors = [
    ...(programme.leadInstructor ? [programme.leadInstructor] : []),
    ...programme.assistantInstructors,
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/tuition/explore"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Explore
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {programme.subjectName ? (
                <span className="font-semibold uppercase tracking-wide text-tuition-accent">
                  {programme.subjectName}
                </span>
              ) : null}
              {programme.gradeName ? (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    {programme.gradeName}
                  </span>
                </>
              ) : null}
              {programme.curriculumName ? (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    {programme.curriculumName}
                  </span>
                </>
              ) : null}
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {programme.title}
            </h1>
          </div>
          <StudentEnrolButton programmeId={programme.id} enrolled={programme.enrolled} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {LEVEL_LABELS[programme.difficulty] ? (
            <span>{LEVEL_LABELS[programme.difficulty]}</span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Library className="h-4 w-4" /> {lessonCount} lesson
            {lessonCount === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-4 w-4" /> {programme.durationWeeks} weeks ·{" "}
            {minutes} min
          </span>
          {instructors.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1"
            >
              <ShieldCheck className="h-4 w-4" /> {name}
            </span>
          ))}
        </div>

        {programme.description ? (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {programme.description}
          </p>
        ) : null}

        {programme.enrolled ? (
          <Link href="/tuition/my-learning" className="mt-5 inline-block">
            <Button variant="tuition">
              <CheckCircle2 className="h-4 w-4" /> Go to your learning
            </Button>
          </Link>
        ) : null}
      </div>

      <div className="space-y-4">
        <h2 className="font-semibold text-foreground">Programme structure</h2>
        {programme.modules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Modules for this programme are still being put together.
          </p>
        ) : (
          programme.modules.map((m) => (
            <div
              key={m.id}
              className="rounded-2xl border border-border bg-card"
            >
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{m.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {m.lessons.length} lesson{m.lessons.length === 1 ? "" : "s"}
                  </span>
                </div>
                {m.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {m.description}
                  </p>
                ) : null}
                <ul className="mt-3 space-y-2">
                  {m.lessons.map((l) => (
                    <li
                      key={l.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"
                    >
                      <span className="truncate text-foreground">{l.title}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {l.durationMin} min
                        {l.isPreview ? " · preview" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>

      {programme.modules.flatMap((m) => m.lessons)[0]?.isPreview ? (
        <div className="rounded-2xl border border-dashed border-border p-4">
          <p className="text-sm text-muted-foreground">
            This programme includes a free preview lesson you can study before
            enrolling.
          </p>
        </div>
      ) : null}
    </div>
  );
}