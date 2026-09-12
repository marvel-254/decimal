/**
 * Renewal Service
 *
 * Handles subscription renewals via M-Pesa STK Push.
 * Called by cron job to process upcoming and overdue renewals.
 */

import { createAdminClient } from "@/lib/supabase/server-admin";
import { getPlanById } from "@/lib/billing/plans";
import { initiateStkPush } from "@/lib/billing/mpesa";
import { emitEvent } from "@/lib/services/events";
import { logAudit } from "@/lib/services/audit";

const GRACE_PERIOD_DAYS = 3;

/**
 * Process renewals: find subscriptions due for renewal and initiate STK push.
 */
export async function processRenewals(): Promise<{
  initiated: number;
  expired: number;
}> {
  const admin = createAdminClient();
  let initiated = 0;
  let expired = 0;

  // 1. Initiate renewals for active subscriptions past their billing date
  const { data: dueForRenewal } = await admin
    .from("subscriptions")
    .select("id, school_id, plan_id, billing_interval, mpesa_phone")
    .eq("status", "active")
    .eq("cancel_at_period_end", false)
    .not("next_billing_date", "is", null)
    .lte("next_billing_date", new Date().toISOString());

  if (dueForRenewal) {
    for (const sub of dueForRenewal) {
      try {
        const plan = await getPlanById(sub.plan_id);
        if (!plan) continue;

        // Free plan — skip renewals
        if (plan.priceMonthly === 0) continue;

        // No phone number — can't send STK push
        if (!sub.mpesa_phone) {
          console.warn(
            `[Renewal] No M-Pesa phone for subscription ${sub.id}, skipping`
          );
          continue;
        }

        const amount =
          sub.billing_interval === "annual" && plan.priceAnnual != null
            ? plan.priceAnnual / 12 // Bill monthly equivalent
            : plan.priceMonthly;

        const result = await initiateStkPush({
          phone: sub.mpesa_phone,
          amount: amount / 100, // Convert from pesas to KES
          accountRef: `renew-${sub.id.slice(0, 8)}`,
          description: `Renewal: ${plan.name} plan`,
        });

        // Track the STK push
        await admin
          .from("subscriptions")
          .update({
            mpesa_merchant_request_id: result.merchantRequestId,
            mpesa_checkout_request_id: result.checkoutRequestId,
          })
          .eq("id", sub.id);

        // Move next_billing_date forward by one period to avoid duplicate pushes
        const now = new Date();
        const days = sub.billing_interval === "annual" ? 365 : 30;
        const nextBilling = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        await admin
          .from("subscriptions")
          .update({ next_billing_date: nextBilling.toISOString() })
          .eq("id", sub.id);

        await emitEvent({
          type: "renewal.initiated",
          schoolId: sub.school_id,
          resourceType: "subscription",
          resourceId: sub.id,
          payload: { billingInterval: sub.billing_interval },
        });

        initiated++;
      } catch (err) {
        console.error(`[Renewal] Error processing subscription ${sub.id}:`, err);
      }
    }
  }

  // 2. Expire subscriptions in past_due beyond grace period
  const graceCutoff = new Date(
    Date.now() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
  );

  const { data: overdue } = await admin
    .from("subscriptions")
    .select("id, school_id")
    .eq("status", "past_due")
    .lt("updated_at", graceCutoff.toISOString());

  if (overdue) {
    // Find free plan
    const { data: freePlan } = await admin
      .from("plans")
      .select("id")
      .eq("slug", "free")
      .single();

    for (const sub of overdue) {
      // Downgrade to free if available, otherwise cancel
      if (freePlan) {
        const perpetualEnd = new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        );
        await admin
          .from("subscriptions")
          .update({
            plan_id: freePlan.id,
            status: "active",
            next_billing_date: null,
            current_period_end: perpetualEnd.toISOString(),
          })
          .eq("id", sub.id);
      } else {
        await admin
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("id", sub.id);
      }

      await emitEvent({
        type: "renewal.expired",
        schoolId: sub.school_id,
        resourceType: "subscription",
        resourceId: sub.id,
        payload: { action: freePlan ? "downgraded_to_free" : "cancelled" },
      });

      await logAudit({
        schoolId: sub.school_id,
        action: "renewal.expired",
        resourceType: "subscription",
        resourceId: sub.id,
        metadata: { action: freePlan ? "downgraded_to_free" : "cancelled" },
      });

      expired++;
    }
  }

  return { initiated, expired };
}
