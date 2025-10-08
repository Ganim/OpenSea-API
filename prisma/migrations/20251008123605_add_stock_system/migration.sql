-- CreateEnum
CREATE TYPE "public"."UnitOfMeasure" AS ENUM ('METERS', 'KILOGRAMS', 'UNITS');

-- CreateEnum
CREATE TYPE "public"."MovementType" AS ENUM ('SALE', 'PRODUCTION', 'SAMPLE', 'LOSS', 'TRANSFER', 'INVENTORY_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PRICE_CHANGE', 'STOCK_ADJUSTMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AuditEntity" AS ENUM ('USER', 'PRODUCT', 'VARIANT', 'ITEM', 'CATEGORY', 'SUPPLIER', 'MANUFACTURER', 'LOCATION', 'TEMPLATE', 'SESSION', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'DISCONTINUED', 'OUT_OF_STOCK');

-- CreateEnum
CREATE TYPE "public"."ItemStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'IN_TRANSIT', 'DAMAGED', 'EXPIRED', 'DISPOSED');

-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRING_SOON', 'EXPIRED', 'PRICE_CHANGE', 'REORDER_POINT');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('DRAFT', 'PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "public"."LocationType" AS ENUM ('WAREHOUSE', 'ZONE', 'AISLE', 'SHELF', 'BIN', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."CustomerType" AS ENUM ('INDIVIDUAL', 'BUSINESS');

-- CreateEnum
CREATE TYPE "public"."AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateTable
CREATE TABLE "public"."suppliers" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "cnpj" VARCHAR(18),
    "tax_id" VARCHAR(32),
    "contact" VARCHAR(128),
    "email" VARCHAR(254),
    "phone" VARCHAR(20),
    "website" VARCHAR(512),
    "address" VARCHAR(256),
    "city" VARCHAR(128),
    "state" VARCHAR(2),
    "zip_code" VARCHAR(10),
    "country" VARCHAR(64),
    "payment_terms" VARCHAR(256),
    "rating" DECIMAL(3,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."manufacturers" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "country" VARCHAR(64),
    "email" VARCHAR(254),
    "phone" VARCHAR(20),
    "website" VARCHAR(512),
    "address" VARCHAR(256),
    "city" VARCHAR(128),
    "state" VARCHAR(64),
    "zip_code" VARCHAR(10),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "rating" DECIMAL(3,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "manufacturers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."locations" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "description" VARCHAR(256),
    "location_type" "public"."LocationType",
    "parent_id" TEXT,
    "capacity" DECIMAL(10,3),
    "current_occupancy" DECIMAL(10,3) DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."templates" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "product_attributes" JSONB NOT NULL DEFAULT '{}',
    "variant_attributes" JSONB NOT NULL DEFAULT '{}',
    "item_attributes" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "description" TEXT,
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "unit_of_measure" "public"."UnitOfMeasure" NOT NULL,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "template_id" TEXT NOT NULL,
    "supplier_id" TEXT,
    "manufacturer_id" TEXT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."variants" (
    "id" TEXT NOT NULL,
    "sku" VARCHAR(64) NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "image_url" VARCHAR(512),
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "cost_price" DECIMAL(10,2),
    "profit_margin" DECIMAL(5,2),
    "barcode" VARCHAR(128),
    "qr_code" VARCHAR(512),
    "ean_code" VARCHAR(13),
    "upc_code" VARCHAR(12),
    "min_stock" DECIMAL(10,3),
    "max_stock" DECIMAL(10,3),
    "reorder_point" DECIMAL(10,3),
    "reorder_quantity" DECIMAL(10,3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "product_id" TEXT NOT NULL,

    CONSTRAINT "variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."items" (
    "id" TEXT NOT NULL,
    "unique_code" VARCHAR(128) NOT NULL,
    "initial_quantity" DECIMAL(10,3) NOT NULL,
    "current_quantity" DECIMAL(10,3) NOT NULL,
    "status" "public"."ItemStatus" NOT NULL DEFAULT 'AVAILABLE',
    "entry_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "batch_number" VARCHAR(64),
    "manufacturing_date" DATE,
    "expiry_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "variant_id" TEXT NOT NULL,
    "location_id" TEXT NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."item_movements" (
    "id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "quantity_before" DECIMAL(10,3),
    "quantity_after" DECIMAL(10,3),
    "movement_type" "public"."MovementType" NOT NULL,
    "reason_code" VARCHAR(64),
    "destination_ref" VARCHAR(128),
    "batch_number" VARCHAR(64),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "item_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "approved_by" TEXT,
    "sales_order_id" TEXT,

    CONSTRAINT "item_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_categories" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."variant_price_history" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "old_price" DECIMAL(10,2),
    "new_price" DECIMAL(10,2) NOT NULL,
    "reason" VARCHAR(256),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "variant_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "action" "public"."AuditAction" NOT NULL,
    "entity" "public"."AuditEntity" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "description" VARCHAR(512),
    "old_data" JSONB,
    "new_data" JSONB,
    "ip" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "user_id" TEXT,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tags" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "color" VARCHAR(7),
    "description" VARCHAR(256),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_tags" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."variant_images" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "url" VARCHAR(512) NOT NULL,
    "alt" VARCHAR(256),
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."alerts" (
    "id" TEXT NOT NULL,
    "type" "public"."AlertType" NOT NULL,
    "severity" "public"."AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "entity_id" TEXT NOT NULL,
    "message" VARCHAR(512) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_orders" (
    "id" TEXT NOT NULL,
    "order_number" VARCHAR(64) NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "total_cost" DECIMAL(10,2) NOT NULL,
    "expected_date" TIMESTAMP(3),
    "received_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "supplier_id" TEXT NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "total_cost" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."unit_conversions" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "fromUnit" VARCHAR(32) NOT NULL,
    "toUnit" VARCHAR(32) NOT NULL,
    "factor" DECIMAL(10,3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unit_conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stock_snapshots" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "location_id" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL,
    "total_value" DECIMAL(12,2) NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."customers" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "type" "public"."CustomerType" NOT NULL DEFAULT 'INDIVIDUAL',
    "document" VARCHAR(18),
    "email" VARCHAR(254),
    "phone" VARCHAR(20),
    "address" VARCHAR(256),
    "city" VARCHAR(128),
    "state" VARCHAR(2),
    "zip_code" VARCHAR(10),
    "country" VARCHAR(64),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales_orders" (
    "id" TEXT NOT NULL,
    "order_number" VARCHAR(64) NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "total_price" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) DEFAULT 0,
    "final_price" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "customer_id" TEXT NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sales_order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) DEFAULT 0,
    "total_price" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."item_reservations" (
    "id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "reason" VARCHAR(256),
    "reference" VARCHAR(128),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "item_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."variant_supplier_codes" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_supplier_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."variant_promotions" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "discount_type" "public"."DiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comments" (
    "id" TEXT NOT NULL,
    "entityType" VARCHAR(32) NOT NULL,
    "entityId" VARCHAR(36) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "alert_type" "public"."AlertType" NOT NULL,
    "channel" "public"."NotificationChannel" NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_cnpj_key" ON "public"."suppliers"("cnpj");

-- CreateIndex
CREATE INDEX "suppliers_is_active_idx" ON "public"."suppliers"("is_active");

-- CreateIndex
CREATE INDEX "suppliers_rating_idx" ON "public"."suppliers"("rating");

-- CreateIndex
CREATE INDEX "manufacturers_is_active_idx" ON "public"."manufacturers"("is_active");

-- CreateIndex
CREATE INDEX "manufacturers_rating_idx" ON "public"."manufacturers"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "locations_code_key" ON "public"."locations"("code");

-- CreateIndex
CREATE INDEX "locations_is_active_idx" ON "public"."locations"("is_active");

-- CreateIndex
CREATE INDEX "locations_location_type_idx" ON "public"."locations"("location_type");

-- CreateIndex
CREATE UNIQUE INDEX "templates_name_key" ON "public"."templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_code_key" ON "public"."products"("code");

-- CreateIndex
CREATE INDEX "products_template_id_idx" ON "public"."products"("template_id");

-- CreateIndex
CREATE INDEX "products_supplier_id_idx" ON "public"."products"("supplier_id");

-- CreateIndex
CREATE INDEX "products_manufacturer_id_idx" ON "public"."products"("manufacturer_id");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "public"."products"("status");

-- CreateIndex
CREATE INDEX "products_code_deleted_at_idx" ON "public"."products"("code", "deleted_at");

-- CreateIndex
CREATE INDEX "products_name_deleted_at_idx" ON "public"."products"("name", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "variants_sku_key" ON "public"."variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "variants_barcode_key" ON "public"."variants"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "variants_ean_code_key" ON "public"."variants"("ean_code");

-- CreateIndex
CREATE UNIQUE INDEX "variants_upc_code_key" ON "public"."variants"("upc_code");

-- CreateIndex
CREATE INDEX "variants_product_id_idx" ON "public"."variants"("product_id");

-- CreateIndex
CREATE INDEX "variants_barcode_idx" ON "public"."variants"("barcode");

-- CreateIndex
CREATE INDEX "variants_ean_code_idx" ON "public"."variants"("ean_code");

-- CreateIndex
CREATE INDEX "variants_upc_code_idx" ON "public"."variants"("upc_code");

-- CreateIndex
CREATE UNIQUE INDEX "items_unique_code_key" ON "public"."items"("unique_code");

-- CreateIndex
CREATE INDEX "items_variant_id_idx" ON "public"."items"("variant_id");

-- CreateIndex
CREATE INDEX "items_location_id_idx" ON "public"."items"("location_id");

-- CreateIndex
CREATE INDEX "items_batch_number_idx" ON "public"."items"("batch_number");

-- CreateIndex
CREATE INDEX "items_expiry_date_idx" ON "public"."items"("expiry_date");

-- CreateIndex
CREATE INDEX "items_status_idx" ON "public"."items"("status");

-- CreateIndex
CREATE INDEX "items_variant_id_location_id_idx" ON "public"."items"("variant_id", "location_id");

-- CreateIndex
CREATE INDEX "items_expiry_date_deleted_at_idx" ON "public"."items"("expiry_date", "deleted_at");

-- CreateIndex
CREATE INDEX "items_batch_number_variant_id_idx" ON "public"."items"("batch_number", "variant_id");

-- CreateIndex
CREATE INDEX "item_movements_item_id_idx" ON "public"."item_movements"("item_id");

-- CreateIndex
CREATE INDEX "item_movements_user_id_idx" ON "public"."item_movements"("user_id");

-- CreateIndex
CREATE INDEX "item_movements_approved_by_idx" ON "public"."item_movements"("approved_by");

-- CreateIndex
CREATE INDEX "item_movements_movement_type_idx" ON "public"."item_movements"("movement_type");

-- CreateIndex
CREATE INDEX "item_movements_batch_number_idx" ON "public"."item_movements"("batch_number");

-- CreateIndex
CREATE INDEX "item_movements_sales_order_id_idx" ON "public"."item_movements"("sales_order_id");

-- CreateIndex
CREATE INDEX "item_movements_item_id_created_at_idx" ON "public"."item_movements"("item_id", "created_at");

-- CreateIndex
CREATE INDEX "item_movements_user_id_movement_type_idx" ON "public"."item_movements"("user_id", "movement_type");

-- CreateIndex
CREATE INDEX "item_movements_created_at_idx" ON "public"."item_movements"("created_at" DESC);

-- CreateIndex
CREATE INDEX "product_categories_product_id_idx" ON "public"."product_categories"("product_id");

-- CreateIndex
CREATE INDEX "product_categories_category_id_idx" ON "public"."product_categories"("category_id");

-- CreateIndex
CREATE INDEX "product_categories_featured_idx" ON "public"."product_categories"("featured");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_product_id_category_id_key" ON "public"."product_categories"("product_id", "category_id");

-- CreateIndex
CREATE INDEX "variant_price_history_variant_id_idx" ON "public"."variant_price_history"("variant_id");

-- CreateIndex
CREATE INDEX "variant_price_history_user_id_idx" ON "public"."variant_price_history"("user_id");

-- CreateIndex
CREATE INDEX "variant_price_history_created_at_idx" ON "public"."variant_price_history"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "public"."audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "public"."audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_entity_id_idx" ON "public"."audit_logs"("entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "public"."audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_expires_at_idx" ON "public"."audit_logs"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "public"."tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "public"."tags"("slug");

-- CreateIndex
CREATE INDEX "tags_slug_idx" ON "public"."tags"("slug");

-- CreateIndex
CREATE INDEX "product_tags_product_id_idx" ON "public"."product_tags"("product_id");

-- CreateIndex
CREATE INDEX "product_tags_tag_id_idx" ON "public"."product_tags"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_tags_product_id_tag_id_key" ON "public"."product_tags"("product_id", "tag_id");

-- CreateIndex
CREATE INDEX "variant_images_variant_id_idx" ON "public"."variant_images"("variant_id");

-- CreateIndex
CREATE INDEX "variant_images_is_primary_idx" ON "public"."variant_images"("is_primary");

-- CreateIndex
CREATE INDEX "variant_images_variant_id_order_idx" ON "public"."variant_images"("variant_id", "order");

-- CreateIndex
CREATE INDEX "alerts_user_id_idx" ON "public"."alerts"("user_id");

-- CreateIndex
CREATE INDEX "alerts_is_read_idx" ON "public"."alerts"("is_read");

-- CreateIndex
CREATE INDEX "alerts_type_idx" ON "public"."alerts"("type");

-- CreateIndex
CREATE INDEX "alerts_entity_id_idx" ON "public"."alerts"("entity_id");

-- CreateIndex
CREATE INDEX "alerts_severity_idx" ON "public"."alerts"("severity");

-- CreateIndex
CREATE INDEX "alerts_user_id_is_read_idx" ON "public"."alerts"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "alerts_user_id_severity_is_read_idx" ON "public"."alerts"("user_id", "severity", "is_read");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_order_number_key" ON "public"."purchase_orders"("order_number");

-- CreateIndex
CREATE INDEX "purchase_orders_supplier_id_idx" ON "public"."purchase_orders"("supplier_id");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "public"."purchase_orders"("status");

-- CreateIndex
CREATE INDEX "purchase_orders_order_number_idx" ON "public"."purchase_orders"("order_number");

-- CreateIndex
CREATE INDEX "purchase_orders_expected_date_idx" ON "public"."purchase_orders"("expected_date");

-- CreateIndex
CREATE INDEX "purchase_orders_created_by_idx" ON "public"."purchase_orders"("created_by");

-- CreateIndex
CREATE INDEX "purchase_order_items_order_id_idx" ON "public"."purchase_order_items"("order_id");

-- CreateIndex
CREATE INDEX "purchase_order_items_variant_id_idx" ON "public"."purchase_order_items"("variant_id");

-- CreateIndex
CREATE INDEX "unit_conversions_variant_id_idx" ON "public"."unit_conversions"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "unit_conversions_variant_id_fromUnit_toUnit_key" ON "public"."unit_conversions"("variant_id", "fromUnit", "toUnit");

-- CreateIndex
CREATE INDEX "stock_snapshots_variant_id_idx" ON "public"."stock_snapshots"("variant_id");

-- CreateIndex
CREATE INDEX "stock_snapshots_location_id_idx" ON "public"."stock_snapshots"("location_id");

-- CreateIndex
CREATE INDEX "stock_snapshots_snapshot_date_idx" ON "public"."stock_snapshots"("snapshot_date");

-- CreateIndex
CREATE INDEX "stock_snapshots_variant_id_snapshot_date_idx" ON "public"."stock_snapshots"("variant_id", "snapshot_date");

-- CreateIndex
CREATE UNIQUE INDEX "customers_document_key" ON "public"."customers"("document");

-- CreateIndex
CREATE INDEX "customers_document_idx" ON "public"."customers"("document");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "public"."customers"("email");

-- CreateIndex
CREATE INDEX "customers_is_active_idx" ON "public"."customers"("is_active");

-- CreateIndex
CREATE INDEX "customers_type_idx" ON "public"."customers"("type");

-- CreateIndex
CREATE UNIQUE INDEX "sales_orders_order_number_key" ON "public"."sales_orders"("order_number");

-- CreateIndex
CREATE INDEX "sales_orders_customer_id_idx" ON "public"."sales_orders"("customer_id");

-- CreateIndex
CREATE INDEX "sales_orders_status_idx" ON "public"."sales_orders"("status");

-- CreateIndex
CREATE INDEX "sales_orders_order_number_idx" ON "public"."sales_orders"("order_number");

-- CreateIndex
CREATE INDEX "sales_orders_created_by_idx" ON "public"."sales_orders"("created_by");

-- CreateIndex
CREATE INDEX "sales_orders_created_at_idx" ON "public"."sales_orders"("created_at");

-- CreateIndex
CREATE INDEX "sales_order_items_order_id_idx" ON "public"."sales_order_items"("order_id");

-- CreateIndex
CREATE INDEX "sales_order_items_variant_id_idx" ON "public"."sales_order_items"("variant_id");

-- CreateIndex
CREATE INDEX "item_reservations_item_id_idx" ON "public"."item_reservations"("item_id");

-- CreateIndex
CREATE INDEX "item_reservations_user_id_idx" ON "public"."item_reservations"("user_id");

-- CreateIndex
CREATE INDEX "item_reservations_expires_at_idx" ON "public"."item_reservations"("expires_at");

-- CreateIndex
CREATE INDEX "item_reservations_item_id_expires_at_idx" ON "public"."item_reservations"("item_id", "expires_at");

-- CreateIndex
CREATE INDEX "variant_supplier_codes_variant_id_idx" ON "public"."variant_supplier_codes"("variant_id");

-- CreateIndex
CREATE INDEX "variant_supplier_codes_supplier_id_idx" ON "public"."variant_supplier_codes"("supplier_id");

-- CreateIndex
CREATE INDEX "variant_supplier_codes_code_idx" ON "public"."variant_supplier_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "variant_supplier_codes_variant_id_supplier_id_key" ON "public"."variant_supplier_codes"("variant_id", "supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "variant_supplier_codes_supplier_id_code_key" ON "public"."variant_supplier_codes"("supplier_id", "code");

-- CreateIndex
CREATE INDEX "variant_promotions_variant_id_idx" ON "public"."variant_promotions"("variant_id");

-- CreateIndex
CREATE INDEX "variant_promotions_is_active_idx" ON "public"."variant_promotions"("is_active");

-- CreateIndex
CREATE INDEX "variant_promotions_start_date_end_date_idx" ON "public"."variant_promotions"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "variant_promotions_variant_id_start_date_end_date_idx" ON "public"."variant_promotions"("variant_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "comments_user_id_idx" ON "public"."comments"("user_id");

-- CreateIndex
CREATE INDEX "comments_entityType_entityId_idx" ON "public"."comments"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "comments_created_at_idx" ON "public"."comments"("created_at");

-- CreateIndex
CREATE INDEX "notification_preferences_user_id_idx" ON "public"."notification_preferences"("user_id");

-- CreateIndex
CREATE INDEX "notification_preferences_alert_type_idx" ON "public"."notification_preferences"("alert_type");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_user_id_alert_type_channel_key" ON "public"."notification_preferences"("user_id", "alert_type", "channel");

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."locations" ADD CONSTRAINT "locations_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variants" ADD CONSTRAINT "variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."items" ADD CONSTRAINT "items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."items" ADD CONSTRAINT "items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_movements" ADD CONSTRAINT "item_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_movements" ADD CONSTRAINT "item_movements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_movements" ADD CONSTRAINT "item_movements_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_movements" ADD CONSTRAINT "item_movements_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_categories" ADD CONSTRAINT "product_categories_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_categories" ADD CONSTRAINT "product_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variant_price_history" ADD CONSTRAINT "variant_price_history_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variant_price_history" ADD CONSTRAINT "variant_price_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_tags" ADD CONSTRAINT "product_tags_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_tags" ADD CONSTRAINT "product_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variant_images" ADD CONSTRAINT "variant_images_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_order_items" ADD CONSTRAINT "purchase_order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."unit_conversions" ADD CONSTRAINT "unit_conversions_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_snapshots" ADD CONSTRAINT "stock_snapshots_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_snapshots" ADD CONSTRAINT "stock_snapshots_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_orders" ADD CONSTRAINT "sales_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_orders" ADD CONSTRAINT "sales_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_order_items" ADD CONSTRAINT "sales_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."sales_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sales_order_items" ADD CONSTRAINT "sales_order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_reservations" ADD CONSTRAINT "item_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_reservations" ADD CONSTRAINT "item_reservations_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variant_supplier_codes" ADD CONSTRAINT "variant_supplier_codes_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variant_supplier_codes" ADD CONSTRAINT "variant_supplier_codes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."variant_promotions" ADD CONSTRAINT "variant_promotions_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
