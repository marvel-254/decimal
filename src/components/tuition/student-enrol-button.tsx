"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "@/components/platform/toast";
import { Button } from "@/components/ui/button";

export function StudentEnrolButton({
  programmeId,
  enrolled,
}: {
  programmeId: string;
  enrolled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onEnrol = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/tuition/student/enrol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programmeId }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast(body?.error ?? "Could not enrol — try again.");
        return;
      }
      toast("Enrolled");
      router.refresh();
    } catch {
      toast("Network error — try again.");
    } finally {
      setBusy(false);
    }
  };

  if (enrolled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-tuition-accent">
        <Check className="h-3.5 w-3.5" /> Enrolled
      </span>
    );
  }

  return (
    <Button
      variant="tuition"
      size="sm"
      disabled={busy}
      onClick={(e) => {
        e.preventDefault();
        onEnrol();
      }}
    >
      {busy ? "Enrolling…" : "Enrol"}
    </Button>
  );
}