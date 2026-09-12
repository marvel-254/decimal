import { Compass, Globe2, BookOpen, ClipboardList, Trophy, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/tuition/empty-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const AREAS = [
  { label: "Benchmarks", href: "/tuition/network", icon: Globe2, tint: "bg-tuition-tint-network text-tuition-accent" },
  { label: "Shared programmes", href: "/tuition/network/programmes", icon: BookOpen, tint: "bg-tuition-tint-learn text-tuition-accent" },
  { label: "Shared assessments", href: "/tuition/network/assessments", icon: ClipboardList, tint: "bg-tuition-tint-assess text-tuition-accent" },
  { label: "Activities", href: "/tuition/network/activities", icon: Trophy, tint: "bg-tuition-tint-activity text-tuition-accent" },
];

export default function NetworkDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">School Network</h1>
          <p className="text-sm text-muted-foreground">
            Compare and learn with schools across the Decimal network — benchmarks, shared
            programmes, assessments and inter-school activities.
          </p>
        </div>
        <Link href="/tuition/school/network">
          <Button variant="tuition">
            Your school's corner <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-tuition-tint-network text-tuition-accent">
            <Compass className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">It starts with you</p>
            <p className="text-sm text-muted-foreground">
              Participating schools appear here once they publish or benchmark something worth sharing.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {AREAS.map((item) => (
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
        icon={Globe2}
        title="No network data yet"
        description="Benchmarks and shared resources appear here once your school and others start participating. This corner fills up as the network grows."
      />
    </div>
  );
}