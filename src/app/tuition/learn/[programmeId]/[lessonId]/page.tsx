import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { getStudentContext } from "@/lib/tuition/student-context";
import {
  getPlayerLesson,
  listCompletedLessons,
} from "@/lib/tuition/student";
import { LessonCompleteButton } from "@/components/tuition/lesson-complete-button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Lesson | Tuition" };

export default async function LessonPlayerPage({
  params,
}: {
  params: Promise<{ programmeId: string; lessonId: string }>;
}) {
  const { programmeId, lessonId } = await params;
  const { schoolId, studentId } = await getStudentContext();

  const [{ lesson, programme, prevLessonId, nextLessonId }, { completedIds }] =
    await Promise.all([
      getPlayerLesson(schoolId, programmeId, lessonId),
      listCompletedLessons(studentId, programmeId),
    ]);
  if (!lesson || !programme) notFound();

  const completed = completedIds.includes(lessonId);

  const navLinkClass =
    "inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/tuition/my-learning/${programmeId}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {programme.title}
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" /> {lesson.durationMin} min
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        {lesson.moduleTitle ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-tuition-accent">
            {lesson.moduleTitle}
          </p>
        ) : null}
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          {lesson.title}
        </h1>
        {lesson.summary ? (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {lesson.summary}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        {Array.isArray(lesson.body) && lesson.body.length > 0 ? (
          <div className="space-y-4">
            {lesson.body.map((block, i) => {
              const text =
                typeof block === "string"
                  ? block
                  : block && typeof block === "object" && "text" in block
                    ? String((block as { text: unknown }).text)
                    : "";
              return text ? (
                <p
                  key={i}
                  className="text-[15px] leading-7 text-foreground"
                >
                  {text}
                </p>
              ) : null;
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This lesson doesn&apos;t have content yet — check back soon.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        {prevLessonId ? (
          <Link
            href={`/tuition/learn/${programmeId}/${prevLessonId}`}
            className={navLinkClass}
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </Link>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          {completed ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Completed
            </span>
          ) : null}
          <LessonCompleteButton
            programmeId={programmeId}
            lessonId={lessonId}
            completed={completed}
            nextLessonId={nextLessonId}
          />
        </div>
        {nextLessonId ? (
          <Link
            href={`/tuition/learn/${programmeId}/${nextLessonId}`}
            className={cn(navLinkClass)}
          >
            Next <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}