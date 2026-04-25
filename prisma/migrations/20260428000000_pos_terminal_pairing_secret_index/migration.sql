-- B-Tree index on pairing_secret to support the cross-tenant scan performed
-- by `POST /v1/pos/devices/pair-public` (ADR 030).
--
-- The use case `PairDevicePublicUseCase` calls
-- `findAllWithActivePairingSecret()` which translates to:
--
--   SELECT * FROM pos_terminals
--   WHERE pairing_secret IS NOT NULL
--     AND is_active = TRUE
--     AND deleted_at IS NULL;
--
-- Without this index the planner must seq-scan every row globally. Since
-- pair-public is rate-limited to 5 req/min/IP the absolute throughput is
-- low, but on a multi-tenant database a single seq-scan still hurts during
-- the rare bursts when a fleet of terminals re-pairs after maintenance.

CREATE INDEX IF NOT EXISTS "pos_terminals_pairing_secret_idx"
  ON "pos_terminals" ("pairing_secret");
