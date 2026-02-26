-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'FILE_UPLOAD';
ALTER TYPE "AuditAction" ADD VALUE 'FILE_DOWNLOAD';
ALTER TYPE "AuditAction" ADD VALUE 'FILE_MOVE';
ALTER TYPE "AuditAction" ADD VALUE 'FILE_RENAME';
ALTER TYPE "AuditAction" ADD VALUE 'FILE_VERSION_UPLOAD';
ALTER TYPE "AuditAction" ADD VALUE 'FILE_VERSION_RESTORE';
ALTER TYPE "AuditAction" ADD VALUE 'FOLDER_MOVE';
ALTER TYPE "AuditAction" ADD VALUE 'FOLDER_RENAME';
ALTER TYPE "AuditAction" ADD VALUE 'ACCESS_GRANT';
ALTER TYPE "AuditAction" ADD VALUE 'ACCESS_REVOKE';
ALTER TYPE "AuditAction" ADD VALUE 'BULK_MOVE';
ALTER TYPE "AuditAction" ADD VALUE 'BULK_DELETE';
ALTER TYPE "AuditAction" ADD VALUE 'PAYMENT_REGISTER';
ALTER TYPE "AuditAction" ADD VALUE 'PAYMENT_CANCEL';
ALTER TYPE "AuditAction" ADD VALUE 'ENTRY_CANCEL';
ALTER TYPE "AuditAction" ADD VALUE 'CONTEMPLATION';
ALTER TYPE "AuditAction" ADD VALUE 'MEMBER_ADD';
ALTER TYPE "AuditAction" ADD VALUE 'MEMBER_REMOVE';
ALTER TYPE "AuditAction" ADD VALUE 'OWNERSHIP_TRANSFER';
ALTER TYPE "AuditAction" ADD VALUE 'GENERATE';
