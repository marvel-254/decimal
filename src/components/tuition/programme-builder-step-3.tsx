"use client";

import {
  AlignLeft,
  Eye,
  Plus,
  Trash2,
} from "lucide-react";
import type {
  LessonContentType,
  ModuleDraft,
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
  embed: "Embed",
  link: "Link",
  mixed: "Mixed",
};

const MIXED_ROW_TYPES = ["text", "video", "link"] as const;

type MixedRow = { type: (typeof MIXED_ROW_TYPES)[number]; value: string };

const inputCls =
  "h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-tuition-accent/40";

const selectCls = inputCls + " pr-7";

const textareaCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-tuition-accent/40";

export interface StrandOption {
  id: string;
  name: string;
  subject: string;
}

interface ContentStepProps {
  modules: ModuleDraft[];
  strands: StrandOption[];
  onChange: (modules: ModuleDraft[]) => void;
}

interface LessonRowProps {
  moduleIndex: number;
  lessonIndex: number;
  lesson: ModuleDraft["lessons"][number];
  strands: StrandOption[];
  onPatch: (
    moduleIndex: number,
    lessonIndex: number,
    patch: Partial<ModuleDraft["lessons"][number]>
  ) => void;
}

function LessonEditor({
  moduleIndex,
  lessonIndex,
  lesson,
  strands,
  onPatch,
}: LessonRowProps) {
  const body = Array.isArray(lesson.body) ? lesson.body : [];

  const setBody = (next: unknown[]) =>
    onPatch(moduleIndex, lessonIndex, { body: next });

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-foreground">
            Lesson title
          </label>
          <input
            type="text"
            value={lesson.title}
            onChange={(e) =>
              onPatch(moduleIndex, lessonIndex, { title: e.target.value })
            }
            placeholder={`Lesson ${lessonIndex + 1}`}
            className={inputCls}
          />
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-foreground">
            Content
          </label>
          <select
            value={lesson.contentType}
            onChange={(e) =>
              onPatch(moduleIndex, lessonIndex, {
                contentType: e.target.value as LessonContentType,
                body: [],
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
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-medium text-foreground">
            Minutes
          </label>
          <input
            type="number"
            min={1}
            value={lesson.durationMin}
            onChange={(e) =>
              onPatch(moduleIndex, lessonIndex, {
                durationMin: Math.max(
                  1,
                  Number.parseInt(e.target.value || "1", 10)
                ),
              })
            }
            className={inputCls}
          />
        </div>
        <div className="flex items-end pb-1">
          <button
            type="button"
            role="switch"
            aria-checked={lesson.isPreview}
            onClick={() =>
              onPatch(moduleIndex, lessonIndex, {
                isPreview: !lesson.isPreview,
              })
            }
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
              lesson.isPreview
                ? "border-tuition-accent bg-tuition-accent/10 text-tuition-accent"
                : "border-border text-muted-foreground hover:bg-background"
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <label className="block text-xs font-medium text-foreground">
          Strand
        </label>
        <select
          value={lesson.strandId ?? ""}
          onChange={(e) =>
            onPatch(moduleIndex, lessonIndex, {
              strandId: e.target.value || null,
            })
          }
          className={selectCls}
        >
          <option value="">No strand</option>
          {Array.from(new Map(strands.map((s) => [s.subject, s.subject])).keys()).map(
            (subject) => (
              <optgroup key={subject} label={subject}>
                {strands
                  .filter((s) => s.subject === subject)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </optgroup>
            )
          )}
        </select>
      </div>

      <div className="mt-2 space-y-1">
        <label className="block text-xs font-medium text-foreground">
          Summary
        </label>
        <textarea
          rows={1}
          value={lesson.summary}
          onChange={(e) =>
            onPatch(moduleIndex, lessonIndex, { summary: e.target.value })
          }
          placeholder="One or two sentences learners read before starting."
          className={textareaCls}
        />
      </div>

      <div className="mt-3 border-t border-border/60 pt-3">
        <BodyEditor contentType={lesson.contentType} body={body} setBody={setBody} />
      </div>
    </div>
  );
}

function BodyEditor({
  contentType,
  body,
  setBody,
}: {
  contentType: LessonContentType;
  body: unknown[];
  setBody: (next: unknown[]) => void;
}) {
  const first =
    body.length > 0 && typeof body[0] === "object" && body[0] !== null
      ? (body[0] as Record<string, unknown>)
      : null;
  const url: string =
    typeof first?.url === "string"
      ? first.url
      : typeof first?.value === "string" && contentType === "link" && body.length === 1
        ? (first.value as string)
        : "";
  const caption =
    typeof first?.caption === "string" ? first.caption : "";
  const code = typeof first?.code === "string" ? first.code : "";

  switch (contentType) {
    case "text": {
      const lines = body
        .map((b) => (typeof b === "string" ? b : ""))
        .join("\n");
      return (
        <div className="space-y-1">
          <label className="block text-xs font-medium text-foreground">
            Lesson text
          </label>
          <textarea
            rows={5}
            value={lines}
            onChange={(e) =>
              setBody(
                e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean)
              )
            }
            placeholder={"Paragraph one\n\nParagraph two (blank lines are kept as separate blocks)"}
            className={textareaCls}
          />
          <p className="text-xs text-muted-foreground">
            Each non-blank line becomes its own paragraph block.
          </p>
        </div>
      );
    }
    case "video":
    case "audio": {
      const isVideo = contentType === "video";
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-foreground">
              {isVideo ? "Video URL" : "Audio URL"}
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) =>
                setBody(
                  e.target.value.trim()
                    ? [{ url: e.target.value.trim(), caption }]
                    : []
                )
              }
              placeholder={isVideo ? "https://youtube.com/…" : "https://…/audio.mp3"}
              className={inputCls}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-foreground">
              Caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) =>
                setBody(url ? [{ url, caption: e.target.value }] : [])
              }
              placeholder="e.g. Khan Academy — Fractions intro"
              className={inputCls}
            />
          </div>
        </div>
      );
    }
    case "embed": {
      return (
        <div className="space-y-1">
          <label className="block text-xs font-medium text-foreground">
            Embed code
          </label>
          <textarea
            rows={4}
            value={code}
            onChange={(e) =>
              setBody(e.target.value.trim() ? [{ code: e.target.value }] : [])
            }
            placeholder="<iframe src='https://…' …></iframe>"
            className={"font-mono " + textareaCls}
          />
        </div>
      );
    }
    case "link": {
      return (
        <div className="space-y-1">
          <label className="block text-xs font-medium text-foreground">
            Link URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) =>
              setBody(e.target.value.trim() ? [{ url: e.target.value.trim() }] : [])
            }
            placeholder="https://…"
            className={inputCls}
          />
        </div>
      );
    }
    case "mixed": {
      const rows = body as MixedRow[];
      const patchRow = (index: number, row: MixedRow) => {
        const next = [...rows];
        next[index] = row;
        setBody(next);
      };
      const addRow = () => setBody([...rows, { type: "text", value: "" }]);
      const removeRow = (index: number) =>
        setBody(rows.filter((_, i) => i !== index));
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-foreground">
              Mixed content blocks
            </label>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 text-xs font-medium text-tuition-accent hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add block
            </button>
          </div>
          {rows.length === 0 && (
            <p className="rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
              Combine text paragraphs, video or link blocks.
            </p>
          )}
          {rows.map((row, i) => (
            <div key={i} className="flex items-start gap-2">
              <select
                value={row.type}
                onChange={(e) =>
                  patchRow(i, {
                    type: e.target.value as MixedRow["type"],
                    value: "",
                  })
                }
                className={cn(selectCls, "w-24 shrink-0")}
              >
                {MIXED_ROW_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {CONTENT_LABELS[t]}
                  </option>
                ))}
              </select>
              {row.type === "text" ? (
                <input
                  type="text"
                  value={row.value}
                  onChange={(e) => patchRow(i, { ...row, value: e.target.value })}
                  placeholder="Paragraph text"
                  className={inputCls}
                />
              ) : (
                <input
                  type="url"
                  value={row.value}
                  onChange={(e) => patchRow(i, { ...row, value: e.target.value })}
                  placeholder={`${row.type} URL`}
                  className={inputCls}
                />
              )}
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="shrink-0 rounded-md border border-border p-1.5 text-destructive hover:bg-destructive/10"
                aria-label="Remove block"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      );
    }
    default:
      return (
        <p className="text-xs text-muted-foreground">
          This content type doesn't take an inline body — attach the resource when
          you load content.
        </p>
      );
  }
}

export function ContentStep({ modules, strands, onChange }: ContentStepProps) {
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

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
        <AlignLeft className="h-6 w-6 text-tuition-accent" />
        <p className="max-w-sm text-sm text-muted-foreground">
          Add modules in the Structure step first — lessons you write here live
          inside those modules.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {modules.map((module, mi) => (
        <div key={module.id ?? `m-${mi}`}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="flex h-6 items-center rounded-md bg-tuition-tint-learn px-2 text-xs font-semibold text-tuition-accent">
              {mi + 1}
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              {module.title || `Module ${mi + 1}`}
            </h3>
            <span className="text-xs text-muted-foreground">
              {module.lessons.length} lesson
              {module.lessons.length === 1 ? "" : "s"}
            </span>
          </div>

          {module.lessons.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              Add lessons to this module in the Structure step.
            </p>
          ) : (
            <div className="space-y-2">
              {module.lessons.map((lesson, li) => (
                <LessonEditor
                  key={lesson.id ?? `l-${li}`}
                  moduleIndex={mi}
                  lessonIndex={li}
                  lesson={lesson}
                  strands={strands}
                  onPatch={patchLesson}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}