import { NextResponse } from "next/server";
import { createRoute } from "@/lib/api";
import { requireSchoolContext } from "@/lib/services/tenant";
import { requirePermission } from "@/lib/services/rbac";
import {
  getSubscription,
  upgradeSubscription,
  downgradeSubscription,
  createTrialSubscription,
  trackMpesaPayment,
} from "@/lib/billing/subscription";
import { checkLimit } from "@/lib/billing/usage";
import { getPlanBySlug, getPlanById } from "@/lib/billing/plans";
import { initiateStkPush } from "@/lib/billing/mpesa";
import { ValidationError, NotFoundError } from "@/lib/errors";
import type { BillingInterval } from "@/lib/billing/types";

export const POST = createRoute(
  async ({ request, user }) => {
    const ctx = await requireSchoolContext(user.id);
    await requirePermission(user.id, ctx.schoolId, "billing", "manage");

    const body = await request.json();
    const { planSlug, billingInterval, phone } = body as {
      planSlug?: string;
      billingInterval?: BillingInterval;
      phone?: string;
    };

    if (!planSlug || typeof planSlug !== "string") {
      throw new ValidationError("planSlug is required");
    }

    const interval: BillingInterval =
      billingInterval === "annual" ? "annual" : "monthly";

    const targetPlan = await getPlanBySlug(planSlug);
    if (!targetPlan) {
      throw new NotFoundError(`Plan: ${planSlug}`);
    }

    // Free plan — just switch, no payment needed
    if (targetPlan.priceMonthly === 0) {
      const sub = await getSubscription(ctx.schoolId);
      if (sub) {
        const { downgradeSubscription: downgrade } = await import(
          "@/lib/billing/subscription"
        );
        const result = await downgrade(ctx.schoolId, planSlug);
        return NextResponse.json({ ok: true, subscription: result, action: "downgrade" });
      }
      // No subscription — create a free-tier active subscription
      const result = await createTrialSubscription(ctx.schoolId, "free", 0);
      return NextResponse.json({ ok: true, subscription: result, action: "created" });
    }

    // Check if this is an upgrade, downgrade, or new subscription
    const currentSub = await getSubscription(ctx.schoolId);

    if (currentSub) {
      const currentPlan = await getPlanById(currentSub.planId);
      if (currentPlan) {
        if (targetPlan.sortOrder > currentPlan.sortOrder) {
          // Upgrade — update plan, then initiate payment
          const sub = await upgradeSubscription(ctx.schoolId, planSlug);
          return await initiatePayment(sub.id, targetPlan, interval, phone);
        } else if (targetPlan.sortOrder < currentPlan.sortOrder) {
          // Downgrade — check usage limits first
          const studentCheck = await checkLimit(ctx.schoolId, "students");
          if (!studentCheck.within) {
            throw new ValidationError(
              `Cannot downgrade: ${studentCheck.current} students exceeds ${planSlug} limit of ${studentCheck.limit}`
            );
          }

          const staffCheck = await checkLimit(ctx.schoolId, "staff");
          if (!staffCheck.within) {
            throw new ValidationError(
              `Cannot downgrade: ${staffCheck.current} staff exceeds ${planSlug} limit of ${staffCheck.limit}`
            );
          }

          const sub = await downgradeSubscription(ctx.schoolId, planSlug);
          return await initiatePayment(sub.id, targetPlan, interval, phone);
        } else {
          throw new ValidationError("Already on this plan");
        }
      }
    }

    // No existing subscription — create trial then initiate payment
    const sub = await createTrialSubscription(ctx.schoolId, planSlug, 14);
    return await initiatePayment(sub.id, targetPlan, interval, phone);
  },
  { rateLimit: { maxRequests: 5, windowMs: 60_000, prefix: "billing:checkout" } }
);

async function initiatePayment(
  subscriptionId: string,
  plan: { name: string; slug: string; priceMonthly: number; priceAnnual: number | null },
  billingInterval: BillingInterval,
  phone?: string
) {
  if (!phone) {
    throw new ValidationError("Phone number is required for M-Pesa payment");
  }

  const amount =
    billingInterval === "annual" && plan.priceAnnual != null
      ? plan.priceAnnual / 100 // Convert from pesas to KES
      : plan.priceMonthly / 100;

  const result = await initiateStkPush({
    phone,
    amount,
    accountRef: `sub-${subscriptionId.slice(0, 8)}`,
    description: `${plan.name} plan (${billingInterval})`,
  });

  // Track the M-Pesa payment on the subscription
  await trackMpesaPayment(
    subscriptionId,
    result.merchantRequestId,
    result.checkoutRequestId,
    phone
  );

  return NextResponse.json({
    ok: true,
    action: "payment_initiated",
    customerMessage: result.customerMessage,
    checkoutRequestId: result.checkoutRequestId,
  });
}
