import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  resolveTuitionIdentity,
} from "@/lib/tuition/identity";
import { resolveTuitionGate } from "@/lib/tuition/gate";
import { TuitionGate } from "@/components/tuition/tuition-gate";
import { Toaster } from "@/components/platform/toast";

/**
 * /tuition/upgrade — landing page for the plan gate, reached from gates and
 * in-product upgrade prompts. Users who are entitled just get sent home.
 */
export default async function TuitionUpgradePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const identity = await resolveTuitionIdentity(user.id);
  const gate = await resolveTuitionGate(identity);

  if (gate.reason === "ok") {
    redirect("/tuition");
  }

  return (
    <div className="min-h-dvh bg-background">
      <TuitionGate reason={gate.reason} resolutionHref={gate.resolutionHref} />
      <Toaster />
    </div>
  );
}