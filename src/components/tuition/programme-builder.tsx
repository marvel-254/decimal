"use client";

import { useEffect, useRef, useState } from "react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  DoorOpen,
  Info,
  Layers,
  Loader2,
  Save,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/platform/toast";
import { EmptyState } from "@/components/tuition/empty-state";
import { cn } from "@/lib/utils";
import {
  type CurriculumRef,
  type ProgrammeDraft,
  type ProgrammeTree,
  type ProgrammeType,
  type ProgrammeVisibility,
  type PublishCheck,
  type SchoolClassRef,
  type StaffRef,
  validateProgrammeForPublish,
} from "@/lib/tuition/programmes";
import { StructureStep } from "@/components/tuition/programme-builder-step-2";
import { ContentStep } from "@/components/tuition/programme-builder-step-3";

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

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
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

const VISIBILITY_HELP: Record<ProgrammeVisibility, string> = {
  private: "Only you can open this programme until you share it.",
  school: "Every staff member in your school can view it.",
  classes: "Only the classes you assign can take this programme.",
  students: "Only the students you pick can access it.",
  schools: "Partner schools on the network can re-use it.",
  network: "Anyone on the tuition network can view it.",
  public: "Visible to anyone with a link.",
};

const SELF_CONTAINED: string[] = ["video", "audio", "embed", "link"];

const STEPS = [
  { index: 1, label: "Details" },
  { index: 2, label: "Structure" },
  { index: 3, label: "Content" },
  { index: 4, label: "Access" },
  { index: 5, label: "Review" },
];

const inputCls =
  "h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-tuition-accent/40";

const selectCls = inputCls + " pr-8";

const textareaCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-tuition-accent/40";

function Field({
  label,
  hint,
  children,
}: {
  label?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Strips server-touched timestamps so save-loop detection compares content. */
function stableKey(tree: ProgrammeTree): string {
  return JSON.stringify({ ...tree, updatedAt: null, publishedAt: null });
}

export function ProgrammeBuilder({
  schoolId,
  mode,
  initial,
  staff,
  classes,
  curriculums,
}: {
  schoolId: string;
  mode: "create" | "edit";
  initial: ProgrammeTree | null;
  staff: StaffRef[];
  classes: SchoolClassRef[];
  curriculums: CurriculumRef[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const stepRaw = Number.parseInt(searchParams.get("step") ?? "1", 10);
  const step = Number.isFinite(stepRaw)
    ? Math.max(1, Math.min(5, stepRaw))
    : 1;

  const [tree, setTreeState] = useState<ProgrammeTree | null>(initial);
  const [loading, setLoading] = useState(mode === "create");
  const [createError, setCreateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [reviewChecks, setReviewChecks] = useState<PublishCheck[] | null>(null);

  const readyRef = useRef(mode === "edit");
  const createdRef = useRef(mode === "edit");
  const editVersion = useRef(0);
  const lastSavedKey = useRef<string | null>(mode === "edit" && initial ? stableKey(initial) : null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const treeRef = useRef(tree);
  treeRef.current = tree;

  // Create the draft shell when a new programme is started.
  useEffect(() => {
    if (mode !== "create" || createdRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tuition/programmes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "New programme",
            type: "course",
            schoolId,
          }),
        });
        const body = (await res.json()) as {
          programme?: ProgrammeTree;
          error?: string;
        };
        if (!res.ok || !body.programme) {
          if (!cancelled) {
            setCreateError(body.error ?? "Could not create programme");
            setLoading(false);
          }
          return;
        }
        if (!cancelled) {
          setTreeState(body.programme);
          lastSavedKey.current = stableKey(body.programme);
          readyRef.current = true;
          createdRef.current = true;
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setCreateError("Network error — please try again.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, schoolId]);

  const mutate = (fn: (p: ProgrammeTree) => ProgrammeTree) => {
    editVersion.current += 1;
    setReviewChecks(null);
    setTreeState((prev) => (prev ? fn(prev) : prev));
  };

  const persist = async (opts?: { silent?: boolean }) => {
    const current = treeRef.current;
    if (!current || saving || !readyRef.current) return;
    const snapshot = current;
    const version = editVersion.current;
    const snapshotKey = stableKey(snapshot);
    if (snapshotKey === lastSavedKey.current) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/tuition/programmes/${snapshot.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });
      const body = (await res.json()) as {
        programme?: ProgrammeTree;
        error?: string;
      };
      if (!res.ok || !body.programme) {
        if (!opts?.silent) toast(body?.error ?? "Could not save programme");
        return;
      }
      const responseKey = stableKey(body.programme);
      lastSavedKey.current = responseKey;
      if (
        editVersion.current === version &&
        responseKey !== stableKey(treeRef.current ?? snapshot)
      ) {
        setTreeState(body.programme);
      }
      if (!opts?.silent) toast("Draft saved");
    } catch {
      if (!opts?.silent) toast("Network error while saving — try again.");
    } finally {
      setSaving(false);
    }
  };

  // Debounced autosave on any tree mutation.
  useEffect(() => {
    if (!tree || !readyRef.current || !lastSavedKey.current) return;
    const key = stableKey(tree);
    if (key === lastSavedKey.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persist({ silent: true });
    }, 1200);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [tree]);

  const goStep = (n: number) => {
    const target = Math.max(1, Math.min(5, n));
    if (target === step) return;
    router.push(`${pathname}?step=${target}`);
  };

  const publish = async () => {
    if (!tree) return;
    await persist({ silent: true });
    const latest = treeRef.current;
    if (!latest) return;
    const checks = validateProgrammeForPublish(latest);
    const failing = checks.filter((c) => !c.ok);
    setReviewChecks(checks);
    if (failing.length > 0) {
      toast(failing[0].label);
      return;
    }
    setPublishing(true);
    try {
      const res = await fetch(`/api/tuition/programmes/${latest.id}/publish`, {
        method: "POST",
      });
      const body = (await res.json()) as {
        ok?: boolean;
        errors?: PublishCheck[];
        error?: string;
      };
      if (!res.ok || !body.ok) {
        const failed = (body.errors ?? checks).filter((c) => !c.ok);
        setReviewChecks(body.errors ?? checks);
        toast(failed[0]?.label ?? body?.error ?? "Programme isn't ready yet");
        return;
      }
      toast("Programme published");
      router.push(`/tuition/teacher/programmes/${tree.id}`);
      router.refresh();
    } catch {
      toast("Network error — please try again.");
    } finally {
      setPublishing(false);
    }
  };

  const lessons = tree?.modules.flatMap((m) => m.lessons) ?? [];
  const hasLessonContent = lessons.some(
    (l) =>
      (Array.isArray(l.body) && l.body.length > 0) ||
      SELF_CONTAINED.includes(l.contentType)
  );

  const isComplete = (index: number): boolean => {
    switch (index) {
      case 1:
        return !!tree?.title?.trim();
      case 2:
        return (tree?.modules.length ?? 0) > 0;
      case 3:
        return hasLessonContent;
      case 4:
        return (
          (tree?.instructors.length ?? 0) > 0 ||
          (tree?.cohortClassIds.length ?? 0) > 0 ||
          tree?.visibility !== "private"
        );
      default:
        return false;
    }
  };

  const strands = curriculums.flatMap((c) =>
    c.subjects.flatMap((s) =>
      s.strands.map((st) => ({
        id: st.id,
        name: st.name,
        subject: s.name,
      }))
    )
  );

  const gradeOptions = Array.from(
    classes
      .filter((c) => c.gradeId && c.gradeName)
      .reduce((map, c) => {
        if (c.gradeId && c.gradeName) map.set(c.gradeId, c.gradeName);
        return map;
      }, new Map<string, string>())
      .entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const subjectOptions = curriculums.flatMap((c) =>
    c.subjects.map((s) => ({ ...s, curriculumId: c.id, curriculumName: c.name }))
  );

  const staffRoles = staff.map((s) => ({
    staff: s,
    role: tree?.instructors.find((i) => i.staffId === s.id)?.position ?? null,
  }));

  const gradeGroups = Array.from(
    classes
      .reduce((map, c) => {
        const key = c.gradeName ?? "Ungraded";
        const list = map.get(key) ?? [];
        list.push(c);
        map.set(key, list);
        return map;
      }, new Map<string, SchoolClassRef[]>())
      .entries()
  );

  const updateDraft = (patch: Partial<ProgrammeTree>) =>
    mutate((p) => ({ ...p, ...patch }));

  const setModules = (modules: ProgrammeTree["modules"]) =>
    mutate((p) => ({ ...p, modules }));

  const stepForCheck = (label: string): number => {
    if (/details/i.test(label)) return 1;
    if (/content/i.test(label)) return 3;
    if (/module|lesson/i.test(label)) return 2;
    if (/access|instructor/i.test(label)) return 4;
    return 5;
  };

  const renderDetails = () => {
    if (!tree) return null;
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Programme title">
            <input
              type="text"
              value={tree.title}
              onChange={(e) => updateDraft({ title: e.target.value })}
              placeholder="e.g. Year 9 Mathematics — Term 1"
              className={inputCls}
            />
          </Field>
          <Field label="Programme type">
            <select
              value={tree.type}
              onChange={(e) =>
                updateDraft({ type: e.target.value as ProgrammeType })
              }
              className={selectCls}
            >
              {(Object.entries(TYPE_LABELS) as [ProgrammeType, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Curriculum">
            <select
              value={tree.curriculumId ?? ""}
              onChange={(e) => {
                const curriculumId = e.target.value || null;
                const existing = tree.subjectId
                  ? subjectOptions.find((s) => s.id === tree.subjectId)
                  : null;
                updateDraft({
                  curriculumId,
                  subjectId:
                    existing && existing.curriculumId === curriculumId
                      ? tree.subjectId
                      : null,
                });
              }}
              className={selectCls}
            >
              <option value="">No curriculum</option>
              {curriculums.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.code ? ` (${c.code})` : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Subject">
            <select
              value={tree.subjectId ?? ""}
              onChange={(e) => {
                const subjectId = e.target.value || null;
                const subject = subjectId
                  ? subjectOptions.find((s) => s.id === subjectId)
                  : null;
                updateDraft({
                  subjectId,
                  curriculumId: subjectId && subject ? subject.curriculumId : null,
                });
              }}
              className={selectCls}
            >
              <option value="">All subjects</option>
              {curriculums.map((c) => (
                <optgroup key={c.id} label={c.name}>
                  {c.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Grade">
            <select
              value={tree.gradeId ?? ""}
              onChange={(e) => updateDraft({ gradeId: e.target.value || null })}
              className={selectCls}
            >
              <option value="">All grades</option>
              {gradeOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Difficulty">
            <select
              value={tree.difficulty}
              onChange={(e) =>
                updateDraft({
                  difficulty: e.target.value as ProgrammeDraft["difficulty"],
                })
              }
              className={selectCls}
            >
              {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Duration (weeks)" hint="How long learners take to complete it.">
            <input
              type="number"
              min={1}
              value={tree.durationWeeks}
              onChange={(e) =>
                updateDraft({
                  durationWeeks: Math.max(0, Number.parseInt(e.target.value || "0", 10)),
                })
              }
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            rows={3}
            value={tree.description}
            onChange={(e) => updateDraft({ description: e.target.value })}
            placeholder="What this programme covers and who it's for."
            className={textareaCls}
          />
        </Field>

        <Field
          label="Learning outcomes"
          hint="One outcome per line — learners see these at a glance."
        >
          <textarea
            rows={4}
            value={tree.learningOutcomes.join("\n")}
            onChange={(e) =>
              updateDraft({
                learningOutcomes: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder={"Solve linear equations with one unknown\nRead and interpret bar charts"}
            className={textareaCls}
          />
        </Field>

        <Field label="Prerequisites" hint="What learners should already know.">
          <textarea
            rows={2}
            value={tree.prerequisites}
            onChange={(e) => updateDraft({ prerequisites: e.target.value })}
            placeholder="e.g. Multiplication tables up to 12"
            className={textareaCls}
          />
        </Field>
      </div>
    );
  };

  const renderAccess = () => {
    if (!tree) return null;
    return (
      <div className="space-y-6">
        <Field label="Who can access this programme?">
          <select
            value={tree.visibility}
            onChange={(e) =>
              updateDraft({ visibility: e.target.value as ProgrammeVisibility })
            }
            className={selectCls}
          >
            {(Object.entries(VISIBILITY_LABELS) as [ProgrammeVisibility, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              )
            )}
          </select>
          <p className="mt-2 text-xs text-muted-foreground">
            {VISIBILITY_HELP[tree.visibility]}
          </p>
        </Field>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-tuition-accent" />
            <h3 className="text-sm font-semibold text-foreground">Assign classes</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick the classes that take this programme. Teachers can still invite
            students individually later.
          </p>
          {classes.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No classes are set up in your school yet.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {gradeGroups.map(([grade, list]) => (
                <div key={grade}>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                    {grade}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {list.map((c) => {
                      const checked = tree.cohortClassIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() =>
                            updateDraft({
                              cohortClassIds: checked
                                ? tree.cohortClassIds.filter((id) => id !== c.id)
                                : [...tree.cohortClassIds, c.id],
                            })
                          }
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                            checked
                              ? "border-tuition-accent bg-tuition-accent/10 text-tuition-accent"
                              : "border-border bg-background text-foreground hover:bg-muted"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-[4px] border text-[10px]",
                              checked
                                ? "border-tuition-accent bg-tuition-accent text-tuition-accent-foreground"
                                : "border-border"
                            )}
                          >
                            {checked ? <Check className="h-3 w-3" /> : null}
                          </span>
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex items-center gap-2">
            <DoorOpen className="h-4 w-4 text-tuition-accent" />
            <h3 className="text-sm font-semibold text-foreground">Instructors</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Pick one lead instructor for the programme and any assistants.
          </p>
          {staff.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No active staff in your school yet.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {staffRoles.map(({ staff, role }) => (
                <div
                  key={staff.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2"
                >
                  <p className="text-sm font-medium text-foreground">
                    {staff.fullName}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (role === "lead") {
                          mutate((p) => ({
                            ...p,
                            instructors: p.instructors.filter(
                              (i) => i.staffId !== staff.id
                            ),
                          }));
                        } else {
                          const rest = (tree.instructors ?? []).filter(
                            (i) => i.staffId !== staff.id && i.position !== "lead"
                          );
                          updateDraft({
                            instructors: [
                              ...rest,
                              { staffId: staff.id, position: "lead" },
                            ],
                          });
                        }
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
                        role === "lead"
                          ? "bg-tuition-accent text-tuition-accent-foreground ring-tuition-accent"
                          : "bg-card text-muted-foreground ring-border hover:text-foreground"
                      )}
                    >
                      {role === "lead" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                      Lead
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const rest = (tree.instructors ?? []).filter(
                          (i) => i.staffId !== staff.id
                        );
                        updateDraft({
                          instructors:
                            role === "assistant"
                              ? rest
                              : [
                                  ...rest,
                                  { staffId: staff.id, position: "assistant" },
                                ],
                        });
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
                        role === "assistant"
                          ? "bg-tuition-accent text-tuition-accent-foreground ring-tuition-accent"
                          : "bg-card text-muted-foreground ring-border hover:text-foreground"
                      )}
                    >
                      {role === "assistant" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                      Assistant
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReview = () => {
    if (!tree) return null;
    const checks = reviewChecks ?? validateProgrammeForPublish(tree);
    const ready = checks.every((c) => c.ok);
    return (
      <div className="space-y-4">
        <div
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4",
            ready
              ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400"
              : "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400"
          )}
        >
          {ready ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <Info className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold">
              {ready
                ? "This programme is ready to publish."
                : "A few things still need attention before publishing."}
            </p>
            <p className="text-xs opacity-80">
              {tree.title} · {TYPE_LABELS[tree.type] ?? tree.type}
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {checks.map((c) => (
            <li
              key={c.label}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3"
            >
              <span className="flex items-center gap-2 text-sm text-foreground">
                {c.ok ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                )}
                {c.label}
              </span>
              {!c.ok && (
                <Link
                  href={`${pathname}?step=${stepForCheck(c.label)}`}
                  className="text-xs font-medium text-tuition-accent hover:underline"
                >
                  Go fix it
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-tuition-accent" />
        <p className="text-sm text-muted-foreground">Setting up your programme…</p>
      </div>
    );
  }

  if (createError) {
    return (
      <EmptyState
        icon={AlertCircle}
        title="Couldn't start a new programme"
        description={createError}
        actionHref="/tuition/teacher/programmes"
        actionLabel="Back to programmes"
      />
    );
  }

  if (!tree) return null;

  return (
    <div className="space-y-6">
      <StepIndicator
        current={step}
        isComplete={isComplete}
        onNavigate={goStep}
      />

      <div className="rounded-xl border border-border bg-card p-6">
        {step === 1 && renderDetails()}
        {step === 2 && (
          <StructureStep modules={tree.modules} onChange={setModules} />
        )}
        {step === 3 && (
          <ContentStep
            modules={tree.modules}
            strands={strands}
            onChange={setModules}
          />
        )}
        {step === 4 && renderAccess()}
        {step === 5 && renderReview()}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => (step > 1 ? goStep(step - 1) : router.push("/tuition/teacher/programmes"))}
        >
          <ArrowLeft className="h-4 w-4" />
          {step > 1 ? "Back" : "All programmes"}
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void persist()} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving…" : "Save draft"}
          </Button>
          {step < 5 ? (
            <Button variant="tuition" onClick={() => goStep(step + 1)}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="tuition" onClick={() => void publish()} disabled={publishing}>
              {publishing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {publishing ? "Publishing…" : "Publish programme"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({
  current,
  isComplete,
  onNavigate,
}: {
  current: number;
  isComplete: (index: number) => boolean;
  onNavigate: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s.index} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (s.index === current || isComplete(s.index)) onNavigate(s.index);
            }}
            disabled={s.index !== current && !isComplete(s.index)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors",
              s.index === current
                ? "bg-tuition-accent text-tuition-accent-foreground ring-tuition-accent"
                : isComplete(s.index)
                  ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 hover:bg-emerald-500/20 dark:text-emerald-400"
                  : "bg-card text-muted-foreground ring-border disabled:opacity-60"
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-xs",
                s.index === current
                  ? "bg-tuition-accent-foreground/20 text-tuition-accent-foreground"
                  : isComplete(s.index)
                    ? "bg-emerald-500 text-emerald-50"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {isComplete(s.index) ? (
                <Check className="h-3 w-3" />
              ) : (
                s.index
              )}
            </span>
            {s.label}
          </button>
          {i < STEPS.length - 1 && (
            <span className="h-px w-3 bg-border" />
          )}
        </div>
      ))}
    </div>
  );
}