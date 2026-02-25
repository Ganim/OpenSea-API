-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEntity" ADD VALUE 'CALENDAR_EVENT';
ALTER TYPE "AuditEntity" ADD VALUE 'CALENDAR_PARTICIPANT';
ALTER TYPE "AuditEntity" ADD VALUE 'CALENDAR_REMINDER';
ALTER TYPE "AuditEntity" ADD VALUE 'STORAGE_FOLDER';
ALTER TYPE "AuditEntity" ADD VALUE 'STORAGE_FILE';
ALTER TYPE "AuditEntity" ADD VALUE 'STORAGE_FILE_VERSION';
ALTER TYPE "AuditEntity" ADD VALUE 'STORAGE_ACCESS_RULE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditModule" ADD VALUE 'CALENDAR';
ALTER TYPE "AuditModule" ADD VALUE 'STORAGE';
