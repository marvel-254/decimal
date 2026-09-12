import Link from "next/link";
import Image from "next/image";
import { LockKeyhole, Rocket, MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductSwitcher } from "@/components/tuition/product-switcher";
import type { TuitionGateReason } from "@/lib/tuition/gate";

const CONTENT: Record<TuitionGateReason, { icon: typeof Rocket; title: string; description: string } | null> = {
  ok: null,
  upgrade: {
    icon: Rocket,
    title: "Tuition requires the Starter plan",
    description:
      "Tuition — programmes, lessons, assessments, activities and network benchmarking — is included from the Starter plan upward. Ask your school administrator to upgrade your school's plan, then try again.",
  },
  disabled: {
    icon: LockKeyhole,
    title: "Tuition is disabled for your school",
    description:
      "Your school administrator has turned the Tuition product off. Head back to School Management or reach out to your platform contact.",
  },
  "no-school": {
    icon: MapPinOff,
    title: "No school context found",
    description:
      "We couldn't find a school for your account. Switch schools from School Management, or ask an administrator to link your student identity.",
  },
};

const RESOLUTION: Record<TuitionGateReason, { label: string; href: string } | null> = {
  ok: null,
  upgrade: null,
  disabled: { label: "Back to School Management", href: "/dashboard" },
  "no-school": { label: "Back to School Management", href: "/dashboard" },
};

export function TuitionGate({
  reason,
  resolutionHref,
}: {
  reason: TuitionGateReason;
  resolutionHref: string | null;
}) {
  const content = CONTENT[reason];
  const resolution = resolutionHref
    ? { label: "Continue", href: resolutionHref }
    : (RESOLUTION[reason] ?? null);

  if (!content) return null;

  const Icon = content.icon;
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex h-16 items-center border-b border-border px-4 sm:px-6">
        <div className="w-64">
          <ProductSwitcher />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
          <Image
            src="/logo.jpeg"
            alt="Decimal Tuition"
            width={56}
            height={56}
            className="rounded-2xl"
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-tuition-tint-learn text-tuition-accent">
            <Icon className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">{content.title}</h1>
          <p className="text-sm text-muted-foreground">{content.description}</p>
          {resolution && (
            <Link href={resolution.href}>
              <Button variant="tuition" size="lg">
                {resolution.label}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}