/*
  Warnings:

  - A unique constraint covering the columns `[name,tenant_id,deleted_at]` on the table `permission_groups` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug,tenant_id,deleted_at]` on the table `permission_groups` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "permission_groups_name_deleted_at_key";

-- DropIndex
DROP INDEX "permission_groups_slug_deleted_at_key";

-- AlterTable
ALTER TABLE "permission_groups" ADD COLUMN     "tenant_id" TEXT;

-- CreateIndex
CREATE INDEX "permission_groups_tenant_id_idx" ON "permission_groups"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "permission_groups_name_tenant_id_deleted_at_key" ON "permission_groups"("name", "tenant_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "permission_groups_slug_tenant_id_deleted_at_key" ON "permission_groups"("slug", "tenant_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "permission_groups" ADD CONSTRAINT "permission_groups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
