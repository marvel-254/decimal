/**
 * Decimal Tuition — gate resolution (feature flag master switch + plan gate).
 *
 * Decision (context §8 / 12 Part 6):
 *   feature_flags `decimal_tuition`  → master switch, school-scoped
 *   plans.features.tuition           → plan entitlement (Starter+)
 * Gate applies to the whole product (read-only included).
 *
 * Billing ships last. Until a school holds a subscription record, its plan
 * entitlement is unknown, so it runs in preview mode (gate open). The moment a
 * subscription exists, the plan gate applies strictly and free-plan schools
 * see the upgrade screen.
 */

import { isFeatureEnabled } from "@/lib/services/features";
import { getEntitlements } from "@/lib/billing/entitlements";
import { getSubscription } from "@/lib/billing/subscription";
import type { TuitionIdentity } from "@/lib/tuition/identity";

export type TuitionGateReason = "ok" | "disabled" | "upgrade" | "no-school";

export interface TuitionGate {
  reason: TuitionGateReason;
  /** Link to fix the gate (billing plans for upgrade, none for disabled). */
  resolutionHref: string | null;
}

const SCHOOL_ROLE_ROOTS: Record<string, string> = {
  principal: "/principal/billing/plans",
  super_admin: "/principal/billing/plans",
};

/**
 * Resolve the gate for a resolved identity.
 * - super_admin platform (no active school context) always passes (manages the
 *   platform gate itself).
 * - A school-scoped identity is gated by its school feature flag + plan.
 */
export async function resolveTuitionGate(
  identity: TuitionIdentity
): Promise<TuitionGate> {
  const isPlatformSuperAdmin =
    identity.kind === "member" &&
    identity.role === "super_admin";

  const schoolId = identity.kind === "none" ? null : identity.schoolId;

  if (isPlatformSuperAdmin && !schoolId) {
    return { reason: "ok", resolutionHref: null };
  }

  if (!schoolId) {
    return { reason: "no-school", resolutionHref: "/dashboard" };
  }

  // Master switch — the platform can disable per school.
  const enabled = await isFeatureEnabled(schoolId, "decimal_tuition");
  if (!enabled) {
    return { reason: "disabled", resolutionHref: null };
  }

  // Plan gate (Starter and above carry plans.features.tuition). Preview mode
  // while the school has never held a subscription (billing ships last); the
  // gate goes strict the moment subscription data exists.
  const subscription = await getSubscription(schoolId);
  if (subscription) {
    const entitlements = await getEntitlements(schoolId);
    const entitled =
      entitlements.isActive && entitlements.features["tuition"] === true;

    if (!entitled) {
      // Only principal/super_admin can self-serve billing. Teachers, parents
      // and students get no resolution link — they escalate to the school
      // administrator (the gate screen prompts them to).
      const resolutionHref =
        identity.kind === "member" ? SCHOOL_ROLE_ROOTS[identity.role] ?? null : null;
      return { reason: "upgrade", resolutionHref };
    }
  }

  return { reason: "ok", resolutionHref: null };
}