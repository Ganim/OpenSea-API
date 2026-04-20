-- Phase 5 / Plan 05-01 — Kiosk + Face Match foundation
--
-- Adds:
--   * AuditEntity enum: closes Phase 4 debt (PUNCH_DEVICE, PUNCH_APPROVAL)
--                        + Phase 5 net-new (FACE_ENROLLMENT, PUNCH_PIN, PUNCH_QR_TOKEN)
--   * PunchApprovalReason: new value FACE_MATCH_LOW (D-03)
--   * Employee: 7 new columns for kiosk badge QR (D-15) and PIN fallback (D-08)
--   * PunchConfiguration: new column face_match_threshold (D-03)
--   * employee_face_enrollments table (D-02): AES-256-GCM encrypted embeddings
--
-- Pre-existing drift in dev DB (notifications v2, production module,
-- finance_period_locks, items indexes) is intentionally NOT included here.
-- Phase 4 SUMMARY (commit be4c6d2d) documents the precedent.
--
-- Postgres caveat: each `ALTER TYPE ... ADD VALUE` runs in its own transaction
-- (Postgres design — cannot be wrapped in BEGIN/COMMIT alongside other DDL).
-- Prisma migrate emits them as separate top-level statements; this is correct.

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.

ALTER TYPE "AuditEntity" ADD VALUE 'PUNCH_DEVICE';
ALTER TYPE "AuditEntity" ADD VALUE 'PUNCH_APPROVAL';
ALTER TYPE "AuditEntity" ADD VALUE 'FACE_ENROLLMENT';
ALTER TYPE "AuditEntity" ADD VALUE 'PUNCH_PIN';
ALTER TYPE "AuditEntity" ADD VALUE 'PUNCH_QR_TOKEN';

-- AlterEnum
ALTER TYPE "PunchApprovalReason" ADD VALUE 'FACE_MATCH_LOW';

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "punch_pin_failed_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "punch_pin_hash" VARCHAR(100),
ADD COLUMN     "punch_pin_last_failed_at" TIMESTAMP(3),
ADD COLUMN     "punch_pin_locked_until" TIMESTAMP(3),
ADD COLUMN     "punch_pin_set_at" TIMESTAMP(3),
ADD COLUMN     "qr_token_hash" VARCHAR(64),
ADD COLUMN     "qr_token_set_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "punch_configurations" ADD COLUMN     "face_match_threshold" DOUBLE PRECISION NOT NULL DEFAULT 0.55;

-- CreateTable
CREATE TABLE "employee_face_enrollments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "embedding" BYTEA NOT NULL,
    "iv" BYTEA NOT NULL,
    "auth_tag" BYTEA NOT NULL,
    "photo_count" INTEGER NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL,
    "captured_by_user_id" TEXT NOT NULL,
    "consent_audit_log_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employee_face_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_face_enrollments_tenant_id_employee_id_idx" ON "employee_face_enrollments"("tenant_id", "employee_id");

-- CreateIndex
CREATE INDEX "employees_tenant_id_qr_token_hash_idx" ON "employees"("tenant_id", "qr_token_hash");
