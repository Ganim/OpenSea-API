-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEntity" ADD VALUE 'TASK_BOARD';
ALTER TYPE "AuditEntity" ADD VALUE 'TASK_CARD';
ALTER TYPE "AuditEntity" ADD VALUE 'BOARD_MEMBER';
ALTER TYPE "AuditEntity" ADD VALUE 'BOARD_AUTOMATION';
