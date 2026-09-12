/**
 * Billing System Types
 *
 * Types for the Decimal platform subscription and billing system.
 * Schools own subscriptions, not individual users.
 */

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMonthly: number;
  priceAnnual: number | null; // null = annual not offered; value in pesas
  currency: string;
  maxStudents: number;
  maxStaff: number;
  features: Record<string, boolean>;
  isActive: boolean;
  sortOrder: number;
}

export interface Subscription {
  id: string;
  schoolId: string;
  planId: string;
  status: SubscriptionStatus;
  provider: string | null;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  billingInterval: "monthly" | "annual";
  mpesaMerchantRequestId: string | null;
  mpesaCheckoutRequestId: string | null;
  mpesaPhone: string | null;
  nextBillingDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "paused"
  | "cancelled"
  | "expired";

export type BillingInterval = "monthly" | "annual";

export interface Entitlements {
  features: Record<string, boolean>;
  limits: {
    students: number;
    staff: number;
  };
  isActive: boolean;
  isTrial: boolean;
  trialEnd: string | null;
}

export interface UsageStats {
  students: { current: number; limit: number };
  staff: { current: number; limit: number };
}

export interface BillingInvoice {
  id: string;
  subscriptionId: string;
  schoolId: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "void";
  billingReason: string | null;
  providerInvoiceId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface SubscriptionEvent {
  id: string;
  subscriptionId: string;
  provider: string;
  providerEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  processedAt: string | null;
  createdAt: string;
}

// Provider abstraction
export interface BillingProvider {
  name: string;
  createCustomer(params: {
    schoolId: string;
    email: string;
    name: string;
  }): Promise<{ customerId: string }>;
  createCheckout(params: {
    customerId: string;
    amount: number;
    currency: string;
    description: string;
    metadata: Record<string, string>;
  }): Promise<{ checkoutUrl: string; reference: string }>;
  verifyWebhook(
    headers: Headers,
    body: string
  ): Promise<WebhookEvent>;
  getSubscription(
    providerSubscriptionId: string
  ): Promise<ProviderSubscription>;
  cancelSubscription(providerSubscriptionId: string): Promise<void>;
}

export interface WebhookEvent {
  type: string;
  providerEventId: string;
  payload: Record<string, unknown>;
}

export interface ProviderSubscription {
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}
