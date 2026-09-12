import { NextResponse } from "next/server";
import { createWebhookRoute } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/server-admin";
import { WebhookError } from "@/lib/errors";
import { emitEvent } from "@/lib/services/events";
import { logAudit } from "@/lib/services/audit";

/**
 * M-Pesa webhook handler.
 *
 * Validates the callback, finds the subscription, and activates it.
 * Idempotent: checks provider_event_id before processing.
 *
 * M-Pesa sends callbacks with JSON body containing:
 * - Body.stkCallback.MerchantRequestID
 * - Body.stkCallback.CheckoutRequestID
 * - Body.stkCallback.ResultCode
 * - Body.stkCallback.ResultDesc
 */
export const POST = createWebhookRoute(async ({ request, body: rawBody }) => {
  const secret = request.headers.get("x-mpesa-secret");
  if (!secret || secret !== process.env.MPESA_CALLBACK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new WebhookError("Invalid JSON body");
  }

  // Extract M-Pesa callback data
  const mpesaBody = payload?.Body as Record<string, unknown> | undefined;
  const callback = mpesaBody?.stkCallback as Record<string, unknown> | undefined;
  if (!callback) {
    throw new WebhookError("Missing stkCallback in body");
  }

  const resultCode = callback.ResultCode as number;
  const merchantRequestId = callback.MerchantRequestID as string;
  const checkoutRequestId = callback.CheckoutRequestID as string;
  const resultDesc = callback.ResultDesc as string;

  if (!merchantRequestId || !checkoutRequestId) {
    throw new WebhookError("Missing merchant or checkout request ID");
  }

  // Idempotency check
  const { data: existing } = await admin
    .from("subscription_events")
    .select("id")
    .eq("provider", "mpesa")
    .eq("provider_event_id", checkoutRequestId)
    .single();

  if (existing) {
    return NextResponse.json({ ok: true, message: "Event already processed" });
  }

  // Find subscription by mpesa_merchant_request_id (set during checkout)
  const { data: subscription } = await admin
    .from("subscriptions")
    .select("id, school_id, plan_id, billing_interval")
    .eq("mpesa_merchant_request_id", merchantRequestId)
    .single();

  if (!subscription) {
    console.warn("[Webhook] No subscription found for merchant:", merchantRequestId);
    // Store event for audit even if subscription not found
    await admin.from("subscription_events").insert({
      subscription_id: "00000000-0000-0000-0000-000000000000",
      provider: "mpesa",
      provider_event_id: checkoutRequestId,
      event_type: "checkout.result",
      payload: payload as Record<string, unknown>,
    });
    return NextResponse.json({ ok: true });
  }

  // Store the webhook event
  await admin.from("subscription_events").insert({
    subscription_id: subscription.id,
    provider: "mpesa",
    provider_event_id: checkoutRequestId,
    event_type: resultCode === 0 ? "payment.success" : "payment.failed",
    payload: payload as Record<string, unknown>,
  });

  if (resultCode === 0) {
    // Payment successful — activate subscription
    const now = new Date();
    const days = subscription.billing_interval === "annual" ? 365 : 30;
    const periodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    await admin
      .from("subscriptions")
      .update({
        status: "active",
        provider: "mpesa",
        mpesa_checkout_request_id: checkoutRequestId,
        provider_subscription_id: checkoutRequestId,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        next_billing_date: periodEnd.toISOString(),
        cancel_at_period_end: false,
      })
      .eq("id", subscription.id);

    // Generate subscription invoice
    const { data: plan } = await admin
      .from("plans")
      .select("price_monthly, price_annual, name")
      .eq("id", subscription.plan_id)
      .single();

    if (plan) {
      const amount =
        subscription.billing_interval === "annual" && plan.price_annual != null
          ? plan.price_annual
          : plan.price_monthly;

      await admin.from("billing_invoices").insert({
        subscription_id: subscription.id,
        school_id: subscription.school_id,
        amount,
        currency: "KES",
        status: "paid",
        billing_reason:
          subscription.billing_interval === "annual"
            ? "annual_renewal"
            : "monthly_renewal",
        provider_invoice_id: checkoutRequestId,
        paid_at: now.toISOString(),
      });
    }

    await emitEvent({
      type: "subscription.activated",
      schoolId: subscription.school_id,
      resourceType: "subscription",
      resourceId: subscription.id,
      payload: { provider: "mpesa", merchantRequestId, checkoutRequestId },
    });

    await logAudit({
      schoolId: subscription.school_id,
      action: "subscription.activated",
      resourceType: "subscription",
      resourceId: subscription.id,
      metadata: { provider: "mpesa", resultCode, billingInterval: subscription.billing_interval },
    });
  } else {
    // Payment failed
    await emitEvent({
      type: "payment.failed",
      schoolId: subscription.school_id,
      resourceType: "subscription",
      resourceId: subscription.id,
      payload: { provider: "mpesa", resultCode, resultDesc },
    });

    await logAudit({
      schoolId: subscription.school_id,
      action: "payment.failed",
      resourceType: "subscription",
      resourceId: subscription.id,
      metadata: { provider: "mpesa", resultCode, resultDesc },
    });
  }

  return NextResponse.json({ ok: true });
});
