"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { EmptyState } from "@/components/tuition/empty-state";
import type { TuitionShellMode, TuitionSpaceId } from "@/lib/tuition/types";

function spaceForPath(pathname: string): TuitionSpaceId {
  if (pathname.startsWith("/tuition/teacher")) return "teach";
  if (pathname.startsWith("/tuition/school")) return "school";
  if (pathname.startsWith("/tuition/network")) return "network";
  if (pathname.startsWith("/tuition/assessments")) return "assess";
  if (pathname.startsWith("/tuition/activities")) return "activities";
  return "learn";
}

const ALLOWED: Record<TuitionShellMode, TuitionSpaceId[]> = {
  student: ["learn", "assess", "activities", "network"],
  teacher: ["learn", "teach", "assess", "activities", "network"],
  school: ["learn", "teach", "school", "assess", "activities", "network"],
  network: ["learn", "network", "activities"],
};

/**
 * Enforces space-level access inside the shell for identities that pass
 * middleware (students have no member role, so routeRoleMap never saw them).
 */
export function TuitionRouteGuard({
  mode,
  redirectTarget,
  children,
}: {
  mode: TuitionShellMode;
  redirectTarget: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Staff identities hitting /tuition (the student-root) go to their space.
  useEffect(() => {
    if (redirectTarget && pathname === "/tuition") {
      router.replace(redirectTarget);
    }
  }, [redirectTarget, pathname, router]);

  const allowed = ALLOWED[mode].includes(spaceForPath(pathname));

  if (!allowed) {
    return (
      <EmptyState
        icon={LockKeyhole}
        title="No access to this space"
        description="Your role in this school does not have access to this part of Tuition. Use the spaces above or the menu to find where you belong."
      />
    );
  }

  return <>{children}</>;
}