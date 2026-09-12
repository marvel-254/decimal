import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, GraduationCap, Lock, PlayCircle } from "lucide-react";
import { getStudentContext } from "@/lib/tuition/student-context";
import {
  getStudentProgrammeDetail,
  listCompletedLessons,
} from "@/lib/tuition/student";
import { cn } from "@/lib/utils";

export const metadata = { title: "Your learning | Tuition" };

export default async function LearningOverviewPage({
  params,
}: {
  params: Promise<{ programmeId: string }>;
}) {
  const { programmeId } = await params;
  const { schoolId, studentId } = await getStudentContext();

  const [{ programme }, { completedIds }] = await Promise.all([
    getStudentProgrammeDetail(schoolId, studentId, programmeId),
    listCompletedLessons(studentId, programmeId),
  ]);
  if (!programme || !programme.enrolled) notFound();

  const completed = new Set(completedIds);

  // Lesson unlock order: the next lesson after the last completed one is open;
  // everything after the first unfinished lesson is locked.
  const flat = programme.modules.flatMap((m) => m.lessons);
  const firstIncompleteIndex = flat.findIndex(
    (l) => !completed.has(l.id)
  );
  const openFrom = firstIncompleteIndex === -1 ? flat.length - 1 : firstIncompleteIndex;

  return (
    <div className="space-y-6">
      <Link
        href="/tuition/my-learning"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to My Learning
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {programme.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          {programme.subjectName ?? ""}
          {programme.gradeName ? ` · ${programme.gradeName}` : ""}
        </p>
      </div>

      <div className="space-y-4">
        {programme.modules.map((m) => (
          <div key={m.id} className="rounded-2xl border border-border bg-card">
            <div className="p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-foreground">{m.title}</h2>
                <span className="text-xs text-muted-foreground">
                  {m.lessons.filter((l) => completed.has(l.id)).length}/
                  {m.lessons.length} complete
                </span>
              </div>
              {m.description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {m.description}
                </p>
              ) : null}
            </div>
            <ul className="border-t border-border">
              {m.lessons.map((l) => {
                const index = flat.indexOf(l);
                const isCompleted = completed.has(l.id);
                const isOpen = index <= openFrom || isCompleted;
                return (
                  <li key={l.id}>
                    <Link
                      href={`/tuition/learn/${programmeId}/${l.id}`}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50",
                        index !== 0 && "border-t border-border/60",
                        !isOpen && "cursor-not-allowed hover:bg-transparent"
                      )}
                      aria-disabled={!isOpen}
                      onClick={(e) => {
                        if (!isOpen) e.preventDefault();
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                      ) : isOpen ? (
                        <PlayCircle className="h-4 w-4 shrink-0 text-tuition-accent" />
                      ) : (
                        <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span
                        className={cn(
                          "flex-1 truncate",
                          isOpen
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {l.title}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3 className="h-3 w-3" /> {l.durationMin} min
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {flat.length > 0 && firstIncompleteIndex === -1 ? (
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4" /> You have finished every lesson
            in this programme.
          </p>
        ) : null}
      </div>
    </div>
  );
}