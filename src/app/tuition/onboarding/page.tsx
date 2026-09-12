import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server-admin";
import { createClient } from "@/lib/supabase/server";
import {
  resolveTuitionIdentity,
  type TuitionIdentity,
} from "@/lib/tuition/identity";
import { OnboardingForm } from "@/components/tuition/onboarding-form";
import { Button } from "@/components/ui/button";

function schoolIdFrom(identity: TuitionIdentity): string | null {
  if (identity.kind !== "none") return identity.schoolId;
  return null;
}

export default async function TuitionOnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const identity = await resolveTuitionIdentity(user.id);

  // Already linked → nothing to set up.
  if (identity.kind === "student") redirect("/tuition");

  let schoolId = schoolIdFrom(identity);

  // No school context yet (fresh account): fall back to the first active
  // school membership, mirroring the platform resolver.
  if (!schoolId) {
    const admin = createAdminClient();
    const { data: member } = await admin
      .from("school_members")
      .select("school_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    schoolId = member?.school_id ?? null;
  }

  if (!schoolId) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-tuition-tint-learn text-tuition-accent">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">No school linked to your account</h1>
        <p className="text-sm text-muted-foreground">
          Ask your school to add you as a student, or sign in with the account your school invited.
        </p>
        <Link href="/login" className="inline-block">
          <Button variant="outline">Back to sign in</Button>
        </Link>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: school } = await admin
    .from("schools")
    .select("name")
    .eq("id", schoolId)
    .maybeSingle();

  const { data: grades } = await admin
    .from("grades")
    .select("id, name, level, classes(id, name)")
    .eq("school_id", schoolId)
    .order("level", { ascending: true });

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-lg space-y-6 py-10">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-tuition-tint-learn text-tuition-accent">
          <GraduationCap className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Your learning profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {school?.name ?? "Your school"} will line up programmes, classes, assessments and
          activities for the grade you choose.
        </p>
      </div>

      <OnboardingForm
        schoolId={schoolId}
        grades={grades ?? []}
        defaultName={profile?.full_name ?? null}
      />
    </div>
  );
}