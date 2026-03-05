-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CardActivityType" ADD VALUE 'COMMENT_ADDED';
ALTER TYPE "CardActivityType" ADD VALUE 'FIELD_CHANGED';
ALTER TYPE "CardActivityType" ADD VALUE 'SUBTASK_ADDED';
ALTER TYPE "CardActivityType" ADD VALUE 'SUBTASK_UPDATED';
ALTER TYPE "CardActivityType" ADD VALUE 'SUBTASK_REMOVED';
ALTER TYPE "CardActivityType" ADD VALUE 'SUBTASK_REOPENED';
