"use client";

import {
  ChevronDown,
  ChevronUp,
  Film,
  Link2,
  ListPlus,
  Plus,
  Trash2,
} from "lucide-react";
import type {
  LessonContentType,
  ModuleDraft,
  ProgrammeTree,
} from "@/lib/tuition/programmes";
import { cn } from "@/lib/utils";

const CONTENT_TYPES: LessonContentType[] = [
  "text",
  "video",
  "audio",
  "embed",
  "link",
  "mixed",
];

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

const inputCls =
  "h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-tuition-accent/40";

const selectCls = inputCls + " pr-7";

const ICONS: Record<string, React.ReactNode> = {
  text: <Film className="h-3.5 w-3.5" />,
  video: <Film className="h-3.5 w-3.5" />,
  audio: <Film className="h-3.5 w-3.5" />,
  embed: <Link2 className="h-3.5 w-3.5" />,
  link: <Link2 className="h-3.5 w-3.5" />,
  mixed: <ListPlus className="h-3.5 w-3.5" />,
};

function nextModuleTitle(existing: ModuleDraft[]): string {
  return `Module ${existing.length + 1}`;
}

function freshModule(position: number, index: number): ModuleDraft {
  return {
    title: `Module ${index + 1}`,
    description: "",
    position,
    lessons: [],
  };
}

function freshLesson(position: number, index: number): ProgrammeTree["modules"][number]["lessons"][number] {
  return {
    title: `Lesson ${index + 1}`,
    summary: "",
    contentType: "text",
    body: [],
    durationMin: 30,
    isPreview: false,
    position,
    strandId: null,
  };
}

export function StructureStep({
  modules,
  onChange,
}: {
  modules: ModuleDraft[];
  onChange: (modules: ModuleDraft[]) => void;
}) {
  const renumberModules = (list: ModuleDraft[]): ModuleDraft[] =>
    list.map((m, i) => ({
      ...m,
      position: i,
      lessons: renumberLessons(m.lessons),
    }));

  const renumberLessons = (
    list: ModuleDraft["lessons"]
  ): ModuleDraft["lessons"] =>
    list.map((l, j) => ({ ...l, position: j }));

  const addModule = () =>
    onChange(
      renumberModules([...modules, freshModule(modules.length, modules.length)])
    );

  const patchModule = (index: number, patch: Partial<ModuleDraft>) =>
    onChange(
      modules.map((m, i) => (i === index ? { ...m, ...patch } : m))
    );

  const removeModule = (index: number) =>
    onChange(renumberModules(modules.filter((_, i) => i !== index)));

  const moveModule = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= modules.length) return;
    const next = [...modules];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    onChange(renumberModules(next));
  };

  const addLesson = (moduleIndex: number) => {
    const lessonIndex = modules[moduleIndex].lessons.length;
    onChange(
      modules.map((m, i) =>
        i === moduleIndex
          ? {
              ...m,
              lessons: renumberLessons([
                ...m.lessons,
                freshLesson(lessonIndex, lessonIndex),
              ]),
            }
          : m
      )
    );
  };

  const patchLesson = (
    moduleIndex: number,
    lessonIndex: number,
    patch: Partial<ModuleDraft["lessons"][number]>
  ) =>
    onChange(
      modules.map((m, mi) =>
        mi === moduleIndex
          ? {
              ...m,
              lessons: m.lessons.map((l, li) =>
                li === lessonIndex
                  ? {
                      ...l,
                      ...patch,
                      // New content type means the old body shape no longer applies.
                      ...(patch.contentType !== undefined &&
                      patch.contentType !== l.contentType
                        ? { body: [] }
                        : {}),
                    }
                  : l
              ),
            }
          : m
      )
    );

  const removeLesson = (moduleIndex: number, lessonIndex: number) =>
    onChange(
      modules.map((m, mi) =>
        mi === moduleIndex
          ? {
              ...m,
              lessons: renumberLessons(
                m.lessons.filter((_, li) => li !== lessonIndex)
              ),
            }
          : m
      )
    );

  const moveLesson = (
    moduleIndex: number,
    lessonIndex: number,
    dir: -1 | 1
  ) => {
    const lessonTarget = lessonIndex + dir;
    const lessons = modules[moduleIndex].lessons;
    if (lessonTarget < 0 || lessonTarget >= lessons.length) return;
    const next = [...lessons];
    const [moved] = next.splice(lessonIndex, 1);
    next.splice(lessonTarget, 0, moved);
    onChange(
      modules.map((m, mi) =>
        mi === moduleIndex
          ? { ...m, lessons: renumberLessons(next) }
          : m
      )
    );
  };

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tuition-tint-learn text-tuition-accent">
          <ListPlus className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            No modules yet
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Break your programme into modules, then add lessons to each one.
          </p>
        </div>
        <button
          type="button"
          onClick={addModule}
          className="inline-flex items-center gap-1.5 rounded-lg bg-tuition-accent px-3 py-2 text-sm font-medium text-tuition-accent-foreground hover:bg-tuition-accent/90"
        >
          <Plus className="h-4 w-4" /> Add first module
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {modules.map((module, mi) => (
        <div
          key={module.id ?? `m-${mi}`}
          className="rounded-xl border border-border bg-background"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 p-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Field label="Module title">
                <input
                  type="text"
                  value={module.title}
                  onChange={(e) => patchModule(mi, { title: e.target.value })}
                  placeholder={nextModuleTitle(modules)}
                  className={inputCls}
                />
              </Field>
              <Field label="Module description">
                <textarea
                  rows={2}
                  value={module.description}
                  onChange={(e) =>
                    patchModule(mi, { description: e.target.value })
                  }
                  placeholder="What learners work through in this module."
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-tuition-accent/40"
                />
              </Field>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveModule(mi, -1)}
                disabled={mi === 0}
                className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-40"
                aria-label="Move module up"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveModule(mi, 1)}
                disabled={mi === modules.length - 1}
                className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-40"
                aria-label="Move module down"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => removeModule(mi)}
                className="rounded-md border border-border p-1.5 text-destructive hover:bg-destructive/10"
                aria-label="Delete module"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2 p-4">
            {module.lessons.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                No lessons yet — add the first one to this module.
              </p>
            ) : (
              module.lessons.map((lesson, li) => (
                <div
                  key={lesson.id ?? `l-${li}`}
                  className="rounded-lg border border-border bg-muted/20 p-3"
                >
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                    <Field label="Lesson title">
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) =>
                          patchLesson(mi, li, { title: e.target.value })
                        }
                        placeholder={`Lesson ${li + 1}`}
                        className={inputCls}
                      />
                    </Field>
                    <Field label="Content">
                      <select
                        value={lesson.contentType}
                        onChange={(e) =>
                          patchLesson(mi, li, {
                            contentType: e.target.value as LessonContentType,
                          })
                        }
                        className={selectCls}
                      >
                        {CONTENT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {CONTENT_LABELS[t]}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Minutes">
                      <input
                        type="number"
                        min={1}
                        value={lesson.durationMin}
                        onChange={(e) =>
                          patchLesson(mi, li, {
                            durationMin: Math.max(
                              1,
                              Number.parseInt(e.target.value || "1", 10)
                            ),
                          })
                        }
                        className={inputCls}
                      />
                    </Field>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {ICONS[lesson.contentType]}
                    <span className="text-xs text-muted-foreground">
                      {CONTENT_LABELS[lesson.contentType]}
                      {lesson.body && lesson.body.length > 0
                        ? " · content added"
                        : " · empty body"}
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveLesson(mi, li, -1)}
                        disabled={li === 0}
                        className="rounded-md border border-border p-1 text-muted-foreground hover:bg-background disabled:opacity-40"
                        aria-label="Move lesson up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveLesson(mi, li, 1)}
                        disabled={li === module.lessons.length - 1}
                        className="rounded-md border border-border p-1 text-muted-foreground hover:bg-background disabled:opacity-40"
                        aria-label="Move lesson down"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLesson(mi, li)}
                        className="rounded-md border border-border p-1 text-destructive hover:bg-destructive/10"
                        aria-label="Delete lesson"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            <button
              type="button"
              onClick={() => addLesson(mi)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-sm font-medium text-tuition-accent hover:bg-tuition-tint-learn"
            >
              <Plus className="h-4 w-4" /> Add lesson
            </button>
          </div>

          <div className="rounded-b-xl border-t border-border/60 bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
            {module.lessons.length} lesson{module.lessons.length === 1 ? "" : "s"} ·{" "}
            {module.lessons.reduce((sum, l) => sum + (l.durationMin || 0), 0)}{" "}
            min total
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addModule}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm font-medium text-tuition-accent hover:bg-tuition-tint-learn"
      >
        <Plus className="h-4 w-4" /> Add module
      </button>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-xs font-medium text-foreground">
          {label}
        </label>
      )}
      {children}
    </div>
  );
}