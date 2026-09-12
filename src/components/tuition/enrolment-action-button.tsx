"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/platform/toast";
import { Button } from "@/components/ui/button";

export function EnrolmentActionButton({
  programmeId,
  action,
}: {
  programmeId: string;
  action: "accept" | "decline";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onAction = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/tuition/student/enrolment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programmeId, action }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast(body?.error ?? "Something went wrong — try again.");
        return;
      }
      toast(action === "accept" ? "Enrolled" : "Declined");
      router.refresh();
    } catch {
      toast("Network error — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      variant={action === "accept" ? "tuition" : "outline"}
      size="sm"
      disabled={busy}
      onClick={onAction}
    >
      {busy ? "…" : action === "accept" ? "Accept" : "Decline"}
    </Button>
  );
}