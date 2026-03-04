-- AlterEnum
ALTER TYPE "AuditModule" ADD VALUE 'EMAIL';

-- AlterEnum
ALTER TYPE "SystemModuleEnum" ADD VALUE 'EMAIL';

-- CreateTable
CREATE TABLE "storage_share_links" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "token" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "password" VARCHAR(128),
    "max_downloads" INTEGER,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_share_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "storage_share_links_token_key" ON "storage_share_links"("token");

-- CreateIndex
CREATE INDEX "storage_share_links_tenant_id_idx" ON "storage_share_links"("tenant_id");

-- CreateIndex
CREATE INDEX "storage_share_links_file_id_idx" ON "storage_share_links"("file_id");

-- CreateIndex
CREATE INDEX "storage_share_links_token_idx" ON "storage_share_links"("token");

-- CreateIndex
CREATE INDEX "storage_share_links_created_by_idx" ON "storage_share_links"("created_by");

-- CreateIndex
CREATE INDEX "folder_access_rules_folder_id_user_id_idx" ON "folder_access_rules"("folder_id", "user_id");

-- CreateIndex
CREATE INDEX "folder_access_rules_folder_id_group_id_idx" ON "folder_access_rules"("folder_id", "group_id");

-- CreateIndex
CREATE INDEX "storage_files_tenant_id_deleted_at_idx" ON "storage_files"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "storage_files_tenant_id_folder_id_deleted_at_idx" ON "storage_files"("tenant_id", "folder_id", "deleted_at");

-- CreateIndex
CREATE INDEX "storage_folders_tenant_id_deleted_at_idx" ON "storage_folders"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "storage_folders_tenant_id_parent_id_deleted_at_idx" ON "storage_folders"("tenant_id", "parent_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "storage_share_links" ADD CONSTRAINT "storage_share_links_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_share_links" ADD CONSTRAINT "storage_share_links_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
