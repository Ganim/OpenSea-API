-- HR P0 (Warnings soft-delete compliance)
--
-- employee_warnings already carries deleted_at, but delete-warning use case
-- was still doing a hard delete (splice in memory / DELETE in Prisma). CLT
-- Art. 474 and MTE guidance require disciplinary history to remain
-- retrievable after a "delete" — labor courts routinely request historical
-- warnings during trabalhista disputes even when the employer removed them
-- from the employee's profile. Hard-deleting makes that impossible and
-- opens the tenant up to sanctions.
--
-- This migration adds the deleted_by column to record which user triggered
-- the soft-delete. We intentionally do NOT add a foreign key to User here:
-- warnings persist across user-deletions, and a dangling string is less
-- harmful than a blocked delete path. Auditors can still resolve deletedBy
-- -> user_id via the audit log.

ALTER TABLE "employee_warnings"
  ADD COLUMN "deleted_by" TEXT;
