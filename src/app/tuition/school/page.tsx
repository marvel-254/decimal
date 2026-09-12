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
import { EmptyState } from "@/components/tuition/empty-state";
import { Button } from "@/components/ui/button";

const SECTIONS = [
  { label: "Programmes", href: "/tuition/school/programmes", icon: BookOpen, tint: "bg-tuition-tint-learn text-tuition-accent" },
  { label: "Teachers", href: "/tuition/school/teachers", icon: Users, tint: "bg-tuition-tint-progress text-tuition-accent" },
  { label: "Students", href: "/tuition/school/students", icon: Award, tint: "bg-tuition-tint-progress text-tuition-accent" },
  { label: "Assessments", href: "/tuition/school/assessments", icon: ClipboardList, tint: "bg-tuition-tint-assess text-tuition-accent" },
  { label: "Activities", href: "/tuition/school/activities", icon: Trophy, tint: "bg-tuition-tint-activity text-tuition-accent" },
  { label: "Network", href: "/tuition/school/network", icon: TrendingUp, tint: "bg-tuition-tint-network text-tuition-accent" },
];

export default function SchoolDashboardPage() {
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
        {SECTIONS.map((item) => (
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

      <EmptyState
        icon={BookOpen}
        title="Build your school's catalogue"
        description="Approve and publish the programmes your teachers create so students can enrol, learn and get assessed."
        actionHref="/tuition/school/programmes"
        actionLabel="Review programmes"
      />
    </div>
  );
}