-- Migration 035: Messaging — add messages.sent_at
--
-- src/lib/services/message.ts reads and orders by `sent_at` (lines 29, 43,
-- 214) but no migration ever created the column — only created_at (001) and
-- read_at (016) exist. Every messaging surface (parent, teacher, principal,
-- secretary) therefore failed at the PostgREST layer with
-- "column messages.sent_at does not exist".
--
-- sent_at is kept as its own column rather than aliased to created_at so that
-- scheduled sends can later set a future sent_at while created_at records when
-- the row was written.

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS sent_at timestamptz NOT NULL DEFAULT now();

-- Backfill so historical ordering is correct rather than "now()".
UPDATE messages SET sent_at = created_at WHERE sent_at > created_at;

CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);

-- Keep sent_at aligned with created_at for inserts that omit it explicitly.
CREATE OR REPLACE FUNCTION sync_messages_sent_at() RETURNS trigger AS $$
BEGIN
  IF NEW.sent_at IS NULL THEN
    NEW.sent_at := COALESCE(NEW.created_at, now());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_messages_sent_at ON messages;

CREATE TRIGGER trg_messages_sent_at
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION sync_messages_sent_at();