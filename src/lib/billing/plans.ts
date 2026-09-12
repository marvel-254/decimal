/**
 * Plans Service
 *
 * Data-driven plan management. Plans are stored in the database,
 * not hardcoded in the application.
 */

import { createAdminClient } from "@/lib/supabase/server-admin";
import type { Plan } from "@/lib/billing/types";

function mapPlan(row: Record<string, unknown>): Plan {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string | null,
    priceMonthly: row.price_monthly as number,
    priceAnnual: (row.price_annual as number | null) ?? null,
    currency: row.currency as string,
    maxStudents: row.max_students as number,
    maxStaff: row.max_staff as number,
    features: (row.features as Record<string, boolean>) ?? {},
    isActive: row.is_active as boolean,
    sortOrder: row.sort_order as number,
  };
}

/**
 * Get all active plans, ordered by sort_order.
 */
export async function getPlans(): Promise<Plan[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[Plans] Error fetching plans:", error);
    return [];
  }

  return (data ?? []).map(mapPlan);
}

/**
 * Get a plan by slug.
 */
export async function getPlanBySlug(slug: string): Promise<Plan | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("plans")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  return mapPlan(data);
}

/**
 * Get a plan by ID.
 */
export async function getPlanById(id: string): Promise<Plan | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("plans")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return mapPlan(data);
}
