-- Plan 07-01 (Phase 07 / Dashboard Gestor) — Foundation migration
--
-- Adds:
--   1. 4 AuditAction enum values (PUNCH_BATCH_EXPORTED, PUNCH_MISSED_PUNCH_DETECTED,
--      PUNCH_DEVICE_STATUS_CHANGED, PUNCH_APPROVAL_RESOLVED) — eliminates silent
--      PrismaClientValidationError when Phase 7 controllers emit audit logs.
--   2. 2 AuditEntity enum values (PUNCH_MISSED_LOG, EXPORT_JOB) — required by
--      the new audit templates in hr.messages.ts.
--   3. 2 columns on `punch_approvals` (evidence_files JSONB + linked_request_id
--      TEXT nullable FK to employee_requests) — D-10 evidência (PDF + cross-ref).
--   4. `punch_missed_logs` table — output of the 22h scheduler `detect-missed-punches`
--      (D-12). UNIQUE (tenant_id, employee_id, date) guards against multi-machine
--      duplicates; FKs cascade on tenant/employee hard-delete.
--
-- Hand-curated using the workaround introduced by Plan 04-01
-- (`prisma db execute --file <sql> && prisma migrate resolve --applied`) because
-- `prisma migrate dev` would pull in accumulated drift from production / finance /
-- items / hr_contracts modules unrelated to Plan 07-01 (documented in STATE.md
-- 04-01 Pending Todos, reconfirmed 06-01).
--
-- Rollback is provided as a commented block at the bottom (REP-P demands
-- reversibility evidence per Portaria 671). Note: Postgres does NOT support
-- `DROP VALUE` from enums without rebuilding the type; enum additions are
-- documented as one-way for REP-P backout.

-- ============================================================================
-- 1. AlterEnum (AuditAction) — Phase 7 values
-- ============================================================================

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PUNCH_BATCH_EXPORTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PUNCH_MISSED_PUNCH_DETECTED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PUNCH_DEVICE_STATUS_CHANGED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PUNCH_APPROVAL_RESOLVED';

-- ============================================================================
-- 2. AlterEnum (AuditEntity) — Phase 7 values
-- ============================================================================

ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'PUNCH_MISSED_LOG';
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'EXPORT_JOB';

-- ============================================================================
-- 3. AlterTable (punch_approvals) — evidence + linked request (D-10)
-- ============================================================================

ALTER TABLE "punch_approvals"
  ADD COLUMN IF NOT EXISTS "evidence_files" JSONB,
  ADD COLUMN IF NOT EXISTS "linked_request_id" TEXT;

-- AddForeignKey (SetNull keeps PunchApproval when the linked request is removed)
ALTER TABLE "punch_approvals"
  ADD CONSTRAINT "punch_approvals_linked_request_id_fkey"
  FOREIGN KEY ("linked_request_id") REFERENCES "employee_requests"("id")
  ON UPDATE NO ACTION ON DELETE SET NULL;

-- CreateIndex (supports dashboard filters "exceptions linked to a request")
CREATE INDEX IF NOT EXISTS "punch_approvals_linked_request_id_idx"
  ON "punch_approvals"("linked_request_id");

-- ============================================================================
-- 4. CreateTable (punch_missed_logs)
-- ============================================================================

CREATE TABLE "punch_missed_logs" (
  "id"                  TEXT NOT NULL,
  "tenant_id"           TEXT NOT NULL,
  "employee_id"         TEXT NOT NULL,
  "date"                DATE NOT NULL,
  "shift_assignment_id" TEXT,
  "expected_start_time" TIMESTAMP(3),
  "expected_end_time"   TIMESTAMP(3),
  "generated_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "generated_by_job_id" TEXT,
  "resolved_at"         TIMESTAMP(3),
  "resolution_type"     VARCHAR(30),

  CONSTRAINT "punch_missed_logs_pkey" PRIMARY KEY ("id")
);

-- Indexes — UNIQUE defends idempotency of the 22h scheduler; the others support
-- the dashboard "/hr/punch/missing" listing and the daily digest query path.
CREATE UNIQUE INDEX "punch_missed_logs_tenant_id_employee_id_date_key"
  ON "punch_missed_logs"("tenant_id", "employee_id", "date");
CREATE INDEX "punch_missed_logs_tenant_id_date_idx"
  ON "punch_missed_logs"("tenant_id", "date");
CREATE INDEX "punch_missed_logs_employee_id_date_idx"
  ON "punch_missed_logs"("employee_id", "date");

-- Foreign keys — CASCADE on hard-delete (historical loss is acceptable; soft
-- delete via `Employee.deletedAt` leaves rows intact, as expected).
ALTER TABLE "punch_missed_logs"
  ADD CONSTRAINT "punch_missed_logs_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "punch_missed_logs"
  ADD CONSTRAINT "punch_missed_logs_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
  ON UPDATE CASCADE ON DELETE CASCADE;

-- ========================================
-- ROLLBACK (emergency backout — execute in reverse order)
-- NOTE: `DROP VALUE` from enum types is not scriptable in Postgres without
-- rebuilding the type; leave the 4 AuditAction and 2 AuditEntity values in
-- place on rollback (they are harmless when unused).
-- ========================================
-- ALTER TABLE "punch_missed_logs" DROP CONSTRAINT "punch_missed_logs_employee_id_fkey";
-- ALTER TABLE "punch_missed_logs" DROP CONSTRAINT "punch_missed_logs_tenant_id_fkey";
-- DROP INDEX "punch_missed_logs_employee_id_date_idx";
-- DROP INDEX "punch_missed_logs_tenant_id_date_idx";
-- DROP INDEX "punch_missed_logs_tenant_id_employee_id_date_key";
-- DROP TABLE "punch_missed_logs";
-- DROP INDEX "punch_approvals_linked_request_id_idx";
-- ALTER TABLE "punch_approvals" DROP CONSTRAINT "punch_approvals_linked_request_id_fkey";
-- ALTER TABLE "punch_approvals" DROP COLUMN "linked_request_id";
-- ALTER TABLE "punch_approvals" DROP COLUMN "evidence_files";
