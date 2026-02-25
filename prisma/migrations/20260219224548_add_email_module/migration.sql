/*
  Warnings:

  - A unique constraint covering the columns `[cnpj,type,tenant_id,deleted_at]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cpf,type,tenant_id,deleted_at]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tenant_id` to the `organizations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "email_account_visibility" AS ENUM ('PRIVATE', 'SHARED');

-- CreateEnum
CREATE TYPE "email_folder_type" AS ENUM ('INBOX', 'SENT', 'DRAFTS', 'TRASH', 'SPAM', 'CUSTOM');

-- DropForeignKey
ALTER TABLE "bank_accounts" DROP CONSTRAINT "bank_accounts_company_id_fkey";

-- DropIndex
DROP INDEX "organizations_cnpj_type_deleted_at_key";

-- DropIndex
DROP INDEX "organizations_cpf_type_deleted_at_key";

-- AlterTable
ALTER TABLE "bank_accounts" ALTER COLUMN "company_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "email_accounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "address" VARCHAR(256) NOT NULL,
    "display_name" VARCHAR(128),
    "imap_host" VARCHAR(256) NOT NULL,
    "imap_port" INTEGER NOT NULL,
    "imap_secure" BOOLEAN NOT NULL DEFAULT true,
    "smtp_host" VARCHAR(256) NOT NULL,
    "smtp_port" INTEGER NOT NULL,
    "smtp_secure" BOOLEAN NOT NULL DEFAULT true,
    "username" VARCHAR(256) NOT NULL,
    "encrypted_secret" TEXT NOT NULL,
    "visibility" "email_account_visibility" NOT NULL DEFAULT 'PRIVATE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "signature" TEXT,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_account_access" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "can_read" BOOLEAN NOT NULL DEFAULT true,
    "can_send" BOOLEAN NOT NULL DEFAULT false,
    "can_manage" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_account_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_folders" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "remote_name" VARCHAR(256) NOT NULL,
    "display_name" VARCHAR(128) NOT NULL,
    "type" "email_folder_type" NOT NULL DEFAULT 'CUSTOM',
    "uid_validity" INTEGER,
    "last_uid" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_messages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "remote_uid" INTEGER NOT NULL,
    "message_id" VARCHAR(512),
    "thread_id" VARCHAR(512),
    "from_address" VARCHAR(512) NOT NULL,
    "from_name" VARCHAR(256),
    "to_addresses" TEXT[],
    "cc_addresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bcc_addresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subject" VARCHAR(998) NOT NULL,
    "snippet" VARCHAR(256),
    "bodyText" TEXT,
    "body_html_sanitized" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_flagged" BOOLEAN NOT NULL DEFAULT false,
    "has_attachments" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_attachments" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "filename" VARCHAR(512) NOT NULL,
    "content_type" VARCHAR(128) NOT NULL,
    "size" INTEGER NOT NULL,
    "storage_key" VARCHAR(1024) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_accounts_tenant_id_idx" ON "email_accounts"("tenant_id");

-- CreateIndex
CREATE INDEX "email_accounts_owner_user_id_idx" ON "email_accounts"("owner_user_id");

-- CreateIndex
CREATE INDEX "email_accounts_tenant_id_is_active_idx" ON "email_accounts"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "email_account_access_tenant_id_idx" ON "email_account_access"("tenant_id");

-- CreateIndex
CREATE INDEX "email_account_access_user_id_idx" ON "email_account_access"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_account_access_account_id_user_id_key" ON "email_account_access"("account_id", "user_id");

-- CreateIndex
CREATE INDEX "email_folders_account_id_idx" ON "email_folders"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_folders_account_id_remote_name_key" ON "email_folders"("account_id", "remote_name");

-- CreateIndex
CREATE INDEX "email_messages_tenant_id_idx" ON "email_messages"("tenant_id");

-- CreateIndex
CREATE INDEX "email_messages_account_id_idx" ON "email_messages"("account_id");

-- CreateIndex
CREATE INDEX "email_messages_folder_id_idx" ON "email_messages"("folder_id");

-- CreateIndex
CREATE INDEX "email_messages_tenant_id_is_read_idx" ON "email_messages"("tenant_id", "is_read");

-- CreateIndex
CREATE INDEX "email_messages_tenant_id_received_at_idx" ON "email_messages"("tenant_id", "received_at" DESC);

-- CreateIndex
CREATE INDEX "email_messages_deleted_at_idx" ON "email_messages"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "email_messages_account_id_folder_id_remote_uid_key" ON "email_messages"("account_id", "folder_id", "remote_uid");

-- CreateIndex
CREATE INDEX "email_attachments_message_id_idx" ON "email_attachments"("message_id");

-- CreateIndex
CREATE INDEX "organizations_tenant_id_idx" ON "organizations"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_cnpj_type_tenant_id_deleted_at_key" ON "organizations"("cnpj", "type", "tenant_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_cpf_type_tenant_id_deleted_at_key" ON "organizations"("cpf", "type", "tenant_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_accounts" ADD CONSTRAINT "email_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_accounts" ADD CONSTRAINT "email_accounts_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_account_access" ADD CONSTRAINT "email_account_access_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "email_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_account_access" ADD CONSTRAINT "email_account_access_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_account_access" ADD CONSTRAINT "email_account_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_folders" ADD CONSTRAINT "email_folders_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "email_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "email_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "email_folders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "email_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
