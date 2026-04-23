-- Phase 06 / Plan 06-02 — Schema alignment catch-up.
--
-- The TS enum `AuditAction` in `src/entities/audit/audit-action.enum.ts`
-- received 4 new values in Plan 06-01 (COMPLIANCE_GENERATE, COMPLIANCE_DOWNLOAD,
-- COMPLIANCE_VERIFY_PUBLIC, ESOCIAL_SUBMIT) but the Prisma schema enum was
-- NOT updated in the same plan. This migration closes the gap so that audit
-- logs in Plans 06-02..06-06 (COMPLIANCE_ARTIFACT_GENERATED template etc.)
-- can persist without PrismaClientValidationError.
--
-- Applied via Plan 04-01 workaround:
--   npx prisma db execute --file <this file> && npx prisma migrate resolve --applied
-- Hand-curated to include ONLY these 4 enum value additions (dev DB has
-- unrelated drift in production/finance/items that we intentionally do NOT
-- touch — documented in 06-01 SUMMARY + STATE pending todos).

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'COMPLIANCE_GENERATE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'COMPLIANCE_DOWNLOAD';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'COMPLIANCE_VERIFY_PUBLIC';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ESOCIAL_SUBMIT';

-- ─── Rollback (commented — Postgres does NOT support DROP VALUE on enum
--     without rebuilding the entire enum + all dependent columns. In case of
--     emergency reversion, recreate `AuditAction` as a new enum minus these
--     4 values, ALTER TABLE audit_logs USING new_enum::text::old_enum, then
--     DROP TYPE old and RENAME new → old. Complex but scriptable.)
-- ─────────────────────────────────────────────────────────────────────────
