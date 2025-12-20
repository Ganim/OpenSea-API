/*
  Warnings:

  - A unique constraint covering the columns `[slug,deleted_at]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[document,deleted_at]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[unique_code,deleted_at]` on the table `items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[full_code,deleted_at]` on the table `items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,deleted_at]` on the table `permission_groups` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug,deleted_at]` on the table `permission_groups` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,deleted_at]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[full_code,deleted_at]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[order_number,deleted_at]` on the table `sales_orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cnpj,deleted_at]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,deleted_at]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[username,deleted_at]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sku,deleted_at]` on the table `variants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[full_code,deleted_at]` on the table `variants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[barcode,deleted_at]` on the table `variants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ean_code,deleted_at]` on the table `variants` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[upc_code,deleted_at]` on the table `variants` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `module` to the `audit_logs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AuditModule" AS ENUM ('CORE', 'AUTH', 'RBAC', 'STOCK', 'SALES', 'HR', 'PAYROLL', 'REQUESTS', 'NOTIFICATIONS', 'SYSTEM', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'STATUS_CHANGE';
ALTER TYPE "AuditAction" ADD VALUE 'PERMISSION_GRANT';
ALTER TYPE "AuditAction" ADD VALUE 'PERMISSION_REVOKE';
ALTER TYPE "AuditAction" ADD VALUE 'EXPORT';
ALTER TYPE "AuditAction" ADD VALUE 'IMPORT';
ALTER TYPE "AuditAction" ADD VALUE 'SYNC';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEntity" ADD VALUE 'USER_PROFILE';
ALTER TYPE "AuditEntity" ADD VALUE 'REFRESH_TOKEN';
ALTER TYPE "AuditEntity" ADD VALUE 'PERMISSION';
ALTER TYPE "AuditEntity" ADD VALUE 'PERMISSION_GROUP';
ALTER TYPE "AuditEntity" ADD VALUE 'PERMISSION_GROUP_PERMISSION';
ALTER TYPE "AuditEntity" ADD VALUE 'USER_PERMISSION_GROUP';
ALTER TYPE "AuditEntity" ADD VALUE 'USER_DIRECT_PERMISSION';
ALTER TYPE "AuditEntity" ADD VALUE 'ITEM_MOVEMENT';
ALTER TYPE "AuditEntity" ADD VALUE 'PRODUCT_CATEGORY';
ALTER TYPE "AuditEntity" ADD VALUE 'VARIANT_PRICE_HISTORY';
ALTER TYPE "AuditEntity" ADD VALUE 'TAG';
ALTER TYPE "AuditEntity" ADD VALUE 'PRODUCT_TAG';
ALTER TYPE "AuditEntity" ADD VALUE 'VARIANT_IMAGE';
ALTER TYPE "AuditEntity" ADD VALUE 'PURCHASE_ORDER';
ALTER TYPE "AuditEntity" ADD VALUE 'PURCHASE_ORDER_ITEM';
ALTER TYPE "AuditEntity" ADD VALUE 'UNIT_CONVERSION';
ALTER TYPE "AuditEntity" ADD VALUE 'STOCK_SNAPSHOT';
ALTER TYPE "AuditEntity" ADD VALUE 'VARIANT_SUPPLIER_CODE';
ALTER TYPE "AuditEntity" ADD VALUE 'VARIANT_PROMOTION';
ALTER TYPE "AuditEntity" ADD VALUE 'CUSTOMER';
ALTER TYPE "AuditEntity" ADD VALUE 'SALES_ORDER';
ALTER TYPE "AuditEntity" ADD VALUE 'SALES_ORDER_ITEM';
ALTER TYPE "AuditEntity" ADD VALUE 'ITEM_RESERVATION';
ALTER TYPE "AuditEntity" ADD VALUE 'ALERT';
ALTER TYPE "AuditEntity" ADD VALUE 'NOTIFICATION';
ALTER TYPE "AuditEntity" ADD VALUE 'NOTIFICATION_TEMPLATE';
ALTER TYPE "AuditEntity" ADD VALUE 'NOTIFICATION_PREFERENCE';
ALTER TYPE "AuditEntity" ADD VALUE 'COMMENT';
ALTER TYPE "AuditEntity" ADD VALUE 'REQUEST';
ALTER TYPE "AuditEntity" ADD VALUE 'REQUEST_ATTACHMENT';
ALTER TYPE "AuditEntity" ADD VALUE 'REQUEST_COMMENT';
ALTER TYPE "AuditEntity" ADD VALUE 'REQUEST_HISTORY';
ALTER TYPE "AuditEntity" ADD VALUE 'EMPLOYEE';
ALTER TYPE "AuditEntity" ADD VALUE 'DEPARTMENT';
ALTER TYPE "AuditEntity" ADD VALUE 'POSITION';
ALTER TYPE "AuditEntity" ADD VALUE 'TIME_ENTRY';
ALTER TYPE "AuditEntity" ADD VALUE 'WORK_SCHEDULE';
ALTER TYPE "AuditEntity" ADD VALUE 'OVERTIME';
ALTER TYPE "AuditEntity" ADD VALUE 'TIME_BANK';
ALTER TYPE "AuditEntity" ADD VALUE 'ABSENCE';
ALTER TYPE "AuditEntity" ADD VALUE 'VACATION_PERIOD';
ALTER TYPE "AuditEntity" ADD VALUE 'PAYROLL';
ALTER TYPE "AuditEntity" ADD VALUE 'PAYROLL_ITEM';
ALTER TYPE "AuditEntity" ADD VALUE 'BONUS';
ALTER TYPE "AuditEntity" ADD VALUE 'DEDUCTION';

-- DropIndex
DROP INDEX "categories_slug_deleted_at_idx";

-- DropIndex
DROP INDEX "categories_slug_key";

-- DropIndex
DROP INDEX "customers_document_key";

-- DropIndex
DROP INDEX "items_full_code_key";

-- DropIndex
DROP INDEX "items_unique_code_key";

-- DropIndex
DROP INDEX "permission_groups_name_key";

-- DropIndex
DROP INDEX "permission_groups_slug_key";

-- DropIndex
DROP INDEX "products_code_key";

-- DropIndex
DROP INDEX "products_full_code_key";

-- DropIndex
DROP INDEX "sales_orders_order_number_key";

-- DropIndex
DROP INDEX "suppliers_cnpj_key";

-- DropIndex
DROP INDEX "users_email_deleted_at_idx";

-- DropIndex
DROP INDEX "users_email_key";

-- DropIndex
DROP INDEX "users_username_deleted_at_idx";

-- DropIndex
DROP INDEX "users_username_key";

-- DropIndex
DROP INDEX "variants_barcode_key";

-- DropIndex
DROP INDEX "variants_ean_code_key";

-- DropIndex
DROP INDEX "variants_full_code_key";

-- DropIndex
DROP INDEX "variants_sku_key";

-- DropIndex
DROP INDEX "variants_upc_code_key";

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "affected_user" TEXT,
ADD COLUMN     "endpoint" VARCHAR(256),
ADD COLUMN     "method" VARCHAR(10),
ADD COLUMN     "module" "AuditModule" NOT NULL;

-- CreateIndex
CREATE INDEX "audit_logs_affected_user_idx" ON "audit_logs"("affected_user");

-- CreateIndex
CREATE INDEX "audit_logs_module_idx" ON "audit_logs"("module");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_module_created_at_idx" ON "audit_logs"("module", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_action_idx" ON "audit_logs"("user_id", "action");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_deleted_at_key" ON "categories"("slug", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "customers_document_deleted_at_key" ON "customers"("document", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "items_unique_code_deleted_at_key" ON "items"("unique_code", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "items_full_code_deleted_at_key" ON "items"("full_code", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "permission_groups_name_deleted_at_key" ON "permission_groups"("name", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "permission_groups_slug_deleted_at_key" ON "permission_groups"("slug", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_deleted_at_key" ON "products"("code", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "products_full_code_deleted_at_key" ON "products"("full_code", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_order_number_deleted_at_key" ON "sales_orders"("order_number", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_cnpj_deleted_at_key" ON "suppliers"("cnpj", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_deleted_at_key" ON "users"("email", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_deleted_at_key" ON "users"("username", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "variants_sku_deleted_at_key" ON "variants"("sku", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "variants_full_code_deleted_at_key" ON "variants"("full_code", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "variants_barcode_deleted_at_key" ON "variants"("barcode", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "variants_ean_code_deleted_at_key" ON "variants"("ean_code", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "variants_upc_code_deleted_at_key" ON "variants"("upc_code", "deleted_at");
