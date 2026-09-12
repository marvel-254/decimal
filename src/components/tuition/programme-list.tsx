"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type {
  ProgrammeListItem,
  ProgrammeType,
} from "@/lib/tuition/programmes";
import { StatusPill } from "@/components/tuition/status-pill";
import { EmptyState } from "@/components/tuition/empty-state";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<ProgrammeType, string> = {
  course: "Course",
  revision: "Revision",
  remedial: "Remedial",
  exam_prep: "Exam prep",
  club: "Club",
  sports: "Sports",
  music: "Music",
  drama: "Drama",
  debate: "Debate",
  science: "Science",
  technology: "Technology",
  competition: "Competition",
  leadership: "Leadership",
  holiday: "Holiday",
  custom: "Custom",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "published", label: "Published" },
  { key: "archived", label: "Archived" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function toneFor(status: string) {
  switch (status) {
    case "published":
      return "success" as const;
    case "archived":
      return "disabled" as const;
    default:
      return "neutral" as const;
  }
}

function formatUpdated(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ProgrammesList({
  programmes,
  subjectNameById,
  gradeNameById,
}: {
  programmes: ProgrammeListItem[];
  subjectNameById: Record<string, string>;
  gradeNameById: Record<string, string>;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered =
    filter === "all"
      ? programmes
      : programmes.filter((p) => p.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? programmes.length
              : programmes.filter((p) => p.status === f.key).length;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset transition-colors",
                filter === f.key
                  ? "bg-tuition-accent text-tuition-accent-foreground ring-tuition-accent"
                  : "bg-card text-muted-foreground ring-border hover:bg-muted hover:text-foreground"
              )}
            >
              {f.label}
              <span
                className={cn(
                  "text-xs",
                  filter === f.key
                    ? "text-tuition-accent-foreground/70"
                    : "text-muted-foreground/70"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {programmes.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No programmes yet"
          description="Create your first programme to start publishing lessons, assign assessments and invite your cohort."
          actionHref="/tuition/teacher/programmes/new"
          actionLabel="Create a programme"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={`No ${filter} programmes`}
          description="Nothing here in this status right now. Switch filters or start a new programme."
          actionHref="/tuition/teacher/programmes/new"
          actionLabel="New programme"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const subject = p.subjectId
              ? subjectNameById[p.subjectId] ?? "Subject"
              : "All subjects";
            const grade = p.gradeId
              ? gradeNameById[p.gradeId] ?? "All grades"
              : "All grades";
            return (
              <Link
                key={p.id}
                href={`/tuition/teacher/programmes/${p.id}`}
                className="group rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-tuition-accent">
                    {p.title}
                  </h3>
                  <StatusPill tone={toneFor(p.status)}>
                    {p.status}
                  </StatusPill>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {TYPE_LABELS[p.type] ?? p.type}
                  {p.durationWeeks > 0
                    ? ` · ${p.durationWeeks} week${p.durationWeeks === 1 ? "" : "s"}`
                    : ""}
                  {subject && grade
                    ? ` · ${subject} · ${grade}`
                    : ` · ${subject}${grade ? " · " + grade : ""}`}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <span>
                    {p.moduleCount} module{p.moduleCount === 1 ? "" : "s"} ·{" "}
                    {p.lessonCount} lesson{p.lessonCount === 1 ? "" : "s"}
                  </span>
                  <span>{formatUpdated(p.updatedAt)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}