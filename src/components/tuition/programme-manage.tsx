"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ClipboardList,
  Edit3,
  GraduationCap,
  Layers,
  Loader2,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/tuition/status-pill";
import { EmptyState } from "@/components/tuition/empty-state";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type {
  ProgrammeTree,
  ProgrammeType,
  ProgrammeVisibility,
} from "@/lib/tuition/programmes";

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

const VISIBILITY_LABELS: Record<ProgrammeVisibility, string> = {
  private: "Private — only me",
  school: "This school",
  classes: "Selected classes",
  students: "Selected students",
  schools: "This school and partners",
  network: "The tuition network",
  public: "Public",
};

const CONTENT_LABELS: Record<string, string> = {
  text: "Text",
  video: "Video",
  audio: "Audio",
  document: "Document",
  presentation: "Presentation",
  embed: "Embed",
  link: "Link",
  mixed: "Mixed",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "content", label: "Content" },
  { value: "access", label: "Access" },
  { value: "students", label: "Students" },
  { value: "assess", label: "Assess" },
  { value: "results", label: "Results" },
];

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

export function ProgrammeManage({
  programmeId,
  initial,
  subjectNameById,
  gradeNameById,
  curriculumNameById,
  classNamesById,
  staffNameById,
}: {
  programmeId: string;
  initial: ProgrammeTree | null;
  subjectNameById: Record<string, string>;
  gradeNameById: Record<string, string>;
  curriculumNameById: Record<string, string>;
  classNamesById: Record<string, string>;
  staffNameById: Record<string, string>;
}) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const defaultValue =
    typeof tabParam === "string" && TABS.some((t) => t.value === tabParam)
      ? tabParam
      : "overview";

  const [tree, setTree] = useState<ProgrammeTree | null>(initial);
  const [loading, setLoading] = useState(initial === null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (initial !== null) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tuition/programmes/${programmeId}`);
        const body = (await res.json()) as {
          programme?: ProgrammeTree;
          error?: string;
        };
        if (!res.ok || !body.programme) {
          if (!cancelled) setLoadError(true);
          return;
        }
        if (!cancelled) setTree(body.programme);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [programmeId, initial]);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-tuition-accent" />
        <p className="text-sm text-muted-foreground">Loading programme…</p>
      </div>
    );
  }

  if (loadError || !tree) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load this programme"
        description="It may no longer exist, or it belongs to another school."
        actionHref="/tuition/teacher/programmes"
        actionLabel="Back to programmes"
      />
    );
  }

  const subject = tree.subjectId
    ? subjectNameById[tree.subjectId] ?? "Subject"
    : "All subjects";
  const grade = tree.gradeId
    ? gradeNameById[tree.gradeId] ?? "All grades"
    : "All grades";
  const curriculum = tree.curriculumId
    ? curriculumNameById[tree.curriculumId] ?? null
    : null;

  const lessons = tree.modules.flatMap((m) => m.lessons);
  const totalMinutes = lessons.reduce((sum, l) => sum + (l.durationMin || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {tree.title}
            </h1>
            <StatusPill tone={toneFor(tree.status)}>{tree.status}</StatusPill>
          </div>
          <p className="text-sm text-muted-foreground">
            {TYPE_LABELS[tree.type] ?? tree.type}
            {curriculum ? ` · aligned to ${curriculum}` : ""} · {subject} ·{" "}
            {grade}
          </p>
          {tree.description && (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {tree.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/tuition/teacher/programmes/${tree.id}/edit?step=1`}>
            <Button variant="outline">
              <Edit3 className="h-4 w-4" /> Edit
            </Button>
          </Link>
        </div>
      </div>

      <Tabs
        className="w-full"
        defaultValue={defaultValue}
        key={defaultValue}
      >
        <TabsList variant="line" className="w-full justify-start">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <div className="space-y-4">
              {tree.learningOutcomes.length > 0 && (
                <section className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-2 text-sm font-semibold text-foreground">
                    Learning outcomes
                  </h3>
                  <ul className="space-y-1.5">
                    {tree.learningOutcomes.map((o, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-tuition-accent" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  Programme structure
                </h3>
                {tree.modules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No modules yet —{" "}
                    <Link
                      href={`/tuition/teacher/programmes/${tree.id}/edit?step=2`}
                      className="text-tuition-accent hover:underline"
                    >
                      build the structure
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="space-y-3">
                    {tree.modules.map((m, mi) => (
                      <div key={m.id ?? `m-${mi}`}>
                        <p className="text-sm font-medium text-foreground">
                          {mi + 1}. {m.title || `Module ${mi + 1}`}
                        </p>
                        {m.lessons.length > 0 && (
                          <ul className="mt-1 space-y-1 pl-4">
                            {m.lessons.map((l, li) => (
                              <li
                                key={l.id ?? `l-${li}`}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                              >
                                <span className="h-1 w-1 rounded-full bg-current" />
                                {l.title}
                                <span className="text-xs text-muted-foreground/70">
                                  {l.durationMin} min
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-4">
              <section className="rounded-xl border border-border bg-card p-5">
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  Details
                </h3>
                <dl className="space-y-2 text-sm">
                  <MetaRow label="Type" value={TYPE_LABELS[tree.type] ?? tree.type} />
                  <MetaRow label="Subject" value={subject} />
                  <MetaRow label="Grade" value={grade} />
                  {curriculum && <MetaRow label="Curriculum" value={curriculum} />}
                  <MetaRow
                    label="Difficulty"
                    value={DIFFICULTY_LABELS[tree.difficulty] ?? tree.difficulty}
                  />
                  <MetaRow
                    label="Duration"
                    value={`${tree.durationWeeks} week${tree.durationWeeks === 1 ? "" : "s"}`}
                  />
                  <MetaRow
                    label="Lessons"
                    value={`${lessons.length} lesson${lessons.length === 1 ? "" : "s"} · ${Math.round(totalMinutes / 60 * 10) / 10} hrs`}
                  />
                  <MetaRow
                    label="Access"
                    value={VISIBILITY_LABELS[tree.visibility] ?? tree.visibility}
                  />
                  <MetaRow
                    label="Updated"
                    value={
                      tree.updatedAt
                        ? new Date(tree.updatedAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"
                    }
                  />
                </dl>
              </section>

              {tree.instructors.length > 0 && (
                <section className="rounded-xl border border-border bg-card p-5">
                  <h3 className="mb-3 text-sm font-semibold text-foreground">
                    Instructors
                  </h3>
                  <ul className="space-y-2">
                    {tree.instructors.map((i) => (
                      <li
                        key={i.staffId}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="text-foreground">
                          {staffNameById[i.staffId] ?? "Unknown"}
                        </span>
                        <StatusPill
                          tone={i.position === "lead" ? "success" : "neutral"}
                        >
                          {i.position}
                        </StatusPill>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="content" className="pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {lessons.length} lessons across {tree.modules.length} modules.
            </p>
            <Link href={`/tuition/teacher/programmes/${tree.id}/edit?step=3`}>
              <Button variant="outline" size="sm">
                <Edit3 className="h-3.5 w-3.5" /> Edit content
              </Button>
            </Link>
          </div>
          {tree.modules.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Nothing to show yet"
              description="Add modules and lessons in the builder."
              actionHref={`/tuition/teacher/programmes/${tree.id}/edit?step=2`}
              actionLabel="Build structure"
            />
          ) : (
            <div className="mt-4 space-y-3">
              {tree.modules.map((m, mi) => (
                <div
                  key={m.id ?? `m-${mi}`}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <h3 className="text-sm font-semibold text-foreground">
                    {mi + 1}. {m.title || `Module ${mi + 1}`}
                  </h3>
                  {m.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {m.description}
                    </p>
                  )}
                  <ul className="mt-3 space-y-1.5">
                    {m.lessons.map((l, li) => (
                      <li
                        key={l.id ?? `l-${li}`}
                        className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
                      >
                        <span className="font-medium text-foreground">
                          {l.title || `Lesson ${li + 1}`}
                        </span>
                        <StatusPill tone="neutral">
                          {CONTENT_LABELS[l.contentType] ?? l.contentType}
                        </StatusPill>
                        <span>{l.durationMin} min</span>
                        {l.isPreview && (
                          <StatusPill tone="info">Preview</StatusPill>
                        )}
                        {l.body && l.body.length > 0 ? (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">
                            ✓ has content
                          </span>
                        ) : (
                          <span className="text-xs text-amber-500">
                            empty body
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="access" className="pt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground">Visibility</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {VISIBILITY_LABELS[tree.visibility] ?? tree.visibility}
              </p>
            </section>
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground">Cohort</h3>
              {tree.cohortClassIds.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  No classes assigned yet.
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tree.cohortClassIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground"
                    >
                      {classNamesById[id] ?? "Unknown class"}
                    </span>
                  ))}
                </div>
              )}
            </section>
          </div>
        </TabsContent>

        <TabsContent value="students" className="pt-4">
          <EmptyState
            icon={Users}
            title="No cohorts yet"
            description="Students join once you publish and invite your classes."
            actionHref={`/tuition/teacher/programmes/${tree.id}/edit?step=4`}
            actionLabel="Set access"
          />
        </TabsContent>

        <TabsContent value="assess" className="pt-4">
          <EmptyState
            icon={ClipboardList}
            title="Assessments coming soon"
            description="Attach quizzes and assignments to lessons once assessment tools land."
          />
        </TabsContent>

        <TabsContent value="results" className="pt-4">
          <EmptyState
            icon={Trophy}
            title="Results coming soon"
            description="Progress and performance will show here as learners complete lessons."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}