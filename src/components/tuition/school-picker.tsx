"use client";

import Link from "next/link";
import { School } from "lucide-react";

export function SchoolPicker({
  schools,
}: {
  schools: Array<{ id: string; name: string }>;
}) {
  return (
    <div className="grid gap-3">
      {schools.map((school) => (
        <Link
          key={school.id}
          href={`/tuition/onboarding?school=${encodeURIComponent(school.id)}`}
          className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-tuition-accent/50 hover:bg-muted/40"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-tuition-tint-learn text-tuition-accent">
            <School className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-foreground">
              {school.name}
            </span>
            <span className="block text-sm text-muted-foreground">
              Choose this school to continue
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}