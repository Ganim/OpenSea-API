-- AlterEnum: add POS_FISCAL_CONFIG_UPDATE / POS_FISCAL_EMIT to AuditAction
-- (Emporion Plan A — Task 32). Used by:
--   POS_FISCAL_CONFIG_UPDATE → emitted by `PUT /v1/admin/pos/fiscal-config`
--     when the tenant fiscal configuration is upserted.
--   POS_FISCAL_EMIT → emitted by `POST /v1/pos/fiscal/emit` after a fiscal
--     document (NFC-e on Fase 1) is authorized by the SEFAZ pipeline (mocked
--     in Fase 1) and the Order is updated with the authorization metadata.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'POS_FISCAL_CONFIG_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'POS_FISCAL_EMIT';

-- AlterEnum: add POS_FISCAL_CONFIG to AuditEntity. Used as the audit entity
-- for the `pos_fiscal_config` table (one row per tenant). Audits about the
-- fiscal *emission itself* reuse the `ORDER` entity because the emission
-- mutates the Order's fiscal columns and links naturally to the order audit
-- trail.
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'POS_FISCAL_CONFIG';
