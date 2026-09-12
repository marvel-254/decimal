"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "@/components/platform/toast";
import { Button } from "@/components/ui/button";

export function LessonCompleteButton({
  programmeId,
  lessonId,
  completed,
  nextLessonId,
}: {
  programmeId: string;
  lessonId: string;
  completed: boolean;
  nextLessonId: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  const onComplete = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/tuition/student/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programmeId, lessonId }),
      });
      if (!res.ok) {
        const body = await res.json();
        toast(body?.error ?? "Could not save progress — try again.");
        return;
      }
      toast("Lesson complete");
      router.refresh();
      if (nextLessonId) {
        window.setTimeout(() => {
          router.push(
            `/tuition/learn/${programmeId}/${nextLessonId}`
          );
        }, 250);
      } else if (pathname) {
        window.setTimeout(() => router.push("/tuition/my-learning"), 250);
      }
    } catch {
      toast("Network error — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="tuition" disabled={busy || completed} onClick={onComplete}>
      {busy
        ? "Saving…"
        : completed
          ? "Completed"
          : nextLessonId
            ? "Mark complete & continue"
            : "Mark complete"}
    </Button>
  );
}