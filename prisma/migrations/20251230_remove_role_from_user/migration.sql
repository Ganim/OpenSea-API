-- Migration: Remove Role from User
-- This migration removes the Role enum and all role-related fields from the database

-- AlterEnum: Remove ROLE from RequestTargetType
BEGIN;
CREATE TYPE "RequestTargetType_new" AS ENUM ('USER', 'GROUP');
ALTER TABLE "requests" ALTER COLUMN "target_type" TYPE "RequestTargetType_new" USING ("target_type"::text::"RequestTargetType_new");
ALTER TYPE "RequestTargetType" RENAME TO "RequestTargetType_old";
ALTER TYPE "RequestTargetType_new" RENAME TO "RequestTargetType";
DROP TYPE "public"."RequestTargetType_old";
COMMIT;

-- DropIndex: Remove role index from users table
DROP INDEX IF EXISTS "users_role_idx";

-- AlterTable: Remove target_role from requests table
ALTER TABLE "requests" DROP COLUMN IF EXISTS "target_role";

-- AlterTable: Remove role from users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "role";

-- DropEnum: Remove Role enum type
DROP TYPE IF EXISTS "Role";
