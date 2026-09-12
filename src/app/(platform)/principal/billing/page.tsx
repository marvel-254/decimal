"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Users,
  GraduationCap,
  Check,
  X as XIcon,
  ArrowUpRight,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/platform/toast";

interface Plan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  priceAnnual: number | null;
  currency: string;
  maxStudents: number;
  maxStaff: number;
  features: Record<string, boolean>;
}

interface Subscription {
  id: string;
  status: string;
  planId: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  billingInterval: string;
  mpesaPhone: string | null;
}

interface Usage {
  students: { current: number; limit: number };
  staff: { current: number; limit: number };
}

function formatPrice(amount: number, currency: string) {
  const formatted = new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount / 100);
  return formatted;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-50 text-green-700",
    trialing: "bg-blue-50 text-blue-700",
    past_due: "bg-amber-50 text-amber-700",
    paused: "bg-gray-100 text-gray-600",
    cancelled: "bg-red-50 text-red-700",
    expired: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
    </span>
  );
}

function UsageBar({
  label,
  current,
  limit,
  icon: Icon,
}: {
  label: string;
  current: number;
  limit: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;
  const isAtLimit = !isUnlimited && percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {current} / {isUnlimited ? "Unlimited" : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit
                ? "bg-red-500"
                : isNearLimit
                  ? "bg-amber-500"
                  : "bg-primary"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isAtLimit && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Limit reached
        </p>
      )}
    </div>
  );
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await fetch("/api/billing/subscription");
        const data = await res.json();
        setSubscription(data.subscription);
        setPlan(data.plan);
        setUsage(data.usage);
      } catch {
        console.error("Failed to load billing info");
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, []);

  async function handleCancel(immediate: boolean) {
    if (!confirm(immediate ? "Cancel immediately?" : "Cancel at end of billing period?")) {
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch("/api/billing/subscription/cancel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ immediate }),
      });
      if (res.ok) {
        toast(immediate ? "Subscription cancelled" : "Subscription will cancel at period end");
        window.location.reload();
      } else {
        const data = await res.json();
        toast(data.message || "Failed to cancel subscription");
      }
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing</h1>
          <p className="text-muted-foreground mt-1">Loading billing information...</p>
        </div>
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Billing</h1>
          <p className="text-muted-foreground mt-1">
            Manage your subscription and usage
          </p>
        </div>
        <Link href="/principal/billing/plans">
          <Button size="sm">
            <CreditCard className="mr-2 h-4 w-4" />
            {subscription ? "Change Plan" : "Choose Plan"}
          </Button>
        </Link>
      </div>

      {subscription && plan ? (
        <>
          {/* Subscription Status Card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{plan.name}</h2>
                  <StatusBadge status={subscription.status} />
                </div>
                <p className="text-2xl font-bold text-primary">
                  {subscription.billingInterval === "annual" && plan.priceAnnual != null
                    ? formatPrice(plan.priceAnnual / 12, plan.currency)
                    : formatPrice(plan.priceMonthly, plan.currency)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    / mo
                    {subscription.billingInterval === "annual"
                      ? " (billed annually)"
                      : plan.priceMonthly > 0
                        ? ""
                        : ""}
                  </span>
                </p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {subscription.status === "trialing" && subscription.trialEnd && (
                    <p className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Trial ends {formatDate(subscription.trialEnd)}
                    </p>
                  )}
                  {subscription.currentPeriodEnd && (
                    <p>
                      {subscription.cancelAtPeriodEnd
                        ? `Cancels ${formatDate(subscription.currentPeriodEnd)}`
                        : `Renews ${formatDate(subscription.currentPeriodEnd)}`}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {subscription.status !== "cancelled" &&
                  subscription.status !== "expired" && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(false)}
                        disabled={cancelling}
                      >
                        {cancelling ? "Cancelling..." : "Cancel at Period End"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleCancel(true)}
                        disabled={cancelling}
                      >
                        Cancel Immediately
                      </Button>
                    </>
                  )}
              </div>
            </div>
          </div>

          {/* Usage Card */}
          {usage && (
            <div className="rounded-xl border border-border bg-card p-6 space-y-5">
              <h3 className="text-sm font-semibold text-foreground">Usage</h3>
              <UsageBar
                label="Students"
                current={usage.students.current}
                limit={usage.students.limit}
                icon={GraduationCap}
              />
              <UsageBar
                label="Staff"
                current={usage.staff.current}
                limit={usage.staff.limit}
                icon={Users}
              />
            </div>
          )}

          {/* Features Card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Included Features
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(plan.features).map(([key, enabled]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 text-sm"
                >
                  {enabled ? (
                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <XIcon className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                  )}
                  <span
                    className={
                      enabled ? "text-foreground" : "text-muted-foreground/50"
                    }
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* No Subscription */
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">No Active Subscription</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
            Choose a plan to unlock all features for your school. Start with a
            free trial.
          </p>
          <Link href="/principal/billing/plans">
            <Button>
              <CreditCard className="mr-2 h-4 w-4" />
              Browse Plans
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
