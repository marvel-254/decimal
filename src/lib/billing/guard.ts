/**
 * Billing Guard
 *
 * Combines subscription checks, feature gating, and usage limits
 * into a single entry point for API route enforcement.
 */

import { getSubscription } from "@/lib/billing/subscription";
import { requireFeature as requireBillingFeature } from "@/lib/billing/entitlements";
import { requireWithinLimit } from "@/lib/billing/usage";
import { SubscriptionRequiredError } from "@/lib/errors";

/**
 * Require an active subscription (trialing, active, or past_due).
 */
export async function requireActiveSubscription(
  schoolId: string
): Promise<void> {
  const sub = await getSubscription(schoolId);
  if (!sub || !["trialing", "active", "past_due"].includes(sub.status)) {
    throw new SubscriptionRequiredError();
  }
}

/**
 * Require a billing-plan feature. Checks subscription is active first,
 * then checks the feature is in the plan.
 */
export async function requireBillingPlanFeature(
  schoolId: string,
  feature: string
): Promise<void> {
  await requireActiveSubscription(schoolId);
  await requireBillingFeature(schoolId, feature);
}

/**
 * Require school is within usage limits for a resource.
 */
export async function requireUsageLimits(
  schoolId: string,
  resource: "students" | "staff"
): Promise<void> {
  await requireWithinLimit(schoolId, resource);
}
