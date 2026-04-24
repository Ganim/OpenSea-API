-- Phase 06 / Code Review CR-03 — RECIBO idempotency UNIQUE constraint
--
-- Context:
--   `receipt-pdf-worker` runs with BullMQ `concurrency: 3`. The existing
--   idempotency guard (findFirst on filters.timeEntryId) is not atomic — two
--   jobs for the same timeEntryId could both pass the check and then both
--   execute the $transaction, duplicating the ComplianceArtifact (RECIBO) row
--   with the same storage key.
--
--   The storage key is deterministic:
--     `{tenantId}/compliance/recibo/{YYYY}/{MM}/{nsrHash}.pdf`
--   and `nsrHash` derives from (tenantId, nsrNumber), so it is 1:1 with a
--   given TimeEntry. A partial UNIQUE index on (tenantId, storageKey) WHERE
--   type='RECIBO' AND deletedAt IS NULL gives us a DB-level idempotency
--   guarantee: the second concurrent insert will fail with P2002 instead of
--   silently creating a duplicate.
--
-- Hand-curated (Plan 04-01 workaround) because `prisma migrate dev` would
-- pull in unrelated drift from other modules.
--
-- Rollback (commented at bottom): DROP INDEX ... IF EXISTS.

CREATE UNIQUE INDEX IF NOT EXISTS "compliance_artifacts_recibo_unique_storage_key"
  ON "compliance_artifacts" ("tenant_id", "storage_key")
  WHERE "type" = 'RECIBO' AND "deleted_at" IS NULL;

-- Rollback:
--   DROP INDEX IF EXISTS "compliance_artifacts_recibo_unique_storage_key";
