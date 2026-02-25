-- CreateEnum
CREATE TYPE "StorageFileStatus" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- CreateTable
CREATE TABLE "storage_folders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" VARCHAR(256) NOT NULL,
    "slug" VARCHAR(256) NOT NULL,
    "path" VARCHAR(1024) NOT NULL,
    "icon" VARCHAR(64),
    "color" VARCHAR(7),
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_filter" BOOLEAN NOT NULL DEFAULT false,
    "filter_file_type" VARCHAR(64),
    "module" VARCHAR(32),
    "entity_type" VARCHAR(64),
    "entity_id" TEXT,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "storage_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_files" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "original_name" VARCHAR(256) NOT NULL,
    "file_key" VARCHAR(512) NOT NULL,
    "path" VARCHAR(1280) NOT NULL,
    "size" INTEGER NOT NULL,
    "mime_type" VARCHAR(128) NOT NULL,
    "file_type" VARCHAR(64) NOT NULL,
    "thumbnail_key" VARCHAR(512),
    "status" "StorageFileStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "entity_type" VARCHAR(64),
    "entity_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "storage_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_file_versions" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "file_key" VARCHAR(512) NOT NULL,
    "size" INTEGER NOT NULL,
    "mime_type" VARCHAR(128) NOT NULL,
    "change_note" VARCHAR(512),
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_file_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "folder_access_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "user_id" TEXT,
    "group_id" TEXT,
    "can_read" BOOLEAN NOT NULL DEFAULT true,
    "can_write" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "can_share" BOOLEAN NOT NULL DEFAULT false,
    "is_inherited" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folder_access_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "storage_folders_tenant_id_idx" ON "storage_folders"("tenant_id");

-- CreateIndex
CREATE INDEX "storage_folders_parent_id_idx" ON "storage_folders"("parent_id");

-- CreateIndex
CREATE INDEX "storage_folders_path_idx" ON "storage_folders"("path");

-- CreateIndex
CREATE INDEX "storage_folders_module_idx" ON "storage_folders"("module");

-- CreateIndex
CREATE INDEX "storage_folders_entity_type_entity_id_idx" ON "storage_folders"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "storage_folders_tenant_id_path_deleted_at_key" ON "storage_folders"("tenant_id", "path", "deleted_at");

-- CreateIndex
CREATE INDEX "storage_files_tenant_id_idx" ON "storage_files"("tenant_id");

-- CreateIndex
CREATE INDEX "storage_files_folder_id_idx" ON "storage_files"("folder_id");

-- CreateIndex
CREATE INDEX "storage_files_file_type_idx" ON "storage_files"("file_type");

-- CreateIndex
CREATE INDEX "storage_files_entity_type_entity_id_idx" ON "storage_files"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "storage_files_uploaded_by_idx" ON "storage_files"("uploaded_by");

-- CreateIndex
CREATE UNIQUE INDEX "storage_files_tenant_id_path_deleted_at_key" ON "storage_files"("tenant_id", "path", "deleted_at");

-- CreateIndex
CREATE INDEX "storage_file_versions_file_id_idx" ON "storage_file_versions"("file_id");

-- CreateIndex
CREATE UNIQUE INDEX "storage_file_versions_file_id_version_key" ON "storage_file_versions"("file_id", "version");

-- CreateIndex
CREATE INDEX "folder_access_rules_tenant_id_idx" ON "folder_access_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "folder_access_rules_folder_id_idx" ON "folder_access_rules"("folder_id");

-- CreateIndex
CREATE INDEX "folder_access_rules_user_id_idx" ON "folder_access_rules"("user_id");

-- CreateIndex
CREATE INDEX "folder_access_rules_group_id_idx" ON "folder_access_rules"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "folder_access_rules_folder_id_user_id_key" ON "folder_access_rules"("folder_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "folder_access_rules_folder_id_group_id_key" ON "folder_access_rules"("folder_id", "group_id");

-- AddForeignKey
ALTER TABLE "storage_folders" ADD CONSTRAINT "storage_folders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_folders" ADD CONSTRAINT "storage_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "storage_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_files" ADD CONSTRAINT "storage_files_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_files" ADD CONSTRAINT "storage_files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "storage_folders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_file_versions" ADD CONSTRAINT "storage_file_versions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_access_rules" ADD CONSTRAINT "folder_access_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_access_rules" ADD CONSTRAINT "folder_access_rules_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "storage_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_access_rules" ADD CONSTRAINT "folder_access_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "folder_access_rules" ADD CONSTRAINT "folder_access_rules_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "permission_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
