-- Phase 6 / Plan 06-01 — Compliance Portaria 671 (schema base)
--
-- Adds:
--   * Two new enums (ComplianceArtifactType, AdjustmentType)
--   * One new value to AuditEntity (COMPLIANCE_ARTIFACT)
--   * Two new tables (compliance_artifacts, compliance_public_verify_log)
--   * Three new columns + index on time_entries
--     (origin_nsr_number, adjustment_type, receipt_verify_hash)
--
-- All changes are additive. Existing data unaffected. Migration is reversible
-- via the rollback SQL appended at the bottom (commented out — apply manually
-- only if a backout is required).

-- CreateEnum
CREATE TYPE "ComplianceArtifactType" AS ENUM ('AFD', 'AFDT', 'FOLHA_ESPELHO', 'RECIBO', 'S1200_XML');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('ORIGINAL', 'ADJUSTMENT_APPROVED');

-- AlterEnum
ALTER TYPE "AuditEntity" ADD VALUE 'COMPLIANCE_ARTIFACT';

-- AlterTable
ALTER TABLE "time_entries"
    ADD COLUMN "adjustment_type" "AdjustmentType" NOT NULL DEFAULT 'ORIGINAL',
    ADD COLUMN "origin_nsr_number" INTEGER,
    ADD COLUMN "receipt_verify_hash" VARCHAR(64);

-- CreateTable
CREATE TABLE "compliance_artifacts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "ComplianceArtifactType" NOT NULL,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "competencia" VARCHAR(7),
    "filters" JSONB,
    "storage_key" TEXT NOT NULL,
    "content_hash" VARCHAR(64) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "generated_by" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "compliance_artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_public_verify_log" (
    "id" TEXT NOT NULL,
    "nsr_hash" VARCHAR(64) NOT NULL,
    "tenant_id" TEXT,
    "time_entry_id" TEXT,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hit_result" VARCHAR(16) NOT NULL,

    CONSTRAINT "compliance_public_verify_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compliance_artifacts_tenant_id_type_generated_at_idx" ON "compliance_artifacts"("tenant_id", "type", "generated_at" DESC);

-- CreateIndex
CREATE INDEX "compliance_artifacts_tenant_id_competencia_idx" ON "compliance_artifacts"("tenant_id", "competencia");

-- CreateIndex
CREATE INDEX "compliance_artifacts_tenant_id_deleted_at_idx" ON "compliance_artifacts"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "compliance_public_verify_log_nsr_hash_accessed_at_idx" ON "compliance_public_verify_log"("nsr_hash", "accessed_at" DESC);

-- CreateIndex
CREATE INDEX "compliance_public_verify_log_accessed_at_idx" ON "compliance_public_verify_log"("accessed_at" DESC);

-- CreateIndex
CREATE INDEX "compliance_public_verify_log_tenant_id_accessed_at_idx" ON "compliance_public_verify_log"("tenant_id", "accessed_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "time_entries_receipt_verify_hash_key" ON "time_entries"("receipt_verify_hash");

-- CreateIndex
CREATE INDEX "time_entries_tenant_id_origin_nsr_number_idx" ON "time_entries"("tenant_id", "origin_nsr_number");

-- AddForeignKey
ALTER TABLE "compliance_artifacts" ADD CONSTRAINT "compliance_artifacts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_artifacts" ADD CONSTRAINT "compliance_artifacts_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- ROLLBACK (manual emergency only; do NOT run by default)
-- ============================================================================
-- ALTER TABLE "compliance_artifacts" DROP CONSTRAINT "compliance_artifacts_generated_by_fkey";
-- ALTER TABLE "compliance_artifacts" DROP CONSTRAINT "compliance_artifacts_tenant_id_fkey";
-- DROP INDEX "time_entries_tenant_id_origin_nsr_number_idx";
-- DROP INDEX "time_entries_receipt_verify_hash_key";
-- DROP INDEX "compliance_public_verify_log_tenant_id_accessed_at_idx";
-- DROP INDEX "compliance_public_verify_log_accessed_at_idx";
-- DROP INDEX "compliance_public_verify_log_nsr_hash_accessed_at_idx";
-- DROP INDEX "compliance_artifacts_tenant_id_deleted_at_idx";
-- DROP INDEX "compliance_artifacts_tenant_id_competencia_idx";
-- DROP INDEX "compliance_artifacts_tenant_id_type_generated_at_idx";
-- DROP TABLE "compliance_public_verify_log";
-- DROP TABLE "compliance_artifacts";
-- ALTER TABLE "time_entries"
--     DROP COLUMN "receipt_verify_hash",
--     DROP COLUMN "origin_nsr_number",
--     DROP COLUMN "adjustment_type";
-- DROP TYPE "AdjustmentType";
-- DROP TYPE "ComplianceArtifactType";
-- AuditEntity enum: cannot drop a single value safely in PostgreSQL; rebuild the enum if rollback is required.
