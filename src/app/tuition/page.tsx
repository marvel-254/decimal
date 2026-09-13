import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpen,
  Compass,
  Calendar,
  ClipboardList,
  Trophy,
  TrendingUp,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  resolveTuitionIdentity,
  tuitionHomeRedirect,
  type TuitionIdentity,
} from "@/lib/tuition/identity";
import { listMyLearning, type MyLearningEntry } from "@/lib/tuition/student";
import { EmptyState } from "@/components/tuition/empty-state";
import { Button } from "@/components/ui/button";

const QUICK_LINKS = [
  { label: "Explore", href: "/tuition/explore", icon: Compass, tint: "bg-tuition-tint-learn text-tuition-accent" },
  { label: "My Learning", href: "/tuition/my-learning", icon: BookOpen, tint: "bg-tuition-tint-learn text-tuition-accent" },
  { label: "Classes", href: "/tuition/classes", icon: Calendar, tint: "bg-tuition-tint-live text-tuition-accent" },
  { label: "Assessments", href: "/tuition/assessments", icon: ClipboardList, tint: "bg-tuition-tint-assess text-tuition-accent" },
  { label: "Activities", href: "/tuition/activities", icon: Trophy, tint: "bg-tuition-tint-activity text-tuition-accent" },
  { label: "Progress", href: "/tuition/progress", icon: TrendingUp, tint: "bg-tuition-tint-progress text-tuition-accent" },
];

function StudentHome({
  enrolments,
}: {
  enrolments: MyLearningEntry[];
}) {
  const active = enrolments.find((e) => e.enrolmentStatus === "active");
  const progressPct =
    active && active.totalLessons > 0
      ? Math.round((active.completedLessons / active.totalLessons) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Pick up where you left off. Your programmes, lessons and assessments live here.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="group rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
          >
            <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${link.tint}`}>
              <link.icon className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold text-foreground">{link.label}</p>
          </Link>
        ))}
      </div>

      {active ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-tuition-accent">
                Continue learning
              </p>
              <h2 className="mt-0.5 truncate font-semibold text-foreground">
                {active.title}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {active.completedLessons} of {active.totalLessons} lessons
                completed
              </p>
            </div>
            <Link
              href={`/tuition/my-learning/${active.programmeId}`}
              className="shrink-0 text-sm font-semibold text-tuition-accent hover:underline"
            >
              Continue
            </Link>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-tuition-accent transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="Nothing on your desk yet"
          description="Once your school publishes programmes for your grade, they'll appear here and you can start learning."
          actionHref="/tuition/explore"
          actionLabel="Browse the catalog"
        />
      )}
    </div>
  );
}

function ParentHome({ identity }: { identity: Extract<TuitionIdentity, { kind: "parent" }> }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Parent view</h1>
        <p className="text-sm text-muted-foreground">
          You are linked to {identity.childStudentIds.length} student
          {identity.childStudentIds.length === 1 ? "" : "s"}.
        </p>
      </div>
      <EmptyState
        icon={GraduationCap}
        title="Your children's learning"
        description="When your children's programmes and assessments publish, you'll see them here — attendance, progress and results at a glance."
      />
    </div>
  );
}

export default async function TuitionHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const identity = await resolveTuitionIdentity(user.id);

  if (identity.kind === "student") {
    const { enrolments } = await listMyLearning(
      identity.studentId,
      identity.schoolId
    );
    return <StudentHome enrolments={enrolments} />;
  }

  if (identity.kind === "parent") {
    return <ParentHome identity={identity} />;
  }

  if (identity.kind === "member") {
    const target = tuitionHomeRedirect(identity);
    if (target) redirect(target);
  }

  // "none" identity (or a member without a linked student): onboarding prompt
  // (STU-01 — a logged-in student with no row gets the grade picker).
  return (
    <div className="mx-auto max-w-lg space-y-6 py-10">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-tuition-tint-learn text-tuition-accent">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome to Tuition
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tell us what you're studying and your school will line up your
          programmes, lessons and assessments.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold text-foreground">Set up your learning profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll match you to the right grade in your school.
        </p>
        <Link href="/tuition/onboarding" className="mt-4 inline-block">
          <Button size="lg">
            Choose your grade
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}