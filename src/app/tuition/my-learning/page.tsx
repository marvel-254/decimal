import Link from "next/link";
import { BookOpen, Clock3, GraduationCap, Library } from "lucide-react";
import { getStudentContext } from "@/lib/tuition/student-context";
import { listMyLearning } from "@/lib/tuition/student";
import { StatusPill } from "@/components/tuition/status-pill";
import { EmptyState } from "@/components/tuition/empty-state";
import { EnrolmentActionButton } from "@/components/tuition/enrolment-action-button";
import { cn } from "@/lib/utils";

export const metadata = { title: "My Learning | Tuition" };

function toneFor(status: string) {
  switch (status) {
    case "active":
      return "success" as const;
    case "completed":
      return "neutral" as const;
    case "invited":
      return "warning" as const;
    default:
      return "disabled" as const;
  }
}

export default async function MyLearningPage() {
  const { schoolId, studentId } = await getStudentContext();
  const { enrolments } = await listMyLearning(studentId, schoolId);

  const active = enrolments.filter((e) => e.enrolmentStatus === "active");
  const ongoingIds = new Set(active.map((e) => e.programmeId));
  const firstActive = active[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          My Learning
        </h1>
        <p className="text-sm text-muted-foreground">
          Your enrolled programmes — pick up where you left off.
        </p>
      </div>

      {enrolments.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing on your desk yet"
          description="Once your school publishes programmes for your grade, they'll appear here — or browse the catalog and enrol."
          actionHref="/tuition/explore"
          actionLabel="Browse the catalog"
        />
      ) : (
        <div className="space-y-4">
          {firstActive && firstActive.totalLessons > 0 ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-tuition-accent">
                    Continue learning
                  </p>
                  <h2 className="mt-0.5 truncate font-semibold text-foreground">
                    {firstActive.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {firstActive.completedLessons} of {firstActive.totalLessons}{" "}
                    lessons completed
                  </p>
                </div>
                <Link
                  href={`/tuition/my-learning/${firstActive.programmeId}`}
                  className="shrink-0 text-sm font-semibold text-tuition-accent hover:underline"
                >
                  Continue
                </Link>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-tuition-accent transition-all"
                  style={{
                    width: `${Math.round(
                      (firstActive.completedLessons / firstActive.totalLessons) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ) : null}

          {enrolments.map((e) => {
            const pct =
              e.totalLessons > 0
                ? Math.round((e.completedLessons / e.totalLessons) * 100)
                : 0;
            return (
              <div
                key={e.programmeId}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-tuition-tint-learn text-tuition-accent">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/tuition/explore/${e.programmeId}`}
                      className="truncate font-semibold text-foreground hover:underline"
                    >
                      {e.title}
                    </Link>
                    <StatusPill tone={toneFor(e.enrolmentStatus)}>
                      {e.enrolmentStatus}
                    </StatusPill>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {e.subjectName ? <span>{e.subjectName}</span> : null}
                    {e.gradeName ? <span>· {e.gradeName}</span> : null}
                    <span className="inline-flex items-center gap-1">
                      <Library className="h-3.5 w-3.5" /> {e.totalLessons} lesson
                      {e.totalLessons === 1 ? "" : "s"}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" /> {e.durationWeeks} wk
                    </span>
                  </div>
                  {e.enrolmentStatus === "active" ? (
                    <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          pct === 100 ? "bg-green-600" : "bg-tuition-accent"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {e.enrolmentStatus === "active" ? (
                    <Link
                      href={`/tuition/my-learning/${e.programmeId}`}
                      className="text-sm font-semibold text-tuition-accent hover:underline"
                    >
                      {e.completedLessons > 0 ? "Continue" : "Start"}
                    </Link>
                  ) : null}
                  {e.enrolmentStatus === "invited" ? (
                    <>
                      <EnrolmentActionButton
                        programmeId={e.programmeId}
                        action="accept"
                      />
                      <EnrolmentActionButton
                        programmeId={e.programmeId}
                        action="decline"
                      />
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}