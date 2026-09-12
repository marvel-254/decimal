import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABELS } from "@/lib/auth-config";
import {
  resolveTuitionIdentity,
  tuitionShellMode,
  tuitionHomeRedirect,
} from "@/lib/tuition/identity";
import { resolveTuitionGate } from "@/lib/tuition/gate";
import { TuitionShell } from "@/components/tuition/tuition-shell";
import { TuitionGate } from "@/components/tuition/tuition-gate";
import { TuitionRouteGuard } from "@/components/tuition/route-guard";
import { Toaster } from "@/components/platform/toast";

export default async function TuitionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const identity = await resolveTuitionIdentity(user.id);
  const gate = await resolveTuitionGate(identity);

  // Gate replaces the whole shell (plan/flag), read-only included. "no-school"
  // is NOT a hard gate: those are exactly the accounts that need to onboard
  // (STU-01 grade picker), so they get a student shell instead.
  if (gate.reason === "disabled" || gate.reason === "upgrade") {
    return (
      <div className="min-h-dvh bg-background">
        <TuitionGate reason={gate.reason} resolutionHref={gate.resolutionHref} />
        <Toaster />
      </div>
    );
  }

  const mode = tuitionShellMode(identity);

  const roleLabel =
    identity.kind === "none"
      ? "Tuition Student"
      : identity.kind === "member"
        ? (ROLE_LABELS[identity.role] ?? "User")
        : identity.kind === "student"
          ? "Tuition Student"
          : "Tuition Parent";

  // Member-of-staff identities land in their space root on /tuition itself.
  const memberRedirect = tuitionHomeRedirect(identity);
  // (invariant: the /tuition page performs this redirect itself so deep links
  // like /tuition/teacher still render fresh)

  return (
    <div className="flex min-h-dvh">
      <TuitionShell mode={mode} roleLabel={roleLabel} userName={user.email ?? ""}>
        <TuitionRouteGuard mode={mode} redirectTarget={memberRedirect}>
          {children}
        </TuitionRouteGuard>
      </TuitionShell>
      <Toaster />
    </div>
  );
}