-- DropIndex
DROP INDEX "bins_address_deleted_at_key";

-- DropIndex
DROP INDEX "categories_slug_deleted_at_key";

-- DropIndex
DROP INDEX "customers_document_deleted_at_key";

-- DropIndex
DROP INDEX "items_slug_deleted_at_key";

-- DropIndex
DROP INDEX "items_slug_key";

-- DropIndex
DROP INDEX "items_unique_code_deleted_at_key";

-- DropIndex
DROP INDEX "manufacturers_code_key";

-- DropIndex
DROP INDEX "products_slug_deleted_at_key";

-- DropIndex
DROP INDEX "products_slug_key";

-- DropIndex
DROP INDEX "purchase_orders_order_number_key";

-- DropIndex
DROP INDEX "sales_orders_order_number_deleted_at_key";

-- DropIndex
DROP INDEX "suppliers_cnpj_deleted_at_key";

-- DropIndex
DROP INDEX "tags_name_key";

-- DropIndex
DROP INDEX "tags_slug_key";

-- DropIndex
DROP INDEX "templates_name_deleted_at_key";

-- DropIndex
DROP INDEX "variants_sku_deleted_at_key";

-- DropIndex
DROP INDEX "variants_slug_deleted_at_key";

-- DropIndex
DROP INDEX "variants_slug_key";

-- DropIndex
DROP INDEX "volumes_code_key";

-- DropIndex
DROP INDEX "warehouses_code_deleted_at_key";

-- AlterTable
ALTER TABLE "bins" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "item_movements" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "manufacturers" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tags" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "templates" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "variants" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "volumes" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "zones" ADD COLUMN     "tenant_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "bins_tenant_id_idx" ON "bins"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "bins_address_tenant_id_deleted_at_key" ON "bins"("address", "tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "categories_tenant_id_idx" ON "categories"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_tenant_id_deleted_at_key" ON "categories"("slug", "tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "customers_tenant_id_idx" ON "customers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_document_tenant_id_deleted_at_key" ON "customers"("document", "tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "item_movements_tenant_id_idx" ON "item_movements"("tenant_id");

-- CreateIndex
CREATE INDEX "items_tenant_id_idx" ON "items"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "items_unique_code_tenant_id_deleted_at_key" ON "items"("unique_code", "tenant_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "items_slug_tenant_id_deleted_at_key" ON "items"("slug", "tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "manufacturers_tenant_id_idx" ON "manufacturers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturers_code_tenant_id_key" ON "manufacturers"("code", "tenant_id");

-- CreateIndex
CREATE INDEX "products_tenant_id_idx" ON "products"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_tenant_id_deleted_at_key" ON "products"("slug", "tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "purchase_orders_tenant_id_idx" ON "purchase_orders"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_order_number_tenant_id_key" ON "purchase_orders"("order_number", "tenant_id");

-- CreateIndex
CREATE INDEX "sales_orders_tenant_id_idx" ON "sales_orders"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_order_number_tenant_id_deleted_at_key" ON "sales_orders"("order_number", "tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "suppliers_tenant_id_idx" ON "suppliers"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_cnpj_tenant_id_deleted_at_key" ON "suppliers"("cnpj", "tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "tags_tenant_id_idx" ON "tags"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_tenant_id_key" ON "tags"("name", "tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_tenant_id_key" ON "tags"("slug", "tenant_id");

-- CreateIndex
CREATE INDEX "templates_tenant_id_idx" ON "templates"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "templates_name_tenant_id_deleted_at_key" ON "templates"("name", "tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "variants_tenant_id_idx" ON "variants"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "variants_sku_tenant_id_deleted_at_key" ON "variants"("sku", "tenant_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "variants_slug_tenant_id_deleted_at_key" ON "variants"("slug", "tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "volumes_tenant_id_idx" ON "volumes"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "volumes_code_tenant_id_key" ON "volumes"("code", "tenant_id");

-- CreateIndex
CREATE INDEX "warehouses_tenant_id_idx" ON "warehouses"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_tenant_id_deleted_at_key" ON "warehouses"("code", "tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "zones_tenant_id_idx" ON "zones"("tenant_id");

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manufacturers" ADD CONSTRAINT "manufacturers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bins" ADD CONSTRAINT "bins_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volumes" ADD CONSTRAINT "volumes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variants" ADD CONSTRAINT "variants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_movements" ADD CONSTRAINT "item_movements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_orders" ADD CONSTRAINT "sales_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

