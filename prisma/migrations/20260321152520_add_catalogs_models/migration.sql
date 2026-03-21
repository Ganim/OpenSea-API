-- CreateEnum
CREATE TYPE "CatalogType" AS ENUM ('GENERAL', 'SELLER', 'CAMPAIGN', 'CUSTOMER', 'AI_GENERATED');

-- CreateEnum
CREATE TYPE "CatalogStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CatalogLayout" AS ENUM ('GRID', 'LIST', 'MAGAZINE');

-- CreateEnum
CREATE TYPE "CatalogExportType" AS ENUM ('PDF_FOLDER', 'PDF_PRICE_LIST', 'IMAGE_GRID', 'SHAREABLE_LINK');

-- CreateEnum
CREATE TYPE "CatalogExportStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ContentTemplateType" AS ENUM ('FOLDER_PAGE', 'SOCIAL_POST', 'SOCIAL_STORY', 'SOCIAL_REEL', 'EMAIL_CAMPAIGN', 'EMAIL_NEWSLETTER', 'BANNER', 'PRICE_LIST', 'PRODUCT_CARD', 'MOCKUP');

-- CreateEnum
CREATE TYPE "ContentChannel" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'WHATSAPP', 'EMAIL', 'PRINT', 'WEB');

-- CreateEnum
CREATE TYPE "GeneratedContentType" AS ENUM ('SOCIAL_POST', 'SOCIAL_STORY', 'SOCIAL_REEL', 'FOLDER_PAGE', 'EMAIL_CAMPAIGN', 'BANNER', 'PRODUCT_CARD', 'VIDEO', 'MOCKUP');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'READY', 'APPROVED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MockupResultStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "EmailCampaignType" AS ENUM ('NEWSLETTER', 'PROMOTION', 'PRODUCT_LAUNCH', 'FOLLOW_UP', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EmailCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmailRecipientType" AS ENUM ('ALL_CONTACTS', 'CUSTOMER_TAG', 'LIFECYCLE_STAGE', 'SPECIFIC_CONTACTS', 'SEGMENT');

-- CreateEnum
CREATE TYPE "InventorySessionStatus" AS ENUM ('OPEN', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InventorySessionMode" AS ENUM ('BIN', 'ZONE', 'PRODUCT');

-- CreateEnum
CREATE TYPE "InventorySessionItemStatus" AS ENUM ('PENDING', 'CONFIRMED', 'MISSING', 'WRONG_BIN', 'EXTRA');

-- CreateEnum
CREATE TYPE "DivergenceResolution" AS ENUM ('LOSS_REGISTERED', 'TRANSFERRED', 'ENTRY_CREATED', 'PENDING_REVIEW');

-- CreateTable
CREATE TABLE "inventory_sessions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "InventorySessionStatus" NOT NULL DEFAULT 'OPEN',
    "mode" "InventorySessionMode" NOT NULL,
    "bin_id" TEXT,
    "zone_id" TEXT,
    "product_id" TEXT,
    "variant_id" TEXT,
    "total_items" INTEGER NOT NULL DEFAULT 0,
    "scanned_items" INTEGER NOT NULL DEFAULT 0,
    "confirmed_items" INTEGER NOT NULL DEFAULT 0,
    "divergent_items" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_session_items" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "expected_bin_id" TEXT,
    "actual_bin_id" TEXT,
    "status" "InventorySessionItemStatus" NOT NULL DEFAULT 'PENDING',
    "scanned_at" TIMESTAMP(3),
    "resolution" "DivergenceResolution",
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_session_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "type" "CatalogType" NOT NULL,
    "status" "CatalogStatus" NOT NULL DEFAULT 'DRAFT',
    "cover_image_file_id" TEXT,
    "assigned_to_user_id" TEXT,
    "customer_id" TEXT,
    "campaign_id" TEXT,
    "rules" JSONB,
    "ai_curated" BOOLEAN NOT NULL DEFAULT false,
    "ai_curation_config" JSONB,
    "layout" "CatalogLayout" NOT NULL DEFAULT 'GRID',
    "show_prices" BOOLEAN NOT NULL DEFAULT true,
    "show_stock" BOOLEAN NOT NULL DEFAULT false,
    "price_table_id" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "slug" VARCHAR(128),
    "public_url" VARCHAR(500),
    "qr_code_url" VARCHAR(500),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "catalog_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "custom_note" TEXT,
    "added_by_ai" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_exports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "catalog_id" TEXT NOT NULL,
    "type" "CatalogExportType" NOT NULL,
    "status" "CatalogExportStatus" NOT NULL DEFAULT 'PENDING',
    "file_id" TEXT,
    "template_id" TEXT,
    "generated_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "page_count" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalog_exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_brands" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(64) NOT NULL DEFAULT 'default',
    "logo_file_id" TEXT,
    "logo_icon_file_id" TEXT,
    "primary_color" VARCHAR(16) NOT NULL DEFAULT '#4F46E5',
    "secondary_color" VARCHAR(16) NOT NULL DEFAULT '#0F172A',
    "accent_color" VARCHAR(16) NOT NULL DEFAULT '#F59E0B',
    "background_color" VARCHAR(16) NOT NULL DEFAULT '#FFFFFF',
    "text_color" VARCHAR(16) NOT NULL DEFAULT '#1E293B',
    "font_family" VARCHAR(64) NOT NULL DEFAULT 'Inter',
    "font_heading" VARCHAR(64),
    "tagline" VARCHAR(256),
    "social_links" JSONB,
    "contact_info" JSONB,
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "type" "ContentTemplateType" NOT NULL,
    "channel" "ContentChannel",
    "dimensions" JSONB NOT NULL,
    "layout" JSONB NOT NULL,
    "preview_file_id" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_contents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "GeneratedContentType" NOT NULL,
    "channel" "ContentChannel",
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "title" VARCHAR(256),
    "caption" TEXT,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "template_id" TEXT,
    "brand_id" TEXT,
    "file_id" TEXT,
    "thumbnail_file_id" TEXT,
    "variant_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "campaign_id" TEXT,
    "catalog_id" TEXT,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "ai_prompt" TEXT,
    "ai_model" VARCHAR(64),
    "published_at" TIMESTAMP(3),
    "published_to" VARCHAR(256),
    "scheduled_at" TIMESTAMP(3),
    "approved_by_user_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "engagement" DECIMAL(5,2),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_mockups" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "client_logo_file_id" TEXT,
    "client_brand_name" VARCHAR(128),
    "customization" JSONB NOT NULL,
    "mockup_template_id" TEXT,
    "result_file_id" TEXT,
    "result_status" "MockupResultStatus" NOT NULL DEFAULT 'PENDING',
    "generated_at" TIMESTAMP(3),
    "bid_id" TEXT,
    "order_id" TEXT,
    "proposal_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_mockups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_campaigns" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "type" "EmailCampaignType" NOT NULL,
    "status" "EmailCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "subject" VARCHAR(256) NOT NULL,
    "preview_text" VARCHAR(256),
    "content" TEXT NOT NULL,
    "template_id" TEXT,
    "brand_id" TEXT,
    "recipient_type" "EmailRecipientType" NOT NULL,
    "recipient_filter" JSONB,
    "recipient_count" INTEGER NOT NULL DEFAULT 0,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "variant_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "campaign_id" TEXT,
    "catalog_id" TEXT,
    "ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "ai_prompt" TEXT,
    "total_sent" INTEGER NOT NULL DEFAULT 0,
    "total_opened" INTEGER NOT NULL DEFAULT 0,
    "total_clicked" INTEGER NOT NULL DEFAULT 0,
    "total_bounced" INTEGER NOT NULL DEFAULT 0,
    "total_unsubscribed" INTEGER NOT NULL DEFAULT 0,
    "open_rate" DECIMAL(5,2),
    "click_rate" DECIMAL(5,2),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_sessions_tenant_id_idx" ON "inventory_sessions"("tenant_id");

-- CreateIndex
CREATE INDEX "inventory_sessions_tenant_id_status_idx" ON "inventory_sessions"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "inventory_sessions_tenant_id_mode_idx" ON "inventory_sessions"("tenant_id", "mode");

-- CreateIndex
CREATE INDEX "inventory_sessions_user_id_idx" ON "inventory_sessions"("user_id");

-- CreateIndex
CREATE INDEX "inventory_sessions_bin_id_idx" ON "inventory_sessions"("bin_id");

-- CreateIndex
CREATE INDEX "inventory_sessions_zone_id_idx" ON "inventory_sessions"("zone_id");

-- CreateIndex
CREATE INDEX "inventory_sessions_product_id_idx" ON "inventory_sessions"("product_id");

-- CreateIndex
CREATE INDEX "inventory_sessions_variant_id_idx" ON "inventory_sessions"("variant_id");

-- CreateIndex
CREATE INDEX "inventory_session_items_session_id_idx" ON "inventory_session_items"("session_id");

-- CreateIndex
CREATE INDEX "inventory_session_items_item_id_idx" ON "inventory_session_items"("item_id");

-- CreateIndex
CREATE INDEX "inventory_session_items_session_id_item_id_idx" ON "inventory_session_items"("session_id", "item_id");

-- CreateIndex
CREATE INDEX "inventory_session_items_session_id_status_idx" ON "inventory_session_items"("session_id", "status");

-- CreateIndex
CREATE INDEX "catalogs_tenant_id_idx" ON "catalogs"("tenant_id");

-- CreateIndex
CREATE INDEX "catalogs_tenant_id_type_idx" ON "catalogs"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "catalogs_tenant_id_assigned_to_user_id_idx" ON "catalogs"("tenant_id", "assigned_to_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "catalogs_tenant_id_slug_key" ON "catalogs"("tenant_id", "slug");

-- CreateIndex
CREATE INDEX "catalog_items_catalog_id_idx" ON "catalog_items"("catalog_id");

-- CreateIndex
CREATE INDEX "catalog_items_tenant_id_idx" ON "catalog_items"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "catalog_items_catalog_id_variant_id_key" ON "catalog_items"("catalog_id", "variant_id");

-- CreateIndex
CREATE INDEX "catalog_exports_catalog_id_idx" ON "catalog_exports"("catalog_id");

-- CreateIndex
CREATE INDEX "catalog_exports_tenant_id_idx" ON "catalog_exports"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_brands_tenant_id_idx" ON "tenant_brands"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_brands_tenant_id_name_key" ON "tenant_brands"("tenant_id", "name");

-- CreateIndex
CREATE INDEX "content_templates_tenant_id_idx" ON "content_templates"("tenant_id");

-- CreateIndex
CREATE INDEX "content_templates_type_idx" ON "content_templates"("type");

-- CreateIndex
CREATE INDEX "content_templates_type_channel_idx" ON "content_templates"("type", "channel");

-- CreateIndex
CREATE INDEX "generated_contents_tenant_id_idx" ON "generated_contents"("tenant_id");

-- CreateIndex
CREATE INDEX "generated_contents_tenant_id_type_idx" ON "generated_contents"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "generated_contents_tenant_id_status_idx" ON "generated_contents"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "generated_contents_tenant_id_channel_idx" ON "generated_contents"("tenant_id", "channel");

-- CreateIndex
CREATE INDEX "product_mockups_tenant_id_idx" ON "product_mockups"("tenant_id");

-- CreateIndex
CREATE INDEX "product_mockups_tenant_id_variant_id_idx" ON "product_mockups"("tenant_id", "variant_id");

-- CreateIndex
CREATE INDEX "product_mockups_bid_id_idx" ON "product_mockups"("bid_id");

-- CreateIndex
CREATE INDEX "product_mockups_order_id_idx" ON "product_mockups"("order_id");

-- CreateIndex
CREATE INDEX "email_campaigns_tenant_id_idx" ON "email_campaigns"("tenant_id");

-- CreateIndex
CREATE INDEX "email_campaigns_tenant_id_status_idx" ON "email_campaigns"("tenant_id", "status");

-- AddForeignKey
ALTER TABLE "inventory_sessions" ADD CONSTRAINT "inventory_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_sessions" ADD CONSTRAINT "inventory_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_sessions" ADD CONSTRAINT "inventory_sessions_bin_id_fkey" FOREIGN KEY ("bin_id") REFERENCES "bins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_sessions" ADD CONSTRAINT "inventory_sessions_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_sessions" ADD CONSTRAINT "inventory_sessions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_sessions" ADD CONSTRAINT "inventory_sessions_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_session_items" ADD CONSTRAINT "inventory_session_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "inventory_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_session_items" ADD CONSTRAINT "inventory_session_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_session_items" ADD CONSTRAINT "inventory_session_items_expected_bin_id_fkey" FOREIGN KEY ("expected_bin_id") REFERENCES "bins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_session_items" ADD CONSTRAINT "inventory_session_items_actual_bin_id_fkey" FOREIGN KEY ("actual_bin_id") REFERENCES "bins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_session_items" ADD CONSTRAINT "inventory_session_items_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogs" ADD CONSTRAINT "catalogs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogs" ADD CONSTRAINT "catalogs_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogs" ADD CONSTRAINT "catalogs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogs" ADD CONSTRAINT "catalogs_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogs" ADD CONSTRAINT "catalogs_cover_image_file_id_fkey" FOREIGN KEY ("cover_image_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalogs" ADD CONSTRAINT "catalogs_price_table_id_fkey" FOREIGN KEY ("price_table_id") REFERENCES "price_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_items" ADD CONSTRAINT "catalog_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_exports" ADD CONSTRAINT "catalog_exports_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_exports" ADD CONSTRAINT "catalog_exports_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catalog_exports" ADD CONSTRAINT "catalog_exports_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "content_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_brands" ADD CONSTRAINT "tenant_brands_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_brands" ADD CONSTRAINT "tenant_brands_logo_file_id_fkey" FOREIGN KEY ("logo_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_brands" ADD CONSTRAINT "tenant_brands_logo_icon_file_id_fkey" FOREIGN KEY ("logo_icon_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_templates" ADD CONSTRAINT "content_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_templates" ADD CONSTRAINT "content_templates_preview_file_id_fkey" FOREIGN KEY ("preview_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_contents" ADD CONSTRAINT "generated_contents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_contents" ADD CONSTRAINT "generated_contents_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "content_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_contents" ADD CONSTRAINT "generated_contents_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "tenant_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_contents" ADD CONSTRAINT "generated_contents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_contents" ADD CONSTRAINT "generated_contents_thumbnail_file_id_fkey" FOREIGN KEY ("thumbnail_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_contents" ADD CONSTRAINT "generated_contents_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_contents" ADD CONSTRAINT "generated_contents_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_contents" ADD CONSTRAINT "generated_contents_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_mockups" ADD CONSTRAINT "product_mockups_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_mockups" ADD CONSTRAINT "product_mockups_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_mockups" ADD CONSTRAINT "product_mockups_client_logo_file_id_fkey" FOREIGN KEY ("client_logo_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_mockups" ADD CONSTRAINT "product_mockups_result_file_id_fkey" FOREIGN KEY ("result_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_mockups" ADD CONSTRAINT "product_mockups_mockup_template_id_fkey" FOREIGN KEY ("mockup_template_id") REFERENCES "content_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "content_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "tenant_brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_campaigns" ADD CONSTRAINT "email_campaigns_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "catalogs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
