-- CreateEnum
CREATE TYPE "BidModality" AS ENUM ('PREGAO_ELETRONICO', 'PREGAO_PRESENCIAL', 'CONCORRENCIA', 'TOMADA_PRECOS', 'CONVITE', 'LEILAO', 'DIALOGO_COMPETITIVO', 'CONCURSO', 'DISPENSA', 'INEXIGIBILIDADE');

-- CreateEnum
CREATE TYPE "BidCriterion" AS ENUM ('MENOR_PRECO', 'MAIOR_DESCONTO', 'MELHOR_TECNICA', 'TECNICA_PRECO', 'MAIOR_LANCE', 'MAIOR_RETORNO');

-- CreateEnum
CREATE TYPE "BidLegalFramework" AS ENUM ('LEI_14133_2021', 'LEI_8666_1993', 'LEI_10520_2002', 'LEI_12462_2011', 'DECRETO_10024_2019');

-- CreateEnum
CREATE TYPE "BidExecutionRegime" AS ENUM ('EMPREITADA_PRECO_GLOBAL', 'EMPREITADA_PRECO_UNITARIO', 'TAREFA', 'INTEGRAL', 'FORNECIMENTO_REGIME_PRECO');

-- CreateEnum
CREATE TYPE "BidStatus" AS ENUM ('DISCOVERED', 'ANALYZING', 'VIABLE', 'NOT_VIABLE', 'PREPARING', 'PROPOSAL_SENT', 'AWAITING_DISPUTE', 'IN_DISPUTE', 'WON', 'LOST', 'DESERTED', 'REVOKED', 'SUSPENDED', 'MONITORING', 'CONTRACTED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BidItemStatus" AS ENUM ('PENDING_BID_ITEM', 'QUOTED', 'WON_BID_ITEM', 'LOST_BID_ITEM', 'DESERTED_BID_ITEM', 'CANCELLED_BID_ITEM');

-- CreateEnum
CREATE TYPE "BidProposalStatus" AS ENUM ('DRAFT_PROPOSAL', 'REVIEW_PROPOSAL', 'APPROVED_PROPOSAL', 'SENT_PROPOSAL', 'ACCEPTED_PROPOSAL', 'REJECTED_PROPOSAL', 'SUPERSEDED_PROPOSAL');

-- CreateEnum
CREATE TYPE "BidDisputeStatus" AS ENUM ('WAITING_DISPUTE', 'OPEN_DISPUTE', 'IN_PROGRESS_DISPUTE', 'CLOSED_DISPUTE', 'CANCELLED_DISPUTE');

-- CreateEnum
CREATE TYPE "BidDisputeStrategy" AS ENUM ('AGGRESSIVE', 'MODERATE', 'CONSERVATIVE', 'LAST_SECOND', 'FOLLOW_LEADER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BidDocumentType" AS ENUM ('CERTIDAO_FEDERAL', 'CERTIDAO_ESTADUAL', 'CERTIDAO_MUNICIPAL', 'CERTIDAO_TRABALHISTA', 'CERTIDAO_FGTS', 'CERTIDAO_FALENCIA', 'BALANCO_PATRIMONIAL', 'CONTRATO_SOCIAL', 'ALVARA', 'ATESTADO_CAPACIDADE', 'PROPOSTA_TECNICA', 'PROPOSTA_COMERCIAL', 'EDITAL', 'ATA_REGISTRO', 'OUTROS');

-- CreateEnum
CREATE TYPE "BidDocRenewalMethod" AS ENUM ('AUTOMATIC_API', 'AUTOMATIC_SCRAPING', 'MANUAL');

-- CreateEnum
CREATE TYPE "BidDocRenewalStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING_RENEWAL', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "BidContractStatus" AS ENUM ('DRAFT_CONTRACT', 'ACTIVE_CONTRACT', 'SUSPENDED_CONTRACT', 'COMPLETED_CONTRACT', 'TERMINATED_CONTRACT', 'RENEWED_CONTRACT');

-- CreateEnum
CREATE TYPE "BidEmpenhoType" AS ENUM ('ORDINARIO', 'ESTIMATIVO', 'GLOBAL_EMPENHO');

-- CreateEnum
CREATE TYPE "BidEmpenhoStatus" AS ENUM ('EMITIDO', 'PARCIALMENTE_LIQUIDADO', 'LIQUIDADO', 'ANULADO');

-- CreateEnum
CREATE TYPE "BidMonitorEventType" AS ENUM ('STATUS_CHANGE', 'CONVOCATION', 'DISQUALIFICATION', 'APPEAL', 'IMPUGNATION', 'DEADLINE_APPROACHING', 'DOCUMENT_EXPIRING', 'PRICE_REGISTRATION_CALL', 'CONTRACT_RENEWAL', 'ADDENDUM', 'AI_SUGGESTION', 'PORTAL_UPDATE');

-- CreateEnum
CREATE TYPE "BidHistoryAction" AS ENUM ('BID_CREATED', 'BID_UPDATED', 'BID_STATUS_CHANGED', 'BID_PROPOSAL_CREATED', 'BID_PROPOSAL_SENT', 'BID_DOCUMENT_UPLOADED', 'BID_DISPUTE_ENTERED', 'BID_PLACED', 'BID_WON', 'BID_LOST', 'BID_CONTRACT_CREATED', 'BID_EMPENHO_RECEIVED', 'BID_ORDER_CREATED', 'BID_AI_ANALYSIS', 'BID_AI_DECISION', 'BID_MANUAL_OVERRIDE');

-- CreateEnum
CREATE TYPE "BidQuotaType" AS ENUM ('PRINCIPAL', 'COTA_RESERVADA', 'EXCLUSIVO_ME_EPP');

-- CreateEnum
CREATE TYPE "MarketplaceType" AS ENUM ('MERCADO_LIVRE', 'SHOPEE', 'AMAZON', 'MAGALU', 'TIKTOK_SHOP', 'AMERICANAS', 'ALIEXPRESS', 'CASAS_BAHIA', 'SHEIN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MarketplaceConnectionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DISCONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "MarketplaceFulfillmentType" AS ENUM ('SELF', 'MARKETPLACE', 'HYBRID');

-- CreateEnum
CREATE TYPE "MarketplaceListingStatus" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'PAUSED', 'ERROR', 'OUT_OF_STOCK', 'BLOCKED', 'DELETED');

-- CreateEnum
CREATE TYPE "MarketplaceOrderStatus" AS ENUM ('RECEIVED', 'ACKNOWLEDGED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED', 'DISPUTE');

-- CreateEnum
CREATE TYPE "MarketplacePaymentType" AS ENUM ('SALE', 'REFUND', 'COMMISSION', 'SHIPPING_FEE', 'AD_CHARGE', 'FULFILLMENT_FEE', 'ADJUSTMENT', 'TRANSFER');

-- CreateEnum
CREATE TYPE "MarketplacePaymentStatus" AS ENUM ('PENDING', 'SETTLED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MarketplaceAdStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED', 'DRAFT');

-- CreateEnum
CREATE TYPE "MarketplaceAdType" AS ENUM ('PRODUCT_ADS', 'BRAND_ADS', 'DISPLAY', 'VIDEO', 'SPONSORED');

-- CreateEnum
CREATE TYPE "MarketplaceMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "EventLogStatus" AS ENUM ('PUBLISHED', 'PROCESSING', 'PROCESSED', 'FAILED', 'DEAD_LETTER');

-- CreateTable
CREATE TABLE "bids" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "portal_name" VARCHAR(64) NOT NULL,
    "portal_edital_id" VARCHAR(128),
    "edital_number" VARCHAR(128) NOT NULL,
    "modality" "BidModality" NOT NULL,
    "criterion_type" "BidCriterion" NOT NULL,
    "legal_framework" "BidLegalFramework" NOT NULL,
    "execution_regime" "BidExecutionRegime",
    "object" TEXT NOT NULL,
    "object_summary" VARCHAR(512),
    "organ_name" VARCHAR(256) NOT NULL,
    "organ_cnpj" VARCHAR(18),
    "organ_state" VARCHAR(2),
    "organ_city" VARCHAR(128),
    "estimated_value" DECIMAL(14,2),
    "our_proposal_value" DECIMAL(14,2),
    "final_value" DECIMAL(14,2),
    "margin" DECIMAL(6,2),
    "publication_date" TIMESTAMP(3),
    "opening_date" TIMESTAMP(3) NOT NULL,
    "closing_date" TIMESTAMP(3),
    "dispute_date" TIMESTAMP(3),
    "status" "BidStatus" NOT NULL DEFAULT 'DISCOVERED',
    "viability_score" INTEGER,
    "viability_reason" VARCHAR(512),
    "customer_id" TEXT,
    "assigned_to_user_id" TEXT,
    "exclusive_me_epp" BOOLEAN NOT NULL DEFAULT false,
    "delivery_states" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "edital_url" VARCHAR(1024),
    "edital_file_id" TEXT,
    "etp_file_id" TEXT,
    "tr_file_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bid_id" TEXT NOT NULL,
    "item_number" INTEGER NOT NULL,
    "lot_number" INTEGER,
    "lot_description" VARCHAR(512),
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unit" VARCHAR(16) NOT NULL,
    "estimated_unit_price" DECIMAL(14,4),
    "our_unit_price" DECIMAL(14,4),
    "final_unit_price" DECIMAL(14,4),
    "status" "BidItemStatus" NOT NULL DEFAULT 'PENDING_BID_ITEM',
    "variant_id" TEXT,
    "match_confidence" DECIMAL(5,2),
    "quota_type" "BidQuotaType",
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bid_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_proposals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bid_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "BidProposalStatus" NOT NULL DEFAULT 'DRAFT_PROPOSAL',
    "total_value" DECIMAL(14,2) NOT NULL,
    "valid_until" TIMESTAMP(3),
    "proposal_file_id" TEXT,
    "sent_at" TIMESTAMP(3),
    "sent_by_user_id" TEXT,
    "sent_by_ai" BOOLEAN NOT NULL DEFAULT false,
    "portal_confirmation" VARCHAR(256),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bid_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bid_id" TEXT,
    "type" "BidDocumentType" NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "description" VARCHAR(512),
    "file_id" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3),
    "expiration_date" TIMESTAMP(3),
    "is_valid" BOOLEAN NOT NULL DEFAULT true,
    "auto_renewable" BOOLEAN NOT NULL DEFAULT false,
    "last_renew_attempt" TIMESTAMP(3),
    "renew_status" "BidDocRenewalStatus",
    "portal_uploaded" BOOLEAN NOT NULL DEFAULT false,
    "portal_uploaded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bid_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_contracts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bid_id" TEXT NOT NULL,
    "contract_number" VARCHAR(128) NOT NULL,
    "status" "BidContractStatus" NOT NULL DEFAULT 'DRAFT_CONTRACT',
    "signed_date" TIMESTAMP(3),
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "total_value" DECIMAL(14,2) NOT NULL,
    "remaining_value" DECIMAL(14,2) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "renewal_count" INTEGER NOT NULL DEFAULT 0,
    "max_renewals" INTEGER,
    "renewal_deadline" TIMESTAMP(3),
    "delivery_addresses" JSONB,
    "contract_file_id" TEXT,
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bid_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_empenhos" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "empenho_number" VARCHAR(128) NOT NULL,
    "type" "BidEmpenhoType" NOT NULL,
    "value" DECIMAL(14,2) NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "status" "BidEmpenhoStatus" NOT NULL DEFAULT 'EMITIDO',
    "order_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bid_empenhos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_monitor_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bid_id" TEXT NOT NULL,
    "type" "BidMonitorEventType" NOT NULL,
    "description" TEXT NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "detected_by_ai" BOOLEAN NOT NULL DEFAULT false,
    "portal_data" JSONB,
    "action_required" BOOLEAN NOT NULL DEFAULT false,
    "action_taken" TEXT,
    "action_taken_at" TIMESTAMP(3),
    "action_taken_by_user_id" TEXT,
    "response_deadline" TIMESTAMP(3),
    "response_status" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bid_monitor_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_history" (
    "id" TEXT NOT NULL,
    "bid_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "action" "BidHistoryAction" NOT NULL,
    "description" VARCHAR(512) NOT NULL,
    "metadata" JSONB,
    "performed_by_user_id" TEXT,
    "performed_by_ai" BOOLEAN NOT NULL DEFAULT false,
    "is_reversible" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bid_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bid_ai_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "autonomy_level" INTEGER NOT NULL DEFAULT 1,
    "max_edital_value" DECIMAL(14,2),
    "min_margin_percent" DECIMAL(6,2) NOT NULL DEFAULT 10,
    "allowed_modalities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowed_categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "blocked_organs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "max_simultaneous" INTEGER NOT NULL DEFAULT 10,
    "max_aggregate_exposure" DECIMAL(14,2),
    "cooling_off_minutes" INTEGER NOT NULL DEFAULT 30,
    "emergency_stop" BOOLEAN NOT NULL DEFAULT false,
    "first_time_approval" BOOLEAN NOT NULL DEFAULT true,
    "company_size" VARCHAR(16),
    "monitoring_timeout_days" INTEGER NOT NULL DEFAULT 180,
    "auto_prospect" BOOLEAN NOT NULL DEFAULT false,
    "auto_propose" BOOLEAN NOT NULL DEFAULT false,
    "auto_dispute" BOOLEAN NOT NULL DEFAULT false,
    "auto_respond" BOOLEAN NOT NULL DEFAULT false,
    "auto_create_order" BOOLEAN NOT NULL DEFAULT false,
    "notify_on_actions" BOOLEAN NOT NULL DEFAULT true,
    "chat_response_whitelist" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bid_ai_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certidao_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "BidDocumentType" NOT NULL,
    "renewal_url" VARCHAR(1024),
    "renewal_method" "BidDocRenewalMethod" NOT NULL,
    "last_check" TIMESTAMP(3),
    "last_renewal" TIMESTAMP(3),
    "next_expiration" TIMESTAMP(3),
    "check_interval_days" INTEGER NOT NULL DEFAULT 7,
    "alert_days_before" INTEGER NOT NULL DEFAULT 15,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certidao_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_connections" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "marketplace" "MarketplaceType" NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "status" "MarketplaceConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
    "seller_id" VARCHAR(128),
    "seller_name" VARCHAR(256),
    "access_token" TEXT,
    "refresh_token" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "api_key" TEXT,
    "api_secret" TEXT,
    "sync_products" BOOLEAN NOT NULL DEFAULT true,
    "sync_prices" BOOLEAN NOT NULL DEFAULT true,
    "sync_stock" BOOLEAN NOT NULL DEFAULT true,
    "sync_orders" BOOLEAN NOT NULL DEFAULT true,
    "sync_messages" BOOLEAN NOT NULL DEFAULT true,
    "sync_interval_min" INTEGER NOT NULL DEFAULT 15,
    "last_sync_at" TIMESTAMP(3),
    "last_sync_status" VARCHAR(32),
    "last_sync_error" TEXT,
    "price_table_id" TEXT,
    "commission_percent" DECIMAL(5,2),
    "auto_calc_price" BOOLEAN NOT NULL DEFAULT false,
    "price_multiplier" DECIMAL(5,2) NOT NULL DEFAULT 1,
    "fulfillment_type" "MarketplaceFulfillmentType" NOT NULL DEFAULT 'SELF',
    "default_warehouse_id" TEXT,
    "webhook_url" VARCHAR(512),
    "webhook_secret" VARCHAR(256),
    "settings" JSONB,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_listings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "parent_listing_id" TEXT,
    "external_listing_id" VARCHAR(256) NOT NULL,
    "external_product_id" VARCHAR(256),
    "external_url" VARCHAR(512),
    "status" "MarketplaceListingStatus" NOT NULL DEFAULT 'DRAFT',
    "status_reason" VARCHAR(512),
    "last_status_check" TIMESTAMP(3),
    "published_price" DECIMAL(12,2),
    "compare_at_price" DECIMAL(12,2),
    "commission_amount" DECIMAL(12,2),
    "net_price" DECIMAL(12,2),
    "published_stock" INTEGER NOT NULL DEFAULT 0,
    "fulfillment_stock" INTEGER NOT NULL DEFAULT 0,
    "external_category_id" VARCHAR(128),
    "external_category_path" VARCHAR(512),
    "total_sold" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "average_rating" DECIMAL(3,2),
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "buy_box_owner" BOOLEAN NOT NULL DEFAULT false,
    "health_score" DECIMAL(5,2),
    "has_active_ad" BOOLEAN NOT NULL DEFAULT false,
    "ad_spend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "last_sync_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "external_order_id" VARCHAR(256) NOT NULL,
    "external_order_url" VARCHAR(512),
    "status" "MarketplaceOrderStatus" NOT NULL DEFAULT 'RECEIVED',
    "marketplace_status" VARCHAR(64),
    "buyer_name" VARCHAR(256) NOT NULL,
    "buyer_document" VARCHAR(20),
    "buyer_email" VARCHAR(254),
    "buyer_phone" VARCHAR(20),
    "customer_id" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "shipping_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "marketplace_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "shipping_method" VARCHAR(128),
    "tracking_code" VARCHAR(128),
    "tracking_url" VARCHAR(512),
    "shipping_label" TEXT,
    "estimated_delivery" TIMESTAMP(3),
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "delivery_address" JSONB NOT NULL,
    "order_id" TEXT,
    "notes" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL,
    "acknowledged_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_order_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "marketplace_order_id" TEXT NOT NULL,
    "listing_id" TEXT,
    "external_item_id" VARCHAR(256),
    "title" VARCHAR(512) NOT NULL,
    "sku" VARCHAR(128),
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "total_price" DECIMAL(12,2) NOT NULL,
    "variant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_order_messages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "marketplace_order_id" TEXT NOT NULL,
    "external_message_id" VARCHAR(256),
    "direction" "MarketplaceMessageDirection" NOT NULL,
    "sender_name" VARCHAR(256) NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "sent_by_ai" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_order_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "external_payment_id" VARCHAR(256),
    "type" "MarketplacePaymentType" NOT NULL,
    "description" VARCHAR(512),
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "fee_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "marketplace_order_id" TEXT,
    "installment_number" INTEGER,
    "settlement_date" TIMESTAMP(3),
    "status" "MarketplacePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "finance_entry_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_ad_campaigns" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "external_campaign_id" VARCHAR(256),
    "name" VARCHAR(256) NOT NULL,
    "type" "MarketplaceAdType" NOT NULL,
    "status" "MarketplaceAdStatus" NOT NULL DEFAULT 'DRAFT',
    "daily_budget" DECIMAL(12,2),
    "total_budget" DECIMAL(12,2),
    "total_spent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "ctr" DECIMAL(8,4),
    "acos" DECIMAL(8,4),
    "roas" DECIMAL(8,4),
    "ai_suggested" BOOLEAN NOT NULL DEFAULT false,
    "ai_reason" TEXT,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_ad_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_ad_listings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "bid_amount" DECIMAL(12,2),
    "status" "MarketplaceAdStatus" NOT NULL DEFAULT 'ACTIVE',
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "spend" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sales" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_ad_listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_category_mappings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "internal_category_id" TEXT NOT NULL,
    "external_category_id" VARCHAR(128) NOT NULL,
    "external_category_path" VARCHAR(512),
    "attribute_mapping" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_category_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" VARCHAR(128) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "source" VARCHAR(32) NOT NULL,
    "source_entity_type" VARCHAR(64) NOT NULL,
    "source_entity_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "metadata" JSONB,
    "correlation_id" TEXT,
    "causation_id" TEXT,
    "status" "EventLogStatus" NOT NULL DEFAULT 'PUBLISHED',
    "processed_by" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "failed_consumers" JSONB,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "next_retry_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bids_tenant_id_idx" ON "bids"("tenant_id");

-- CreateIndex
CREATE INDEX "bids_tenant_id_status_idx" ON "bids"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "bids_tenant_id_opening_date_idx" ON "bids"("tenant_id", "opening_date");

-- CreateIndex
CREATE INDEX "bids_tenant_id_deleted_at_idx" ON "bids"("tenant_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "bids_tenant_id_portal_name_portal_edital_id_key" ON "bids"("tenant_id", "portal_name", "portal_edital_id");

-- CreateIndex
CREATE INDEX "bid_items_bid_id_idx" ON "bid_items"("bid_id");

-- CreateIndex
CREATE INDEX "bid_items_tenant_id_idx" ON "bid_items"("tenant_id");

-- CreateIndex
CREATE INDEX "bid_proposals_bid_id_idx" ON "bid_proposals"("bid_id");

-- CreateIndex
CREATE INDEX "bid_proposals_tenant_id_idx" ON "bid_proposals"("tenant_id");

-- CreateIndex
CREATE INDEX "bid_documents_tenant_id_idx" ON "bid_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "bid_documents_bid_id_idx" ON "bid_documents"("bid_id");

-- CreateIndex
CREATE INDEX "bid_documents_tenant_id_type_idx" ON "bid_documents"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "bid_documents_expiration_date_idx" ON "bid_documents"("expiration_date");

-- CreateIndex
CREATE INDEX "bid_contracts_tenant_id_idx" ON "bid_contracts"("tenant_id");

-- CreateIndex
CREATE INDEX "bid_contracts_tenant_id_status_idx" ON "bid_contracts"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "bid_contracts_bid_id_idx" ON "bid_contracts"("bid_id");

-- CreateIndex
CREATE UNIQUE INDEX "bid_contracts_tenant_id_contract_number_key" ON "bid_contracts"("tenant_id", "contract_number");

-- CreateIndex
CREATE INDEX "bid_empenhos_tenant_id_idx" ON "bid_empenhos"("tenant_id");

-- CreateIndex
CREATE INDEX "bid_empenhos_contract_id_idx" ON "bid_empenhos"("contract_id");

-- CreateIndex
CREATE UNIQUE INDEX "bid_empenhos_tenant_id_empenho_number_key" ON "bid_empenhos"("tenant_id", "empenho_number");

-- CreateIndex
CREATE INDEX "bid_monitor_events_tenant_id_idx" ON "bid_monitor_events"("tenant_id");

-- CreateIndex
CREATE INDEX "bid_monitor_events_bid_id_idx" ON "bid_monitor_events"("bid_id");

-- CreateIndex
CREATE INDEX "bid_monitor_events_tenant_id_type_idx" ON "bid_monitor_events"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "bid_history_bid_id_idx" ON "bid_history"("bid_id");

-- CreateIndex
CREATE INDEX "bid_history_tenant_id_idx" ON "bid_history"("tenant_id");

-- CreateIndex
CREATE INDEX "bid_history_bid_id_created_at_idx" ON "bid_history"("bid_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "bid_ai_configs_tenant_id_key" ON "bid_ai_configs"("tenant_id");

-- CreateIndex
CREATE INDEX "certidao_schedules_tenant_id_idx" ON "certidao_schedules"("tenant_id");

-- CreateIndex
CREATE INDEX "certidao_schedules_tenant_id_is_active_idx" ON "certidao_schedules"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "marketplace_connections_tenant_id_idx" ON "marketplace_connections"("tenant_id");

-- CreateIndex
CREATE INDEX "marketplace_connections_tenant_id_marketplace_idx" ON "marketplace_connections"("tenant_id", "marketplace");

-- CreateIndex
CREATE INDEX "marketplace_connections_tenant_id_status_idx" ON "marketplace_connections"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_connections_tenant_id_marketplace_seller_id_key" ON "marketplace_connections"("tenant_id", "marketplace", "seller_id");

-- CreateIndex
CREATE INDEX "marketplace_listings_tenant_id_idx" ON "marketplace_listings"("tenant_id");

-- CreateIndex
CREATE INDEX "marketplace_listings_tenant_id_connection_id_idx" ON "marketplace_listings"("tenant_id", "connection_id");

-- CreateIndex
CREATE INDEX "marketplace_listings_tenant_id_status_idx" ON "marketplace_listings"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "marketplace_listings_variant_id_idx" ON "marketplace_listings"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_listings_connection_id_external_listing_id_key" ON "marketplace_listings"("connection_id", "external_listing_id");

-- CreateIndex
CREATE INDEX "marketplace_orders_tenant_id_idx" ON "marketplace_orders"("tenant_id");

-- CreateIndex
CREATE INDEX "marketplace_orders_tenant_id_connection_id_idx" ON "marketplace_orders"("tenant_id", "connection_id");

-- CreateIndex
CREATE INDEX "marketplace_orders_tenant_id_status_idx" ON "marketplace_orders"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "marketplace_orders_received_at_idx" ON "marketplace_orders"("received_at");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_orders_connection_id_external_order_id_key" ON "marketplace_orders"("connection_id", "external_order_id");

-- CreateIndex
CREATE INDEX "marketplace_order_items_tenant_id_idx" ON "marketplace_order_items"("tenant_id");

-- CreateIndex
CREATE INDEX "marketplace_order_items_marketplace_order_id_idx" ON "marketplace_order_items"("marketplace_order_id");

-- CreateIndex
CREATE INDEX "marketplace_order_messages_tenant_id_idx" ON "marketplace_order_messages"("tenant_id");

-- CreateIndex
CREATE INDEX "marketplace_order_messages_marketplace_order_id_idx" ON "marketplace_order_messages"("marketplace_order_id");

-- CreateIndex
CREATE INDEX "marketplace_payments_tenant_id_idx" ON "marketplace_payments"("tenant_id");

-- CreateIndex
CREATE INDEX "marketplace_payments_tenant_id_connection_id_idx" ON "marketplace_payments"("tenant_id", "connection_id");

-- CreateIndex
CREATE INDEX "marketplace_payments_tenant_id_status_idx" ON "marketplace_payments"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_payments_connection_id_external_payment_id_key" ON "marketplace_payments"("connection_id", "external_payment_id");

-- CreateIndex
CREATE INDEX "marketplace_ad_campaigns_tenant_id_idx" ON "marketplace_ad_campaigns"("tenant_id");

-- CreateIndex
CREATE INDEX "marketplace_ad_campaigns_tenant_id_connection_id_idx" ON "marketplace_ad_campaigns"("tenant_id", "connection_id");

-- CreateIndex
CREATE INDEX "marketplace_ad_listings_tenant_id_idx" ON "marketplace_ad_listings"("tenant_id");

-- CreateIndex
CREATE INDEX "marketplace_ad_listings_campaign_id_idx" ON "marketplace_ad_listings"("campaign_id");

-- CreateIndex
CREATE INDEX "marketplace_category_mappings_tenant_id_idx" ON "marketplace_category_mappings"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_category_mappings_connection_id_internal_catego_key" ON "marketplace_category_mappings"("connection_id", "internal_category_id");

-- CreateIndex
CREATE INDEX "event_logs_tenant_id_idx" ON "event_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "event_logs_tenant_id_type_idx" ON "event_logs"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "event_logs_tenant_id_created_at_idx" ON "event_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "event_logs_status_idx" ON "event_logs"("status");

-- CreateIndex
CREATE INDEX "event_logs_correlation_id_idx" ON "event_logs"("correlation_id");

-- CreateIndex
CREATE INDEX "event_logs_source_entity_type_source_entity_id_idx" ON "event_logs"("source_entity_type", "source_entity_id");

-- CreateIndex
CREATE INDEX "event_logs_status_next_retry_at_idx" ON "event_logs"("status", "next_retry_at");

-- AddForeignKey
ALTER TABLE "analytics_report_generations" ADD CONSTRAINT "analytics_report_generations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_edital_file_id_fkey" FOREIGN KEY ("edital_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_etp_file_id_fkey" FOREIGN KEY ("etp_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bids" ADD CONSTRAINT "bids_tr_file_id_fkey" FOREIGN KEY ("tr_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_items" ADD CONSTRAINT "bid_items_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_items" ADD CONSTRAINT "bid_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_proposals" ADD CONSTRAINT "bid_proposals_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_proposals" ADD CONSTRAINT "bid_proposals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_proposals" ADD CONSTRAINT "bid_proposals_proposal_file_id_fkey" FOREIGN KEY ("proposal_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_proposals" ADD CONSTRAINT "bid_proposals_sent_by_user_id_fkey" FOREIGN KEY ("sent_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_documents" ADD CONSTRAINT "bid_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_documents" ADD CONSTRAINT "bid_documents_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_documents" ADD CONSTRAINT "bid_documents_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_contracts" ADD CONSTRAINT "bid_contracts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_contracts" ADD CONSTRAINT "bid_contracts_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_contracts" ADD CONSTRAINT "bid_contracts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_contracts" ADD CONSTRAINT "bid_contracts_contract_file_id_fkey" FOREIGN KEY ("contract_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_empenhos" ADD CONSTRAINT "bid_empenhos_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_empenhos" ADD CONSTRAINT "bid_empenhos_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "bid_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_empenhos" ADD CONSTRAINT "bid_empenhos_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_monitor_events" ADD CONSTRAINT "bid_monitor_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_monitor_events" ADD CONSTRAINT "bid_monitor_events_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_monitor_events" ADD CONSTRAINT "bid_monitor_events_action_taken_by_user_id_fkey" FOREIGN KEY ("action_taken_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_history" ADD CONSTRAINT "bid_history_bid_id_fkey" FOREIGN KEY ("bid_id") REFERENCES "bids"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_history" ADD CONSTRAINT "bid_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_history" ADD CONSTRAINT "bid_history_performed_by_user_id_fkey" FOREIGN KEY ("performed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bid_ai_configs" ADD CONSTRAINT "bid_ai_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certidao_schedules" ADD CONSTRAINT "certidao_schedules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_connections" ADD CONSTRAINT "marketplace_connections_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "marketplace_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_parent_listing_id_fkey" FOREIGN KEY ("parent_listing_id") REFERENCES "marketplace_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "marketplace_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_order_items" ADD CONSTRAINT "marketplace_order_items_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_order_items" ADD CONSTRAINT "marketplace_order_items_marketplace_order_id_fkey" FOREIGN KEY ("marketplace_order_id") REFERENCES "marketplace_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_order_items" ADD CONSTRAINT "marketplace_order_items_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "marketplace_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_order_messages" ADD CONSTRAINT "marketplace_order_messages_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_order_messages" ADD CONSTRAINT "marketplace_order_messages_marketplace_order_id_fkey" FOREIGN KEY ("marketplace_order_id") REFERENCES "marketplace_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_payments" ADD CONSTRAINT "marketplace_payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_payments" ADD CONSTRAINT "marketplace_payments_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "marketplace_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_payments" ADD CONSTRAINT "marketplace_payments_marketplace_order_id_fkey" FOREIGN KEY ("marketplace_order_id") REFERENCES "marketplace_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_ad_campaigns" ADD CONSTRAINT "marketplace_ad_campaigns_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_ad_campaigns" ADD CONSTRAINT "marketplace_ad_campaigns_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "marketplace_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_ad_listings" ADD CONSTRAINT "marketplace_ad_listings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_ad_listings" ADD CONSTRAINT "marketplace_ad_listings_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketplace_ad_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_ad_listings" ADD CONSTRAINT "marketplace_ad_listings_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "marketplace_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_category_mappings" ADD CONSTRAINT "marketplace_category_mappings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_category_mappings" ADD CONSTRAINT "marketplace_category_mappings_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "marketplace_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
