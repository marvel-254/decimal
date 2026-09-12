"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  Compass,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TuitionShellMode, TuitionSpaceId } from "@/lib/tuition/types";

interface SpaceConfig {
  id: TuitionSpaceId;
  label: string;
  icon: LucideIcon;
  tint: string;
}

const SPACES: SpaceConfig[] = [
  { id: "learn", label: "Learn", icon: BookOpen, tint: "bg-tuition-tint-learn text-tuition-accent" },
  { id: "teach", label: "Teach", icon: Compass, tint: "bg-tuition-tint-teach text-tuition-accent" },
  { id: "assess", label: "Assess", icon: ClipboardList, tint: "bg-tuition-tint-assess text-tuition-accent" },
  { id: "activities", label: "Activities", icon: Trophy, tint: "bg-tuition-tint-activity text-tuition-accent" },
  { id: "network", label: "Network", icon: Users, tint: "bg-tuition-tint-network text-tuition-accent" },
];

/** Where each space lands for a given shell mode (null = not accessible). */
const SPACE_ROUTE: Record<TuitionShellMode, Partial<Record<TuitionSpaceId, string>>> = {
  student: {
    learn: "/tuition",
    assess: "/tuition/assessments",
    activities: "/tuition/activities",
    network: "/tuition/network",
  },
  teacher: {
    learn: "/tuition/teacher",
    teach: "/tuition/teacher",
    assess: "/tuition/teacher/assessments",
    activities: "/tuition/teacher/activities",
    network: "/tuition/network",
  },
  school: {
    learn: "/tuition/school",
    teach: "/tuition/school/programmes",
    assess: "/tuition/school/assessments",
    activities: "/tuition/school/activities",
    network: "/tuition/network",
  },
  network: {
    learn: "/tuition/network",
    network: "/tuition/network",
  },
};

function activeSpace(pathname: string): TuitionSpaceId {
  if (pathname.startsWith("/tuition/teacher") || pathname.startsWith("/tuition/school") || pathname.startsWith("/tuition/network")) {
    const seg = pathname.split("/")[2];
    switch (seg) {
      case "teacher":
        return pathname.includes("/assessments") || pathname.includes("/question-bank")
          ? "assess"
          : pathname.includes("/activities")
            ? "activities"
            : "teach";
      case "school":
        return pathname.includes("/assessments")
          ? "assess"
          : pathname.includes("/activities")
            ? "activities"
            : pathname.includes("/network") || pathname.includes("/benchmark")
              ? "network"
              : "learn";
      case "network":
        return pathname.includes("/activities") ? "activities" : "network";
      default:
        return "learn";
    }
  }
  if (pathname.startsWith("/tuition/assessments")) return "assess";
  if (pathname.startsWith("/tuition/activities")) return "activities";
  if (pathname.startsWith("/tuition/network")) return "network";
  return "learn";
}

/**
 * The five product spaces (spec 02 / 03). Member-role spaces that an identity
 * cannot reach render disabled rather than removed, preserving the product's
 * mental model.
 */
export function SpaceRail({ mode }: { mode: TuitionShellMode }) {
  const pathname = usePathname();
  const active = activeSpace(pathname);

  return (
    <nav aria-label="Tuition spaces" className="grid grid-cols-5 gap-1 rounded-xl bg-muted/60 p-1">
      {SPACES.map((space) => {
        const href = SPACE_ROUTE[mode][space.id];
        const isActive = space.id === active;
        if (!href) {
          return (
            <div
              key={space.id}
              title={`${space.label} — not available to your role`}
              className="flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium text-muted-foreground/40 cursor-not-allowed"
            >
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full opacity-40", space.tint)}>
                <space.icon className="h-3.5 w-3.5" />
              </span>
              {space.label}
            </div>
          );
        }
        return (
          <Link
            key={space.id}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
            )}
          >
            <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", space.tint)}>
              <space.icon className="h-3.5 w-3.5" />
            </span>
            {space.label}
          </Link>
        );
      })}
    </nav>
  );
}