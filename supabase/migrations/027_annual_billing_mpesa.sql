-- Migration 027: Annual billing, M-Pesa STK Push tracking, trial enforcement

-- ============================================================
-- ADD ANNUAL PRICING TO PLANS
-- ============================================================

ALTER TABLE plans ADD COLUMN IF NOT EXISTS price_annual integer;
-- NULL = annual not offered; 0 = free annually
-- Values in pesas (cents): KES 3,000 = 300000

UPDATE plans SET price_annual = 0 WHERE slug = 'free';
UPDATE plans SET price_annual = 28800000 WHERE slug = 'starter';   -- 300000 * 12 * 0.8
UPDATE plans SET price_annual = 57600000 WHERE slug = 'pro';       -- 600000 * 12 * 0.8
UPDATE plans SET price_annual = 144000000 WHERE slug = 'enterprise'; -- 1500000 * 12 * 0.8

-- ============================================================
-- ADD BILLING INTERVAL TO SUBSCRIPTIONS
-- ============================================================

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS billing_interval text NOT NULL DEFAULT 'monthly';
-- Values: 'monthly' | 'annual'

-- ============================================================
-- ADD M-PESA TRACKING COLUMNS
-- ============================================================

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS mpesa_merchant_request_id text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS mpesa_checkout_request_id text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS mpesa_phone text;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS next_billing_date timestamptz;

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON subscriptions(next_billing_date)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_subscriptions_merchant_request ON subscriptions(mpesa_merchant_request_id)
  WHERE mpesa_merchant_request_id IS NOT NULL;
