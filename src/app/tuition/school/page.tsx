import Link from "next/link";
import {
  BookOpen,
  Users,
  Award,
  ClipboardList,
  Trophy,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { getCurrentSchoolId } from "@/lib/tuition/current-school";
import {
  listProgrammes,
  listStaff,
  listClasses,
} from "@/lib/tuition/programmes";
import { Button } from "@/components/ui/button";

export default async function SchoolDashboardPage() {
  const schoolId = await getCurrentSchoolId();

  const [{ programmes }, { staff }, { classes }] = await Promise.all([
    listProgrammes(schoolId),
    listStaff(schoolId),
    listClasses(schoolId),
  ]);

  const publishedCount = programmes.filter((p) => p.status === "published").length;
  const totalCount = programmes.length;
  const staffCount = staff.length;
  const classCount = classes.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">School dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Run Tuition for your school — programmes, teaching, results and network participation.
          </p>
        </div>
        <Link href="/tuition/school/programmes">
          <Button variant="tuition">
            Manage programmes <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Link
          href="/tuition/school"
          className="group rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
        >
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-tuition-tint-learn text-tuition-accent">
            <BookOpen className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold text-foreground">Programmes</p>
          <p className="text-xs text-muted-foreground">{totalCount} {totalCount === 1 ? 'item' : 'items'}</p>
        </Link>

        <div
          className="group rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
        >
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-tuition-tint-progress text-tuition-accent">
            <Users className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold text-foreground">Teachers</p>
          <p className="text-xs text-muted-foreground">{staffCount} {staffCount === 1 ? 'teacher' : 'teachers'}</p>
        </div>

        <div
          className="group rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
        >
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-tuition-tint-progress text-tuition-accent">
            <Award className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold text-foreground">Students</p>
          <p className="text-xs text-muted-foreground">Check enrolments</p>
        </div>

        <div
          className="group rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
        >
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-tuition-tint-assess text-tuition-accent">
            <ClipboardList className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold text-foreground">Assessments</p>
          <p className="text-xs text-muted-foreground">Coming soon</p>
        </div>

        <div
          className="group rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
        >
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-tuition-tint-activity text-tuition-accent">
            <Trophy className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold text-foreground">Activities</p>
          <p className="text-xs text-muted-foreground">Coming soon</p>
        </div>

        <Link
          href="/tuition/network"
          className="group rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
        >
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-tuition-tint-network text-tuition-accent">
            <TrendingUp className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold text-foreground">Network</p>
          <p className="text-xs text-muted-foreground">School network</p>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Quick stats</h3>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="font-bold text-tuition-accent">{publishedCount}</span> Published
          </div>
          <div>
            <span className="font-bold text-tuition-accent">{classCount}</span> Classes
          </div>
          <div>
            <span className="font-bold text-tuition-accent">{staffCount}</span> Teachers
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <h3 className="text-sm font-semibold text-foreground mb-1">School management</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Manage your school's members, classes, and programmes. Some features are coming soon.
        </p>
        <Link href="/tuition/school/programmes">
          <Button variant="tuition">Manage programmes</Button>
        </Link>
      </div>
    </div>
  );
}