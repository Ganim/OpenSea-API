-- CreateEnum
CREATE TYPE "ContactRole" AS ENUM ('DECISION_MAKER', 'INFLUENCER', 'CHAMPION', 'GATEKEEPER', 'END_USER', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactLifecycleStage" AS ENUM ('SUBSCRIBER', 'LEAD', 'QUALIFIED', 'OPPORTUNITY', 'CUSTOMER', 'EVANGELIST');

-- CreateEnum
CREATE TYPE "PipelineType" AS ENUM ('SALES', 'ONBOARDING', 'SUPPORT', 'CUSTOM', 'ORDER_B2C', 'ORDER_B2B', 'ORDER_BID', 'ORDER_ECOMMERCE');

-- CreateEnum
CREATE TYPE "PipelineStageType" AS ENUM ('OPEN', 'WON', 'LOST', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 'INVOICED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PriceTableType" AS ENUM ('DEFAULT', 'RETAIL', 'WHOLESALE', 'REGIONAL', 'CHANNEL', 'CUSTOMER', 'BID');

-- CreateEnum
CREATE TYPE "PriceTableRuleType" AS ENUM ('CUSTOMER_TYPE', 'REGION', 'CHANNEL', 'CUSTOMER_TAG', 'MIN_QUANTITY');

-- CreateEnum
CREATE TYPE "RuleOperator" AS ENUM ('EQUALS', 'IN', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN');

-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('ICMS', 'IPI', 'PIS', 'COFINS', 'ISS', 'ICMS_ST');

-- CreateEnum
CREATE TYPE "StBaseCalculation" AS ENUM ('MVA', 'PAUTA');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('PERCENTAGE', 'FIXED_VALUE', 'BUY_X_GET_Y', 'BUY_X_GET_DISCOUNT', 'FREE_SHIPPING', 'BUNDLE_PRICE');

-- CreateEnum
CREATE TYPE "CampaignStatusEnum" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'ENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CampaignRuleType" AS ENUM ('MIN_QUANTITY', 'MIN_VALUE', 'PRODUCT_CATEGORY', 'CUSTOMER_TAG', 'CUSTOMER_TYPE', 'FIRST_PURCHASE', 'DAY_OF_WEEK', 'TIME_RANGE');

-- CreateEnum
CREATE TYPE "CampaignDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_VALUE', 'FIXED_PRICE', 'FREE');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED_VALUE', 'FREE_SHIPPING');

-- CreateEnum
CREATE TYPE "CouponApplicableTo" AS ENUM ('ALL', 'SPECIFIC_PRODUCTS', 'SPECIFIC_CATEGORIES', 'SPECIFIC_CUSTOMERS');

-- CreateEnum
CREATE TYPE "ComboType" AS ENUM ('FIXED', 'DYNAMIC');

-- CreateEnum
CREATE TYPE "ComboDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_VALUE');

-- CreateTable
CREATE TABLE "crm_contacts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100),
    "full_name" VARCHAR(201) NOT NULL,
    "email" VARCHAR(254),
    "phone" VARCHAR(30),
    "whatsapp" VARCHAR(30),
    "role" "ContactRole" NOT NULL DEFAULT 'OTHER',
    "job_title" VARCHAR(150),
    "department" VARCHAR(150),
    "lifecycle_stage" "ContactLifecycleStage" NOT NULL DEFAULT 'LEAD',
    "lead_score" INTEGER NOT NULL DEFAULT 0,
    "lead_temperature" VARCHAR(50),
    "source" VARCHAR(100) NOT NULL DEFAULT 'MANUAL',
    "last_interaction_at" TIMESTAMP(3),
    "last_channel_used" VARCHAR(50),
    "social_profiles" JSONB,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "custom_fields" JSONB,
    "avatar_url" VARCHAR(500),
    "assigned_to_user_id" TEXT,
    "is_main_contact" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_pipelines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" VARCHAR(500),
    "icon" VARCHAR(50),
    "color" VARCHAR(30),
    "type" "PipelineType" NOT NULL DEFAULT 'SALES',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "next_pipeline_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_pipeline_stages" (
    "id" TEXT NOT NULL,
    "pipeline_id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "color" VARCHAR(30),
    "icon" VARCHAR(50),
    "position" INTEGER NOT NULL DEFAULT 0,
    "type" "PipelineStageType" NOT NULL DEFAULT 'OPEN',
    "probability" DOUBLE PRECISION,
    "auto_actions" JSONB,
    "rotten_after_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_pipeline_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_tables" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" VARCHAR(500),
    "type" "PriceTableType" NOT NULL DEFAULT 'DEFAULT',
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "price_includes_tax" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_table_rules" (
    "id" TEXT NOT NULL,
    "price_table_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ruleType" "PriceTableRuleType" NOT NULL,
    "operator" "RuleOperator" NOT NULL,
    "value" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_table_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_table_items" (
    "id" TEXT NOT NULL,
    "price_table_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "min_quantity" INTEGER NOT NULL DEFAULT 1,
    "max_quantity" INTEGER,
    "cost_price" DECIMAL(10,2),
    "margin_percent" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_table_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_prices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "notes" VARCHAR(500),
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "regime" "TaxRegimeEnum" NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_rules" (
    "id" TEXT NOT NULL,
    "tax_profile_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "taxType" "TaxType" NOT NULL,
    "ncm" VARCHAR(10),
    "cfop" VARCHAR(6),
    "origin_state" VARCHAR(2),
    "destination_state" VARCHAR(2),
    "rate" DECIMAL(5,2) NOT NULL,
    "reduction" DECIMAL(5,2) DEFAULT 0,
    "is_exempt" BOOLEAN NOT NULL DEFAULT false,
    "mva_percent" DECIMAL(5,2),
    "st_base_method" "StBaseCalculation",
    "pauta_value" DECIMAL(10,2),
    "st_rate" DECIMAL(5,2),
    "notes" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" VARCHAR(500),
    "type" "CampaignType" NOT NULL,
    "status" "CampaignStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_audience" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "stackable" BOOLEAN NOT NULL DEFAULT false,
    "max_usage_total" INTEGER,
    "max_usage_per_customer" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "ai_reason" VARCHAR(500),
    "created_by_user_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_rules" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ruleType" "CampaignRuleType" NOT NULL,
    "operator" "RuleOperator" NOT NULL,
    "value" VARCHAR(500) NOT NULL,
    "value2" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_products" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "category_id" TEXT,
    "discount_type" "CampaignDiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "max_discount" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "campaign_id" TEXT,
    "code" VARCHAR(64) NOT NULL,
    "type" "CouponType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "min_order_value" DECIMAL(10,2),
    "max_discount" DECIMAL(10,2),
    "max_usage_total" INTEGER,
    "max_usage_per_customer" INTEGER NOT NULL DEFAULT 1,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "applicable_to" "CouponApplicableTo" NOT NULL DEFAULT 'ALL',
    "target_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "ai_reason" VARCHAR(500),
    "customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_usages" (
    "id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "order_id" TEXT,
    "discount_applied" DECIMAL(10,2) NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" VARCHAR(500),
    "type" "ComboType" NOT NULL DEFAULT 'FIXED',
    "fixed_price" DECIMAL(10,2),
    "discount_type" "ComboDiscountType",
    "discount_value" DECIMAL(10,2),
    "min_items" INTEGER,
    "max_items" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "image_url" VARCHAR(512),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "combos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "combo_items" (
    "id" TEXT NOT NULL,
    "combo_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "category_id" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combo_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_contacts_tenant_id_idx" ON "crm_contacts"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_contacts_customer_id_idx" ON "crm_contacts"("customer_id");

-- CreateIndex
CREATE INDEX "crm_contacts_assigned_to_user_id_idx" ON "crm_contacts"("assigned_to_user_id");

-- CreateIndex
CREATE INDEX "crm_contacts_lifecycle_stage_idx" ON "crm_contacts"("lifecycle_stage");

-- CreateIndex
CREATE INDEX "crm_contacts_tenant_id_deleted_at_idx" ON "crm_contacts"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "crm_pipelines_tenant_id_idx" ON "crm_pipelines"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_pipelines_tenant_id_deleted_at_idx" ON "crm_pipelines"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "crm_pipelines_is_active_idx" ON "crm_pipelines"("is_active");

-- CreateIndex
CREATE INDEX "crm_pipeline_stages_pipeline_id_idx" ON "crm_pipeline_stages"("pipeline_id");

-- CreateIndex
CREATE INDEX "crm_pipeline_stages_pipeline_id_position_idx" ON "crm_pipeline_stages"("pipeline_id", "position");

-- CreateIndex
CREATE INDEX "price_tables_tenant_id_idx" ON "price_tables"("tenant_id");

-- CreateIndex
CREATE INDEX "price_tables_tenant_id_type_idx" ON "price_tables"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "price_tables_tenant_id_is_active_idx" ON "price_tables"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "price_table_rules_price_table_id_idx" ON "price_table_rules"("price_table_id");

-- CreateIndex
CREATE INDEX "price_table_rules_tenant_id_idx" ON "price_table_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "price_table_items_tenant_id_idx" ON "price_table_items"("tenant_id");

-- CreateIndex
CREATE INDEX "price_table_items_price_table_id_variant_id_idx" ON "price_table_items"("price_table_id", "variant_id");

-- CreateIndex
CREATE INDEX "price_table_items_price_table_id_variant_id_min_quantity_idx" ON "price_table_items"("price_table_id", "variant_id", "min_quantity");

-- CreateIndex
CREATE UNIQUE INDEX "price_table_items_price_table_id_variant_id_min_quantity_key" ON "price_table_items"("price_table_id", "variant_id", "min_quantity");

-- CreateIndex
CREATE INDEX "customer_prices_tenant_id_idx" ON "customer_prices"("tenant_id");

-- CreateIndex
CREATE INDEX "customer_prices_tenant_id_customer_id_idx" ON "customer_prices"("tenant_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_prices_tenant_id_customer_id_variant_id_key" ON "customer_prices"("tenant_id", "customer_id", "variant_id");

-- CreateIndex
CREATE INDEX "tax_profiles_tenant_id_idx" ON "tax_profiles"("tenant_id");

-- CreateIndex
CREATE INDEX "tax_rules_tax_profile_id_idx" ON "tax_rules"("tax_profile_id");

-- CreateIndex
CREATE INDEX "tax_rules_tenant_id_idx" ON "tax_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "tax_rules_tax_profile_id_taxType_idx" ON "tax_rules"("tax_profile_id", "taxType");

-- CreateIndex
CREATE INDEX "tax_rules_tax_profile_id_ncm_idx" ON "tax_rules"("tax_profile_id", "ncm");

-- CreateIndex
CREATE INDEX "campaigns_tenant_id_idx" ON "campaigns"("tenant_id");

-- CreateIndex
CREATE INDEX "campaigns_tenant_id_status_idx" ON "campaigns"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "campaigns_tenant_id_start_date_end_date_idx" ON "campaigns"("tenant_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "campaign_rules_campaign_id_idx" ON "campaign_rules"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_rules_tenant_id_idx" ON "campaign_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "campaign_products_campaign_id_idx" ON "campaign_products"("campaign_id");

-- CreateIndex
CREATE INDEX "campaign_products_tenant_id_idx" ON "campaign_products"("tenant_id");

-- CreateIndex
CREATE INDEX "campaign_products_campaign_id_variant_id_idx" ON "campaign_products"("campaign_id", "variant_id");

-- CreateIndex
CREATE INDEX "coupons_tenant_id_idx" ON "coupons"("tenant_id");

-- CreateIndex
CREATE INDEX "coupons_tenant_id_is_active_valid_from_valid_until_idx" ON "coupons"("tenant_id", "is_active", "valid_from", "valid_until");

-- CreateIndex
CREATE INDEX "coupons_tenant_id_customer_id_idx" ON "coupons"("tenant_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_tenant_id_code_key" ON "coupons"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "coupon_usages_coupon_id_idx" ON "coupon_usages"("coupon_id");

-- CreateIndex
CREATE INDEX "coupon_usages_tenant_id_idx" ON "coupon_usages"("tenant_id");

-- CreateIndex
CREATE INDEX "coupon_usages_coupon_id_customer_id_idx" ON "coupon_usages"("coupon_id", "customer_id");

-- CreateIndex
CREATE INDEX "combos_tenant_id_idx" ON "combos"("tenant_id");

-- CreateIndex
CREATE INDEX "combos_tenant_id_is_active_idx" ON "combos"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "combo_items_combo_id_idx" ON "combo_items"("combo_id");

-- CreateIndex
CREATE INDEX "combo_items_tenant_id_idx" ON "combo_items"("tenant_id");

-- CreateIndex
CREATE INDEX "board_members_user_id_idx" ON "board_members"("user_id");

-- AddForeignKey
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_contacts" ADD CONSTRAINT "crm_contacts_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_pipelines" ADD CONSTRAINT "crm_pipelines_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_pipeline_stages" ADD CONSTRAINT "crm_pipeline_stages_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "crm_pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_tables" ADD CONSTRAINT "price_tables_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_table_rules" ADD CONSTRAINT "price_table_rules_price_table_id_fkey" FOREIGN KEY ("price_table_id") REFERENCES "price_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_table_items" ADD CONSTRAINT "price_table_items_price_table_id_fkey" FOREIGN KEY ("price_table_id") REFERENCES "price_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_table_items" ADD CONSTRAINT "price_table_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_prices" ADD CONSTRAINT "customer_prices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_prices" ADD CONSTRAINT "customer_prices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_prices" ADD CONSTRAINT "customer_prices_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_prices" ADD CONSTRAINT "customer_prices_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_profiles" ADD CONSTRAINT "tax_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_rules" ADD CONSTRAINT "tax_rules_tax_profile_id_fkey" FOREIGN KEY ("tax_profile_id") REFERENCES "tax_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_rules" ADD CONSTRAINT "campaign_rules_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_products" ADD CONSTRAINT "campaign_products_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_products" ADD CONSTRAINT "campaign_products_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_products" ADD CONSTRAINT "campaign_products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combos" ADD CONSTRAINT "combos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_items" ADD CONSTRAINT "combo_items_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "combos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_items" ADD CONSTRAINT "combo_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_items" ADD CONSTRAINT "combo_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
