-- Migration 039: Billing — stop selling unbuilt features
--
-- Pro and Enterprise shipped with "ai": true in plans.features, rendered as
-- "AI Assistant" in the billing UI (principal/billing/plans/page.tsx:63).
-- There is no AI integration anywhere in the codebase: no model SDK in
-- package.json, no LLM calls in src/, no AI extension enabled. Phase 6 of the
-- briefing (AI timetable assistance) is entirely unbuilt, so this was a paid
-- feature that does not exist.
--
-- "website_builder" has the same problem: it is only a feature_flags row
-- (013) and a billing label, with no website builder in the product.
--
-- Both keys are removed from the seeded plan feature matrices rather than
-- flipped to false, so the billing UI stops advertising them at all. They can
-- be re-added to a plan's features in the same way they were introduced once
-- the capability actually ships.
--
-- custom_roles is deliberately left in place: migration 033 seeds the
-- permission matrix and 010 already provides the custom-role tables and the
-- has_permission() support for them.

UPDATE plans
SET features = features - 'ai' - 'website_builder'
WHERE features ?| ARRAY['ai', 'website_builder'];

-- The AI Assistant feature flag must stay off until Phase 6 lands.
UPDATE feature_flags
SET is_enabled = false
WHERE key = 'ai_assistant';

-- Guard: nothing may advertise a capability that has no implementation.
DO $$
DECLARE
  still_advertised text;
BEGIN
  SELECT string_agg(DISTINCT p.slug || ':' || k.key, ', ')
  INTO still_advertised
  FROM plans p,
       LATERAL jsonb_object_keys(p.features) AS k(key)
  WHERE k.key IN ('ai', 'website_builder');

  IF still_advertised IS NOT NULL THEN
    RAISE EXCEPTION 'plans still advertise unbuilt features: %', still_advertised;
  END IF;
END $$;