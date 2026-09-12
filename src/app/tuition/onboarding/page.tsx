import { redirect } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server-admin";
import { createClient } from "@/lib/supabase/server";
import {
  resolveTuitionIdentity,
  type TuitionIdentity,
} from "@/lib/tuition/identity";
import { OnboardingForm } from "@/components/tuition/onboarding-form";
import { SchoolPicker } from "@/components/tuition/school-picker";

function schoolIdFrom(identity: TuitionIdentity): string | null {
  if (identity.kind !== "none") return identity.schoolId;
  return null;
}

export default async function TuitionOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ school?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const identity = await resolveTuitionIdentity(user.id);
  const admin = createAdminClient();

  // Already linked → nothing to set up.
  if (identity.kind === "student") redirect("/tuition");

  let schoolId = schoolIdFrom(identity);

  // Fresh account with no school context: honour an explicit school pick
  // (STU-01 "connect school"), then fall back to a known membership, then ask.
  if (!schoolId) {
    const { school } = await searchParams;
    if (school) {
      const { data: picked } = await admin
        .from("schools")
        .select("id")
        .eq("id", school)
        .maybeSingle();
      schoolId = picked?.id ?? null;
    }
  }

  if (!schoolId) {
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
    const { data: schools } = await admin
      .from("schools")
      .select("id, name")
      .order("name", { ascending: true })
      .limit(100);

    return (
      <div className="mx-auto max-w-lg space-y-6 py-10">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-tuition-tint-learn text-tuition-accent">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Connect your school
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick the school you belong to so we can line up programmes, classes
            and assessments for your grade.
          </p>
        </div>

        {schools?.length ? (
          <SchoolPicker schools={schools} />
        ) : (
          <p className="rounded-lg border border-border bg-card p-4 text-center text-sm text-muted-foreground">
            No schools are set up yet. Ask your school to register on Decimal,
            then come back to finish onboarding.
          </p>
        )}
      </div>
    );
  }

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