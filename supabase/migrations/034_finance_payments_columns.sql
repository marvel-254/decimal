-- Migration 034: Finance — payments schema completion
--
-- src/app/api/billing/payments/route.ts reads and writes columns that were
-- never created, so recording a fee payment always failed:
--   * `payment_method` and `recorded_at` — absent from `payments` (001 only
--     created school_id, student_account_id, amount, payment_date,
--     reference_number, recorded_by, notes, created_at). `payment_method`
--     exists on `receipts` (015) but never on `payments`.
--   * `invoice_id` — absent, so the GET could not embed `invoices(...)`.
--
-- `student_account_id` is NOT NULL REFERENCES student_accounts(id), but the
-- route passed the *invoice* id into it, which violates the foreign key.
-- The route is fixed separately; this migration supplies the columns it needs.

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recorded_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_school_date ON payments(school_id, payment_date DESC);

-- Backfill invoice_id for rows already linked through the ledger.
UPDATE payments p
SET invoice_id = le.invoice_id
FROM ledger_entries le
WHERE le.payment_id = p.id
  AND le.invoice_id IS NOT NULL
  AND p.invoice_id IS NULL;

-- student_accounts must be creatable per student for the payments FK to be
-- satisfiable; this unique index lets the route look one up deterministically.
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_accounts_student
  ON student_accounts(school_id, student_id)
  WHERE fee_structure_id IS NULL;

-- payments has RLS enabled (007) but the FOR ALL policy only covers
-- principal/super_admin/finance. Verify the manage policy still exists so the
-- new columns are not silently unusable.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payments' AND policyname = 'payments: admin/finance can manage'
  ) THEN
    RAISE EXCEPTION 'expected payments manage policy is missing — review 007_rls_for_remaining_tables.sql';
  END IF;
END $$;