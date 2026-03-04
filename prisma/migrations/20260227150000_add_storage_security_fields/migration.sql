-- AlterTable
ALTER TABLE "storage_files" ADD COLUMN     "is_encrypted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_protected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "protection_hash" VARCHAR(256);

-- AlterTable
ALTER TABLE "storage_folders" ADD COLUMN     "is_hidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_protected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "protection_hash" VARCHAR(256);

-- AlterTable
ALTER TABLE "tenant_users" ADD COLUMN     "security_key_hash" VARCHAR(256);
