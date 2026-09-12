import { cn } from "@/lib/utils";

type StatusTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "disabled";

const TONES: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground ring-border",
  brand: "bg-primary/10 text-primary ring-primary/20",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20",
  danger: "bg-destructive/10 text-destructive ring-destructive/20",
  info: "bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-sky-500/20",
  disabled: "bg-muted text-muted-foreground/50 ring-border/50",
};

export function StatusPill({
  tone = "neutral",
  className,
  children,
}: {
  tone?: StatusTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}