import Link from "next/link";
import { Plus, ArrowLeft, Search } from "lucide-react";
import { getCurrentSchoolId } from "@/lib/tuition/current-school";
import {
  listClasses,
  listCurriculum,
  listProgrammes,
} from "@/lib/tuition/programmes";
import { ProgrammesList } from "@/components/tuition/programme-list";
import { Button } from "@/components/ui/button";

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export const metadata = { title: "My Programmes | Tuition" };

export default async function TeacherProgrammesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const schoolId = await getCurrentSchoolId();
  const params = await searchParams;
  const q = firstParam(params.q).trim();

  const [{ programmes }, { classes }, { curriculums }] = await Promise.all([
    listProgrammes(schoolId),
    listClasses(schoolId),
    listCurriculum(),
  ]);

  const filteredProgrammes = q
    ? programmes.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()))
    : programmes;

  const subjectNameById: Record<string, string> = {};
  for (const c of curriculums) {
    for (const s of c.subjects) subjectNameById[s.id] = s.name;
  }
  const gradeNameById: Record<string, string> = {};
  for (const c of classes) {
    if (c.gradeId && c.gradeName) gradeNameById[c.gradeId] = c.gradeName;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/tuition/teacher"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            My Programmes
          </h1>
          <p className="text-sm text-muted-foreground">
            Plan, structure and publish the programmes you teach.
          </p>
        </div>
        <Link href="/tuition/teacher/programmes/new">
          <Button variant="tuition">
            <Plus className="h-4 w-4" /> New programme
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search programmes..."
            defaultValue={q}
            className="w-full rounded-lg border border-border bg-background pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tuition-accent"
            onChange={(e) => {
              const value = e.target.value.trim();
              const url = value
                ? `/tuition/teacher/programmes?q=${encodeURIComponent(value)}`
                : "/tuition/teacher/programmes";
              window.location.assign(url);
            }}
          />
        </div>
        {q && (
          <span className="text-sm text-muted-foreground">
            Showing {filteredProgrammes.length} result{filteredProgrammes.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      <ProgrammesList
        programmes={filteredProgrammes}
        subjectNameById={subjectNameById}
        gradeNameById={gradeNameById}
      />
    </div>
  );
}