-- CreateTable
CREATE TABLE "finance_code_sequences" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "last_value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "finance_code_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "finance_code_sequences_tenant_id_prefix_key" ON "finance_code_sequences"("tenant_id", "prefix");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "categories_tenant_id_deleted_at_idx" ON "categories"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "items_tenant_id_status_idx" ON "items"("tenant_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "manufacturers_tenant_id_deleted_at_idx" ON "manufacturers"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "products_tenant_id_status_idx" ON "products"("tenant_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "suppliers_tenant_id_deleted_at_idx" ON "suppliers"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "variants_tenant_id_deleted_at_idx" ON "variants"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "variants_tenant_id_product_id_deleted_at_idx" ON "variants"("tenant_id", "product_id", "deleted_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "volumes_tenant_id_status_idx" ON "volumes"("tenant_id", "status");
