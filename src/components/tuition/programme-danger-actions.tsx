"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/platform/toast";
import { cn } from "@/lib/utils";

type Action = "archive" | "delete";

export function ProgrammeDangerActions({
  programmeId,
  status,
}: {
  programmeId: string;
  status: string;
}) {
  const router = useRouter();
  const [armed, setArmed] = useState<Action | null>(null);
  const [busy, setBusy] = useState<Action | null>(null);

  useEffect(() => {
    if (!armed || busy) return;
    const timer = setTimeout(() => setArmed(null), 5000);
    return () => clearTimeout(timer);
  }, [armed, busy]);

  const run = async (action: Action) => {
    if (busy) return;
    if (armed !== action) {
      setArmed(action);
      return;
    }
    setArmed(null);
    setBusy(action);
    try {
      const res =
        action === "archive"
          ? await fetch(
              `/api/tuition/teacher/programmes/${programmeId}/archive`,
              { method: "POST" }
            )
          : await fetch(`/api/tuition/teacher/programmes/${programmeId}`, {
              method: "DELETE",
            });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !body.ok) {
        toast(
          body.error ??
            (action === "archive"
              ? "Could not archive programme"
              : "Could not delete programme")
        );
        return;
      }
      if (action === "archive") {
        toast("Programme archived");
        router.refresh();
      } else {
        toast("Programme deleted");
        router.push("/tuition/teacher/programmes");
        router.refresh();
      }
    } catch {
      toast("Network error — please try again.");
    } finally {
      setBusy(null);
    }
  };

  if (status !== "published" && status !== "draft") return null;

  return (
    <div className="flex items-center gap-2">
      {status === "published" && (
        <Button
          variant="outline"
          disabled={busy !== null}
          onClick={() => void run("archive")}
          className={cn(
            armed === "archive" &&
              "border-amber-500 text-amber-600 hover:bg-amber-500/10"
          )}
        >
          {busy === "archive" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Archive className="h-4 w-4" />
          )}
          {armed === "archive" ? "Confirm archive?" : "Archive"}
        </Button>
      )}
      {status === "draft" && (
        <Button
          variant={armed === "delete" ? "destructive" : "outline"}
          disabled={busy !== null}
          onClick={() => void run("delete")}
        >
          {busy === "delete" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {armed === "delete" ? "Confirm delete?" : "Delete"}
        </Button>
      )}
    </div>
  );
}