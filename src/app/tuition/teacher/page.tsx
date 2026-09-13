import Link from "next/link";
import {
  BookOpen,
  Users,
  ClipboardList,
  Database,
  Video,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { getCurrentSchoolId } from "@/lib/tuition/current-school";
import { listProgrammes } from "@/lib/tuition/programmes";
import { EmptyState } from "@/components/tuition/empty-state";
import { Button } from "@/components/ui/button";

const START = [
  { label: "My Programmes", href: "/tuition/teacher/programmes", icon: BookOpen, tint: "bg-tuition-tint-learn text-tuition-accent" },
  { label: "Load content", href: "/tuition/teacher/content", icon: Database, tint: "bg-tuition-tint-learn text-tuition-accent" },
  { label: "Add questions", href: "/tuition/teacher/question-bank", icon: ClipboardList, tint: "bg-tuition-tint-assess text-tuition-accent" },
  { label: "See your students", href: "/tuition/teacher/students", icon: Users, tint: "bg-tuition-tint-progress text-tuition-accent" },
  { label: "Schedule a live class", href: "/tuition/teacher/live-classes", icon: Video, tint: "bg-tuition-tint-live text-tuition-accent" },
  { label: "Set up an activity", href: "/tuition/teacher/activities", icon: Trophy, tint: "bg-tuition-tint-activity text-tuition-accent" },
];

export default async function TeacherDashboardPage() {
  const schoolId = await getCurrentSchoolId();
  const { programmes } = await listProgrammes(schoolId);
  
  const draftCount = programmes.filter((p) => p.status === "draft").length;
  const publishedCount = programmes.filter((p) => p.status === "published").length;
  const totalCount = programmes.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Teacher dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Everything you teach across programmes, content, assessments, live classes and activities.
          </p>
        </div>
        <Link href="/tuition/teacher/programmes">
          <Button variant="tuition">
            New programme <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {START.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
          >
            <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${item.tint}`}>
              <item.icon className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-foreground">{item.label}</p>
          </Link>
        ))}
      </div>

      {totalCount === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No programmes yet"
          description="Create your first programme to start publishing lessons, assign assessments and invite your cohort."
          actionHref="/tuition/teacher/programmes"
          actionLabel="Create a programme"
        />
      ) : (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Your programme stats</h3>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="font-bold text-tuition-accent">{draftCount}</span> Drafts
            </div>
            <div>
              <span className="font-bold text-tuition-accent">{publishedCount}</span> Published
            </div>
            <div>
              <span className="font-bold text-tuition-accent">{totalCount}</span> Total
            </div>
          </div>
        </div>
      )}
    </div>
  );
}