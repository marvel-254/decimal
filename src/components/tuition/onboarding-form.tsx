"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/platform/toast";
import { cn } from "@/lib/utils";

export interface OnboardingGrade {
  id: string;
  name: string;
  level: number;
  classes: { id: string; name: string }[] | null;
}

export function OnboardingForm({
  schoolId,
  grades,
  defaultName,
}: {
  schoolId: string;
  grades: OnboardingGrade[];
  defaultName: string | null;
}) {
  const router = useRouter();
  const [gradeId, setGradeId] = useState<string | null>(null);
  const [name, setName] = useState(defaultName ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const grade = grades.find((g) => g.id === gradeId) ?? null;
  const classes = grade?.classes ?? [];

  const submit = async () => {
    if (!gradeId) {
      toast("Pick the grade you're studying for.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/tuition/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          gradeId,
          name: name.trim() || null,
        }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        toast(body.error ?? "Something went wrong — try again.");
        setSubmitting(false);
        return;
      }
      setDone(true);
      toast("All set — welcome to Tuition!");
      router.push("/tuition");
      router.refresh();
    } catch {
      toast("Network error — please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <label className="mb-2 block text-sm font-medium text-foreground">
        Grade you're studying
      </label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {grades.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGradeId(g.id)}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
              gradeId === g.id
                ? "border-tuition-accent bg-tuition-accent/10 text-tuition-accent"
                : "border-border text-foreground hover:bg-muted"
            )}
          >
            {g.name}
            {g.classes && g.classes.length > 0 && (
              <span className="block text-[10px] font-normal text-muted-foreground">
                {g.classes.length} class{g.classes.length === 1 ? "" : "es"}
              </span>
            )}
          </button>
        ))}
      </div>

      {classes.length > 0 && gradeId && (
        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-foreground">
            Class ({classes.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setGradeId(gradeId)}
                className="cursor-default rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                title="Class is auto-assigned from your grade"
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {classes.length === 0 && gradeId && (
        <p className="mt-3 text-xs text-muted-foreground">
          You'll be matched to a class by your school.
        </p>
      )}

      <div className="mt-4">
        <label htmlFor="tb-name" className="mb-2 block text-sm font-medium text-foreground">
          Your name
        </label>
        <input
          id="tb-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Amina Yusuf"
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-tuition-accent/40"
        />
      </div>

      <Button
        className="mt-6 w-full"
        size="lg"
        variant="tuition"
        onClick={submit}
        disabled={submitting || done}
      >
        {done ? (
          <>
            <CheckCircle2 className="h-4 w-4" /> All set
          </>
        ) : submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Setting up…
          </>
        ) : (
          <>
            Start learning <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}