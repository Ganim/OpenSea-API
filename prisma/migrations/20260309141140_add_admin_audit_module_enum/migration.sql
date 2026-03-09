-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'PLAN_CHANGE';
ALTER TYPE "AuditAction" ADD VALUE 'FLAG_CHANGE';
ALTER TYPE "AuditAction" ADD VALUE 'SECURITY_KEY_CHANGE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEntity" ADD VALUE 'TENANT';
ALTER TYPE "AuditEntity" ADD VALUE 'PLAN';
ALTER TYPE "AuditEntity" ADD VALUE 'TENANT_USER';
ALTER TYPE "AuditEntity" ADD VALUE 'FEATURE_FLAG';

-- AlterEnum
ALTER TYPE "AuditModule" ADD VALUE 'ADMIN';
