-- HR P0-02 (NR-7 20-year retention) + P0-12 (encrypt sensitive health data)
--
-- 1. Add soft-delete column so DELETE /v1/hr/medical-exams/:id no longer
--    erases ASO records that must be retained for 20 years after the
--    employee leaves (NR-7 item 7.4.4.3). Purge is an explicit admin
--    action enforced at the application layer.
-- 2. Add encrypted columns for `observations` and `restrictions` so
--    sensitive occupational health information (Art. 11 LGPD) is no
--    longer stored as plaintext. The plaintext columns are kept
--    temporarily to allow a zero-downtime backfill in a separate
--    follow-up migration before being dropped.

ALTER TABLE "medical_exams"
  ADD COLUMN "observations_encrypted" TEXT,
  ADD COLUMN "restrictions_encrypted" TEXT,
  ADD COLUMN "deleted_at"             TIMESTAMP(3);

-- Support the `WHERE deletedAt IS NULL` read filter and tenant-scoped scans.
CREATE INDEX "medical_exams_deleted_at_idx"            ON "medical_exams" ("deleted_at");
CREATE INDEX "medical_exams_tenant_id_deleted_at_idx" ON "medical_exams" ("tenant_id", "deleted_at");

-- Follow-up migration (NOT this one) will:
--   1. Copy remaining plaintext observations/restrictions into the encrypted
--      columns using FieldCipherService (batch script).
--   2. Verify encryption coverage == 100%.
--   3. Drop the plaintext `observations` and `restrictions` columns.
