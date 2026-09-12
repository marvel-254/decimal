import Link from "next/link";
import {
  Compass,
  Clock3,
  GraduationCap,
  Library,
  ShieldCheck,
  Search,
  Sparkles,
} from "lucide-react";
import { getStudentContext } from "@/lib/tuition/student-context";
import {
  listCatalogSubjects,
  listExploreProgrammes,
  listMyLearning,
} from "@/lib/tuition/student";
import { StudentEnrolButton } from "@/components/tuition/student-enrol-button";
import { EmptyState } from "@/components/tuition/empty-state";
import { cn } from "@/lib/utils";

const LEVEL_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const metadata = { title: "Explore programmes | Tuition" };

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; subject?: string; grade?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const { schoolId, studentId } = await getStudentContext();

  const q = (params.q ?? "").trim();
  const subject = (params.subject ?? "").trim();
  const grade = (params.grade ?? "").trim();
  const sort = params.sort === "rating" ? "rating" : "newest";

  const [{ programmes }, { subjects }, { enrolments }] = await Promise.all([
    listExploreProgrammes(schoolId, { q, subjectId: subject, gradeId: grade, sort }),
    listCatalogSubjects(),
    listMyLearning(studentId, schoolId),
  ]);
  const enrolledIds = new Set(enrolments.map((e) => e.programmeId));

  const gradeOptions: { id: string; name: string }[] = [];
  const seen = new Set<string>();
  for (const p of programmes) {
    if (p.gradeId && p.gradeName && !seen.has(p.gradeId)) {
      seen.add(p.gradeId);
      gradeOptions.push({ id: p.gradeId, name: p.gradeName });
    }
  }
  gradeOptions.sort((a, b) => a.name.localeCompare(b.name));

  const selectedSubject = subjects.find((s) => s.id === subject);
  const activeFilter = Boolean(q || subject || grade);

  const cardGrid = (
    <div
      role="list"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {programmes.map((p) => (
        <div
          key={p.id}
          role="listitem"
          className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
        >
          <Link
            href={`/tuition/explore/${p.id}`}
            className="flex gap-4 p-5 pb-3"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-tuition-tint-learn text-tuition-accent">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {p.subjectName ?? "Programme"}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {p.gradeName ?? "All grades"}
                </span>
              </div>
              <h3 className="mt-0.5 line-clamp-2 font-semibold leading-snug text-foreground">
                {p.title}
              </h3>
            </div>
          </Link>
          <div className="flex flex-1 flex-col px-5 pb-4 pt-1">
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Library className="h-3.5 w-3.5" />
                {p.lessonCount} lesson{p.lessonCount === 1 ? "" : "s"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {p.durationWeeks} wk
              </span>
              {p.leadInstructor ? (
                <span className="inline-flex items-center gap-1 truncate">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {p.leadInstructor}
                </span>
              ) : null}
              {LEVEL_LABELS[p.difficulty] ? (
                <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-muted-foreground">
                  {LEVEL_LABELS[p.difficulty]}
                </span>
              ) : null}
            </div>
            <div className="mt-auto flex items-center justify-between gap-2">
              <Link
                href={`/tuition/explore/${p.id}`}
                className="text-xs font-semibold text-tuition-accent hover:underline"
              >
                View details
              </Link>
              <StudentEnrolButton
                programmeId={p.id}
                enrolled={enrolledIds.has(p.id)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Explore
        </h1>
        <p className="text-sm text-muted-foreground">
          Find programmes published for your school and start learning.
        </p>
      </div>

      <form
        method="GET"
        action="/tuition/explore"
        className="flex gap-2"
        role="search"
      >
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search programmes, subjects…"
          aria-label="Search programmes"
          className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-tuition-accent"
        />
        <select
          name="sort"
          aria-label="Sort programmes"
          defaultValue={sort}
          className="h-10 rounded-lg border border-border bg-background px-2 text-sm focus-visible:ring-2 focus-visible:ring-tuition-accent"
        >
          <option value="newest">Newest</option>
          <option value="rating">Top rated</option>
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-tuition-accent px-4 text-sm font-semibold text-white transition-colors hover:bg-tuition-accent/90"
        >
          <Search className="h-4 w-4" /> Search
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/tuition/explore"
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            !subject && !grade
              ? "border-tuition-accent bg-tuition-accent/10 text-tuition-accent"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          All
        </Link>
        {subjects.map((s) => (
          <Link
            key={s.id}
            href={`/tuition/explore?${new URLSearchParams({
              ...(q ? { q } : {}),
              subject: s.id,
              ...(grade ? { grade } : {}),
              ...(sort === "rating" ? { sort } : {}),
            })}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              subject === s.id
                ? "border-tuition-accent bg-tuition-accent/10 text-tuition-accent"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {s.name}
          </Link>
        ))}
        {gradeOptions.length > 1 ? (
          <select
            name="grade"
            aria-label="Filter by grade"
            defaultValue={grade}
            onChange={(e) => {
              const value = e.target.value;
              const url = `/tuition/explore?${new URLSearchParams({
                ...(q ? { q } : {}),
                ...(subject ? { subject } : {}),
                ...(value ? { grade: value } : {}),
                ...(sort === "rating" ? { sort } : {}),
              })}`;
              window.location.assign(url);
            }}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground"
          >
            <option value="">All grades</option>
            {gradeOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {activeFilter ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <p className="font-medium text-foreground">
            {programmes.length} programme{programmes.length === 1 ? "" : "s"}
            {q ? (
              <>
                {" "}
                matching{" "}
                <span className="font-semibold text-tuition-accent">
                  “{q}”
                </span>
              </>
            ) : null}
            {selectedSubject ? (
              <>
                {" "}
                in <span className="font-semibold">{selectedSubject.name}</span>
              </>
            ) : null}
          </p>
          {q || subject || grade ? (
            <Link
              href="/tuition/explore"
              className="text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline"
            >
              Clear all
            </Link>
          ) : null}
        </div>
      ) : null}

      {programmes.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="Explore is quiet right now"
          description={
            activeFilter
              ? "No programmes match those filters yet. Try clearing them, or check back later."
              : "Your school hasn't published any programmes yet. Check back soon, or ask a teacher to publish one."
          }
        />
      ) : (
        cardGrid
      )}

      {!activeFilter && programmes.length > 0 ? (
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          Sorted by newest first. Use “Top rated” above to reorder by rating.
        </p>
      ) : null}
    </div>
  );
}