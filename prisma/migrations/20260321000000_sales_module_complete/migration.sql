-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ContactRole' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ContactRole" AS ENUM ('DECISION_MAKER', 'INFLUENCER', 'CHAMPION', 'GATEKEEPER', 'END_USER', 'OTHER');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'LifecycleStage' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "LifecycleStage" AS ENUM ('SUBSCRIBER', 'LEAD', 'QUALIFIED', 'OPPORTUNITY', 'CUSTOMER', 'EVANGELIST');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'LeadTemperature' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "LeadTemperature" AS ENUM ('HOT', 'WARM', 'COLD');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ContactSource' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ContactSource" AS ENUM ('MANUAL', 'IMPORT', 'FORM', 'WHATSAPP', 'INSTAGRAM', 'TELEGRAM', 'SMS', 'WEBCHAT', 'EMAIL', 'PDV', 'MARKETPLACE', 'BID', 'API');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PipelineType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PipelineType" AS ENUM ('SALES', 'ONBOARDING', 'SUPPORT', 'CUSTOM', 'ORDER_B2C', 'ORDER_B2B', 'ORDER_BID', 'ORDER_ECOMMERCE');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PipelineStageType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PipelineStageType" AS ENUM ('OPEN', 'WON', 'LOST', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 'INVOICED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'DealStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "DealStatus" AS ENUM ('OPEN', 'WON', 'LOST', 'ABANDONED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ActivityType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ActivityType" AS ENUM ('NOTE', 'CALL', 'MEETING', 'TASK', 'EMAIL_SENT', 'EMAIL_RECEIVED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ActivityOutcome' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ActivityOutcome" AS ENUM ('ANSWERED', 'NO_ANSWER', 'VOICEMAIL', 'COMPLETED', 'CANCELLED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'TimelineEventType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "TimelineEventType" AS ENUM ('STAGE_CHANGE', 'LIFECYCLE_CHANGE', 'DEAL_CREATED', 'DEAL_UPDATED', 'DEAL_WON', 'DEAL_LOST', 'SCORE_CHANGE', 'ASSIGNMENT_CHANGE', 'AI_INSIGHT', 'SYSTEM_EVENT', 'EXTERNAL_EVENT', 'STAGE_CHANGED', 'ACTIVITY_CREATED', 'ACTIVITY_COMPLETED', 'NOTE_ADDED', 'EMAIL_SENT', 'CONTACT_ADDED', 'VALUE_CHANGED', 'OWNER_CHANGED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'TimelineEventSource' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "TimelineEventSource" AS ENUM ('SYSTEM', 'AI', 'EXTERNAL_MODULE');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ContactLifecycleStage' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ContactLifecycleStage" AS ENUM ('SUBSCRIBER', 'LEAD', 'QUALIFIED', 'OPPORTUNITY', 'CUSTOMER', 'EVANGELIST');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'DealPriority' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "DealPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CrmActivityType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CrmActivityType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE', 'WHATSAPP', 'VISIT', 'PROPOSAL', 'FOLLOW_UP');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CrmActivityStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CrmActivityStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PriceTableType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PriceTableType" AS ENUM ('DEFAULT', 'RETAIL', 'WHOLESALE', 'REGIONAL', 'CHANNEL', 'CUSTOMER', 'BID');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PriceTableRuleType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PriceTableRuleType" AS ENUM ('CUSTOMER_TYPE', 'REGION', 'CHANNEL', 'CUSTOMER_TAG', 'MIN_QUANTITY');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'RuleOperator' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "RuleOperator" AS ENUM ('EQUALS', 'IN', 'GREATER_THAN', 'LESS_THAN', 'BETWEEN');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'TaxType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "TaxType" AS ENUM ('ICMS', 'IPI', 'PIS', 'COFINS', 'ISS', 'ICMS_ST');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'StBaseCalculation' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "StBaseCalculation" AS ENUM ('MVA', 'PAUTA');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CampaignType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CampaignType" AS ENUM ('PERCENTAGE', 'FIXED_VALUE', 'BUY_X_GET_Y', 'BUY_X_GET_DISCOUNT', 'FREE_SHIPPING', 'BUNDLE_PRICE');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CampaignStatusEnum' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CampaignStatusEnum" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'ENDED', 'ARCHIVED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CampaignRuleType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CampaignRuleType" AS ENUM ('MIN_QUANTITY', 'MIN_VALUE', 'PRODUCT_CATEGORY', 'CUSTOMER_TAG', 'CUSTOMER_TYPE', 'FIRST_PURCHASE', 'DAY_OF_WEEK', 'TIME_RANGE');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CampaignDiscountType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CampaignDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_VALUE', 'FIXED_PRICE', 'FREE');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CouponType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED_VALUE', 'FREE_SHIPPING');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CouponApplicableTo' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CouponApplicableTo" AS ENUM ('ALL', 'SPECIFIC_PRODUCTS', 'SPECIFIC_CATEGORIES', 'SPECIFIC_CUSTOMERS');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ComboType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ComboType" AS ENUM ('FIXED', 'DYNAMIC');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ComboDiscountType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ComboDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_VALUE');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CatalogType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CatalogType" AS ENUM ('GENERAL', 'SELLER', 'CAMPAIGN', 'CUSTOMER', 'AI_GENERATED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CatalogStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CatalogStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CatalogLayout' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CatalogLayout" AS ENUM ('GRID', 'LIST', 'MAGAZINE');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CatalogExportType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CatalogExportType" AS ENUM ('PDF_FOLDER', 'PDF_PRICE_LIST', 'IMAGE_GRID', 'SHAREABLE_LINK');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CatalogExportStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CatalogExportStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'FAILED', 'EXPIRED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ContentTemplateType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ContentTemplateType" AS ENUM ('FOLDER_PAGE', 'SOCIAL_POST', 'SOCIAL_STORY', 'SOCIAL_REEL', 'EMAIL_CAMPAIGN', 'EMAIL_NEWSLETTER', 'BANNER', 'PRICE_LIST', 'PRODUCT_CARD', 'MOCKUP');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ContentChannel' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ContentChannel" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'WHATSAPP', 'EMAIL', 'PRINT', 'WEB');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'GeneratedContentType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "GeneratedContentType" AS ENUM ('SOCIAL_POST', 'SOCIAL_STORY', 'SOCIAL_REEL', 'FOLDER_PAGE', 'EMAIL_CAMPAIGN', 'BANNER', 'PRODUCT_CARD', 'VIDEO', 'MOCKUP');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ContentStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'READY', 'APPROVED', 'PUBLISHED', 'ARCHIVED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'MockupResultStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "MockupResultStatus" AS ENUM ('PENDING', 'GENERATING', 'READY', 'FAILED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'EmailCampaignType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "EmailCampaignType" AS ENUM ('NEWSLETTER', 'PROMOTION', 'PRODUCT_LAUNCH', 'FOLLOW_UP', 'CUSTOM');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'EmailCampaignStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "EmailCampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'EmailRecipientType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "EmailRecipientType" AS ENUM ('ALL_CONTACTS', 'CUSTOMER_TAG', 'LIFECYCLE_STAGE', 'SPECIFIC_CONTACTS', 'SEGMENT');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'InventorySessionStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "InventorySessionStatus" AS ENUM ('OPEN', 'PAUSED', 'COMPLETED', 'CANCELLED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'InventorySessionMode' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "InventorySessionMode" AS ENUM ('BIN', 'ZONE', 'PRODUCT');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'InventorySessionItemStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "InventorySessionItemStatus" AS ENUM ('PENDING', 'CONFIRMED', 'MISSING', 'WRONG_BIN', 'EXTRA');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'DivergenceResolution' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "DivergenceResolution" AS ENUM ('LOSS_REGISTERED', 'TRANSFERRED', 'ENTRY_CREATED', 'PENDING_REVIEW');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'SkillCategory' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "SkillCategory" AS ENUM ('MODULE', 'CHANNEL', 'AI', 'INTEGRATION', 'FEATURE');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PricingType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PricingType" AS ENUM ('FLAT', 'PER_UNIT', 'USAGE');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'SubscriptionStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'TRIAL', 'SUSPENDED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'BillingStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "BillingStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'IntegrationType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "IntegrationType" AS ENUM ('WHATSAPP', 'INSTAGRAM', 'TELEGRAM', 'SMS', 'MARKETPLACE_ML', 'MARKETPLACE_SHOPEE', 'MARKETPLACE_AMAZON', 'BID_PORTAL', 'EMAIL_IMAP', 'CERTIFICATE_A1', 'CERTIFICATE_CLOUD', 'TEF', 'OLLAMA', 'SEFAZ');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'IntegrationConnectionStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "IntegrationConnectionStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR', 'NOT_CONFIGURED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CentralUserRole' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CentralUserRole" AS ENUM ('OWNER', 'ADMIN', 'SUPPORT', 'FINANCE', 'VIEWER');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'FeatureFlagCategory' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "FeatureFlagCategory" AS ENUM ('BETA', 'EXPERIMENT', 'ROLLOUT', 'INTERNAL');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'TicketCategory' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "TicketCategory" AS ENUM ('BUG', 'QUESTION', 'REQUEST', 'FINANCIAL', 'OTHER');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'TicketPriority' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "TicketPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'TicketStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'TicketAuthorType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "TicketAuthorType" AS ENUM ('TENANT_USER', 'CENTRAL_TEAM', 'AI_ASSISTANT');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CardIntegrationType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CardIntegrationType" AS ENUM ('CUSTOMER', 'PRODUCT', 'FINANCE_ENTRY', 'EMAIL', 'DEPARTMENT', 'CALENDAR_EVENT');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'OrderType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "OrderType" AS ENUM ('QUOTE', 'ORDER');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'OrderChannel' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "OrderChannel" AS ENUM ('PDV', 'WEB', 'WHATSAPP', 'MARKETPLACE', 'BID', 'MANUAL', 'API');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'DeliveryMethod' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "DeliveryMethod" AS ENUM ('PICKUP', 'OWN_FLEET', 'CARRIER', 'PARTIAL');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PaymentMethod' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO', 'BANK_TRANSFER', 'CHECK', 'STORE_CREDIT', 'OTHER');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PaymentStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PaymentConditionType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PaymentConditionType" AS ENUM ('CASH', 'INSTALLMENT', 'CUSTOM', 'CREDIT_LIMIT');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PaymentConditionApplicable' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PaymentConditionApplicable" AS ENUM ('ALL', 'RETAIL', 'WHOLESALE', 'BID');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'InterestType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "InterestType" AS ENUM ('SIMPLE', 'COMPOUND');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'DeliveryStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "DeliveryStatus" AS ENUM ('PREPARING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'FAILED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ReturnType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ReturnType" AS ENUM ('FULL_RETURN', 'PARTIAL_RETURN', 'EXCHANGE');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ReturnStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'RECEIVING', 'RECEIVED', 'CREDIT_ISSUED', 'EXCHANGE_COMPLETED', 'REJECTED', 'CANCELLED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ReturnReason' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ReturnReason" AS ENUM ('DEFECTIVE', 'WRONG_ITEM', 'CHANGED_MIND', 'DAMAGED', 'NOT_AS_DESCRIBED', 'OTHER');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ReturnItemCondition' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ReturnItemCondition" AS ENUM ('NEW', 'USED', 'DAMAGED', 'DEFECTIVE');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'RefundMethod' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "RefundMethod" AS ENUM ('SAME_METHOD', 'STORE_CREDIT', 'BANK_TRANSFER', 'PIX');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'StoreCreditSource' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "StoreCreditSource" AS ENUM ('RETURN', 'MANUAL', 'CAMPAIGN', 'LOYALTY');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ApprovalRuleType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ApprovalRuleType" AS ENUM ('ORDER_VALUE', 'DISCOUNT_PERCENT', 'CREDIT_EXCEEDED', 'NEW_CUSTOMER', 'MANUAL_PRICE', 'CUSTOM');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CommissionType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FIXED_PER_ORDER', 'FIXED_PER_ITEM', 'TIERED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CommissionStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CommissionAppliesTo' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CommissionAppliesTo" AS ENUM ('ALL', 'SPECIFIC_USERS', 'SPECIFIC_CATEGORIES', 'SPECIFIC_PRODUCTS');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'OrderHistoryAction' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "OrderHistoryAction" AS ENUM ('CREATED', 'STAGE_CHANGED', 'ITEM_ADDED', 'ITEM_REMOVED', 'ITEM_MODIFIED', 'PAYMENT_ADDED', 'PAYMENT_RECEIVED', 'APPROVAL_REQUESTED', 'APPROVED', 'REJECTED', 'DELIVERY_CREATED', 'DELIVERY_SHIPPED', 'DELIVERY_COMPLETED', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_COMPLETED', 'CANCELLED', 'NOTE_ADDED', 'ASSIGNED', 'COUPON_APPLIED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PriceSourceType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PriceSourceType" AS ENUM ('CUSTOMER', 'CAMPAIGN', 'COUPON', 'QUANTITY_TIER', 'TABLE', 'DEFAULT', 'MANUAL');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CertificateType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CertificateType" AS ENUM ('A1', 'A3', 'CLOUD_NEOID', 'CLOUD_BIRDID', 'CLOUD_OTHER');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'CertificateStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "CertificateStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED', 'PENDING_ACTIVATION');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'SignatureLevel' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "SignatureLevel" AS ENUM ('SIMPLE', 'ADVANCED', 'QUALIFIED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'EnvelopeStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "EnvelopeStatus" AS ENUM ('DRAFT', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'REJECTED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'EnvelopeRoutingType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "EnvelopeRoutingType" AS ENUM ('SEQUENTIAL', 'PARALLEL', 'HYBRID');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'SignerRole' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "SignerRole" AS ENUM ('SIGNER', 'APPROVER', 'WITNESS', 'REVIEWER');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'SignerStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "SignerStatus" AS ENUM ('PENDING', 'NOTIFIED', 'VIEWED', 'SIGNED', 'REJECTED', 'EXPIRED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'SignatureAuditType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "SignatureAuditType" AS ENUM ('CREATED', 'SENT', 'VIEWED', 'SIGNED', 'REJECTED', 'REMINDED', 'EXPIRED', 'CANCELLED', 'DOWNLOADED', 'DOCUMENT_VERIFIED', 'CERTIFICATE_VALIDATED', 'OTP_SENT', 'OTP_VERIFIED', 'LINK_ACCESSED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'WidgetType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "WidgetType" AS ENUM ('KPI_CARD', 'BAR_CHART', 'LINE_CHART', 'PIE_CHART', 'FUNNEL', 'TABLE', 'HEATMAP', 'SCATTER', 'GAUGE', 'RANKING', 'COMPARISON', 'TREND');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'WidgetDataSource' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "WidgetDataSource" AS ENUM ('ORDERS', 'DEALS', 'CONTACTS', 'CUSTOMERS', 'PRODUCTS', 'COMMISSIONS', 'CAMPAIGNS', 'BIDS', 'MARKETPLACE', 'CASHIER', 'CUSTOM_QUERY');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'DashboardRole' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "DashboardRole" AS ENUM ('SELLER', 'MANAGER', 'DIRECTOR', 'BID_SPECIALIST', 'MARKETPLACE_OPS', 'CASHIER');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'DashboardVisibility' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "DashboardVisibility" AS ENUM ('PRIVATE', 'TEAM', 'TENANT');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'GoalType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "GoalType" AS ENUM ('REVENUE', 'QUANTITY', 'DEALS_WON', 'NEW_CUSTOMERS', 'TICKET_AVERAGE', 'CONVERSION_RATE', 'COMMISSION', 'BID_WIN_RATE', 'CUSTOM');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'GoalPeriod' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "GoalPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'GoalScope' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "GoalScope" AS ENUM ('INDIVIDUAL', 'TEAM', 'TENANT');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'GoalStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'ACHIEVED', 'MISSED', 'ARCHIVED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ReportType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ReportType" AS ENUM ('SALES_SUMMARY', 'COMMISSION_REPORT', 'PIPELINE_REPORT', 'PRODUCT_PERFORMANCE', 'CUSTOMER_ANALYSIS', 'BID_REPORT', 'MARKETPLACE_REPORT', 'CASHIER_REPORT', 'GOAL_PROGRESS', 'CURVA_ABC', 'CUSTOM');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ReportFormat' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'EXCEL', 'CSV');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ReportFrequency' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ReportFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ReportDeliveryMethod' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ReportDeliveryMethod" AS ENUM ('EMAIL', 'WHATSAPP', 'BOTH', 'DOWNLOAD_ONLY');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'ReportGenerationStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "ReportGenerationStatus" AS ENUM ('GENERATING', 'SUCCESS', 'FAILED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'AiPersonality' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "AiPersonality" AS ENUM ('PROFESSIONAL', 'FRIENDLY', 'CASUAL', 'FORMAL', 'CUSTOM');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'AiToneOfVoice' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "AiToneOfVoice" AS ENUM ('NEUTRAL', 'WARM', 'DIRECT', 'ENTHUSIASTIC');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'AiConversationContext' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "AiConversationContext" AS ENUM ('DEDICATED', 'INLINE', 'COMMAND_BAR', 'VOICE');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'AiConversationStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "AiConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'AiMessageRole' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "AiMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL_CALL', 'TOOL_RESULT');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'AiMessageContentType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "AiMessageContentType" AS ENUM ('TEXT', 'CHART', 'TABLE', 'KPI_CARD', 'ACTION_CARD', 'IMAGE', 'ERROR', 'LOADING');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'AiFavoriteCategory' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "AiFavoriteCategory" AS ENUM ('SALES', 'STOCK', 'FINANCE', 'HR', 'CRM', 'GENERAL');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'AiActionStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "AiActionStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'EXECUTED', 'FAILED', 'CANCELLED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'AiInsightType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "AiInsightType" AS ENUM ('TREND', 'ANOMALY', 'OPPORTUNITY', 'RISK', 'PREDICTION', 'RECOMMENDATION', 'ALERT', 'CELEBRATION');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'AiInsightPriority' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "AiInsightPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'AiInsightStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "AiInsightStatus" AS ENUM ('NEW', 'VIEWED', 'ACTED_ON', 'DISMISSED', 'EXPIRED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PosTerminalMode' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PosTerminalMode" AS ENUM ('FAST_CHECKOUT', 'CONSULTIVE', 'SELF_SERVICE', 'EXTERNAL');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PosCashierMode' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PosCashierMode" AS ENUM ('INTEGRATED', 'SEPARATED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PosSessionStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PosSessionStatus" AS ENUM ('OPEN', 'CLOSED', 'SUSPENDED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PosTransactionStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PosTransactionStatus" AS ENUM ('COMPLETED', 'CANCELLED', 'SUSPENDED', 'PENDING_SYNC');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PosPaymentMethod' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PosPaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO', 'STORE_CREDIT', 'VOUCHER', 'PAYMENT_LINK', 'NFC', 'CHECK', 'OTHER');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PosCashMovementType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PosCashMovementType" AS ENUM ('OPENING', 'WITHDRAWAL', 'SUPPLY', 'CLOSING');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PosOfflineStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PosOfflineStatus" AS ENUM ('PENDING', 'SYNCING', 'SYNCED', 'FAILED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PosOfflineOperationType' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PosOfflineOperationType" AS ENUM ('TRANSACTION', 'CASH_MOVEMENT', 'CUSTOMER_CREATE', 'SESSION_CLOSE');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PosVisitOutcome' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PosVisitOutcome" AS ENUM ('SALE', 'QUOTE', 'NO_SALE', 'FOLLOW_UP');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'PosPaymentLinkStatus' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "PosPaymentLinkStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED');
  END IF;
END $ct$;

-- CreateEnum
DO $ct$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'event_log_status' AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "event_log_status" AS ENUM ('PUBLISHED', 'PROCESSING', 'PROCESSED', 'FAILED', 'DEAD_LETTER');
  END IF;
END $ct$;

-- AlterEnum (idempotent: skip if OrganizationType already has 'CUSTOMER')
DO $ae$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typname = 'OrganizationType' AND e.enumlabel = 'CUSTOMER'
    AND n.nspname = current_schema()
  ) THEN
    CREATE TYPE "OrganizationType_new" AS ENUM ('COMPANY', 'CUSTOMER');
    ALTER TABLE "organizations" ALTER COLUMN "type" TYPE "OrganizationType_new" USING ("type"::text::"OrganizationType_new");
    ALTER TYPE "OrganizationType" RENAME TO "OrganizationType_old";
    ALTER TYPE "OrganizationType_new" RENAME TO "OrganizationType";
    DROP TYPE "OrganizationType_old";
  END IF;
END $ae$;

-- AlterTable
ALTER TABLE "card_watchers" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'WATCHER';

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "address_complement" VARCHAR(128),
ADD COLUMN     "address_neighborhood" VARCHAR(128),
ADD COLUMN     "address_number" VARCHAR(20),
ADD COLUMN     "assigned_to_user_id" TEXT,
ADD COLUMN     "custom_fields" JSONB,
ADD COLUMN     "source" "ContactSource" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "state_registration" VARCHAR(32),
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "trade_name" VARCHAR(128),
ADD COLUMN     "website" VARCHAR(256);

-- AlterTable
ALTER TABLE "tenant_feature_flags" ADD COLUMN     "category" "FeatureFlagCategory" NOT NULL DEFAULT 'BETA',
ADD COLUMN     "enabled_by_user_id" TEXT,
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "notes" VARCHAR(500);

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
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(64),
    "color" VARCHAR(16),
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
CREATE TABLE "crm_deals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "pipeline_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "status" "DealStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "DealPriority" NOT NULL DEFAULT 'MEDIUM',
    "value" DECIMAL(12,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "expected_close_date" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "lost_reason" TEXT,
    "source" VARCHAR(64),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "custom_fields" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,
    "assigned_to_user_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_activities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "deal_id" TEXT,
    "contact_id" TEXT,
    "type" "CrmActivityType" NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "description" TEXT,
    "status" "CrmActivityStatus" NOT NULL DEFAULT 'PLANNED',
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration" INTEGER,
    "user_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_timeline_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "type" "TimelineEventType" NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "metadata" JSONB,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipelines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(64),
    "color" VARCHAR(16),
    "type" "PipelineType" NOT NULL DEFAULT 'SALES',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "next_pipeline_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_stages" (
    "id" TEXT NOT NULL,
    "pipeline_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "color" VARCHAR(16),
    "icon" VARCHAR(64),
    "position" INTEGER NOT NULL DEFAULT 0,
    "type" "PipelineStageType" NOT NULL DEFAULT 'OPEN',
    "probability" INTEGER,
    "auto_actions" JSONB,
    "rotten_after_days" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "first_name" VARCHAR(128) NOT NULL,
    "last_name" VARCHAR(128),
    "email" VARCHAR(256),
    "phone" VARCHAR(32),
    "whatsapp" VARCHAR(32),
    "role" "ContactRole" NOT NULL DEFAULT 'OTHER',
    "job_title" VARCHAR(128),
    "department" VARCHAR(128),
    "lifecycle_stage" "LifecycleStage" NOT NULL DEFAULT 'LEAD',
    "lead_score" INTEGER NOT NULL DEFAULT 0,
    "lead_temperature" "LeadTemperature",
    "source" "ContactSource" NOT NULL DEFAULT 'MANUAL',
    "last_interaction_at" TIMESTAMP(3),
    "last_channel_used" VARCHAR(32),
    "social_profiles" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "custom_fields" JSONB,
    "avatar_url" VARCHAR(500),
    "assigned_to_user_id" TEXT,
    "is_main_contact" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "pipeline_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "value" DECIMAL(12,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "expected_close_date" TIMESTAMP(3),
    "probability" INTEGER,
    "status" "DealStatus" NOT NULL DEFAULT 'OPEN',
    "lost_reason" TEXT,
    "won_at" TIMESTAMP(3),
    "lost_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "assigned_to_user_id" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "custom_fields" JSONB,
    "ai_insights" JSONB,
    "stage_entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previous_deal_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_deals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "role" VARCHAR(64),

    CONSTRAINT "contact_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "contact_id" TEXT,
    "customer_id" TEXT,
    "deal_id" TEXT,
    "title" VARCHAR(256) NOT NULL,
    "description" TEXT,
    "performed_by_user_id" TEXT,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration" INTEGER,
    "outcome" "ActivityOutcome",
    "metadata" JSONB,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "TimelineEventType" NOT NULL,
    "contact_id" TEXT,
    "customer_id" TEXT,
    "deal_id" TEXT,
    "title" VARCHAR(256) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "source" "TimelineEventSource" NOT NULL DEFAULT 'SYSTEM',
    "source_module" VARCHAR(32),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "document_type" VARCHAR(128) NOT NULL,
    "file_name" VARCHAR(256),
    "file_key" VARCHAR(512),
    "file_size" INTEGER,
    "mime_type" VARCHAR(128),
    "expires_at" TIMESTAMP(3),
    "notes" VARCHAR(512),
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_skill_definitions" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" VARCHAR(500),
    "module" "SystemModuleEnum",
    "parent_skill_code" VARCHAR(64),
    "category" "SkillCategory" NOT NULL,
    "is_core" BOOLEAN NOT NULL DEFAULT false,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "icon_url" VARCHAR(500),
    "requires_setup" BOOLEAN NOT NULL DEFAULT false,
    "setup_url" VARCHAR(500),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_skill_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_pricing" (
    "id" TEXT NOT NULL,
    "skill_code" VARCHAR(64) NOT NULL,
    "pricingType" "PricingType" NOT NULL,
    "flat_price" DECIMAL(15,2),
    "unit_price" DECIMAL(15,2),
    "free_quota" INTEGER,
    "usage_metric" VARCHAR(64),
    "unit_metric" VARCHAR(64),
    "unit_metric_label" VARCHAR(64),
    "usage_included" INTEGER,
    "usage_price" DECIMAL(15,2),
    "usage_metric_label" VARCHAR(64),
    "annual_discount" DECIMAL(5,2) DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "tiers" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_subscriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "skill_code" VARCHAR(64) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "custom_price" DECIMAL(15,2),
    "discount_percent" DECIMAL(5,2),
    "notes" VARCHAR(500),
    "granted_by" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_consumptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period" VARCHAR(7) NOT NULL,
    "metric" VARCHAR(64) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "limit" INTEGER,
    "used" INTEGER NOT NULL DEFAULT 0,
    "included" INTEGER NOT NULL DEFAULT 0,
    "overage" INTEGER NOT NULL DEFAULT 0,
    "overage_cost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_consumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_billings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "reference_month" VARCHAR(7) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "status" "BillingStatus" NOT NULL DEFAULT 'PENDING',
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "line_items" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_billings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_integration_statuses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "integration_type" "IntegrationType" NOT NULL,
    "connection_status" "IntegrationConnectionStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
    "last_sync_at" TIMESTAMP(3),
    "error_message" VARCHAR(500),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_integration_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "central_users" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "CentralUserRole" NOT NULL DEFAULT 'VIEWER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "invited_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "central_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "ticket_number" SERIAL NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "assignee_id" TEXT,
    "title" VARCHAR(256) NOT NULL,
    "category" "TicketCategory" NOT NULL DEFAULT 'OTHER',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_ticket_messages" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "author_id" TEXT,
    "author_type" "TicketAuthorType" NOT NULL,
    "body" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_ticket_attachments" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "file_name" VARCHAR(256) NOT NULL,
    "file_url" VARCHAR(500) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(128) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_sla_configs" (
    "id" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL,
    "first_response_minutes" INTEGER NOT NULL,
    "resolution_minutes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_sla_configs_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_number" VARCHAR(64) NOT NULL,
    "type" "OrderType" NOT NULL,
    "customer_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "pipeline_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "channel" "OrderChannel" NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shipping_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "price_table_id" TEXT,
    "payment_condition_id" TEXT,
    "credit_used" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "remaining_amount" DECIMAL(12,2) NOT NULL,
    "delivery_method" "DeliveryMethod",
    "delivery_address" JSONB,
    "tracking_code" TEXT,
    "carrier_name" TEXT,
    "estimated_delivery" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "needs_approval" BOOLEAN NOT NULL DEFAULT false,
    "approved_by_user_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "approval_notes" TEXT,
    "rejected_reason" TEXT,
    "deal_id" TEXT,
    "quote_id" TEXT,
    "return_origin_id" TEXT,
    "coupon_id" TEXT,
    "source_warehouse_id" TEXT,
    "assigned_to_user_id" TEXT,
    "notes" TEXT,
    "internal_notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "custom_fields" JSONB,
    "stage_entered_at" TIMESTAMP(3) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "expires_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "combo_id" TEXT,
    "name" VARCHAR(256) NOT NULL,
    "sku" VARCHAR(64),
    "description" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discount_value" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax_icms" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_ipi" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_pis" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_cofins" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ncm" VARCHAR(10),
    "cfop" VARCHAR(8),
    "quantity_delivered" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "quantity_returned" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "price_source" "PriceSourceType" NOT NULL DEFAULT 'DEFAULT',
    "price_source_id" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_conditions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "type" "PaymentConditionType" NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "first_due_days" INTEGER NOT NULL DEFAULT 0,
    "interval_days" INTEGER NOT NULL DEFAULT 30,
    "down_payment_percent" DECIMAL(5,2),
    "interest_rate" DECIMAL(5,2),
    "interest_type" "InterestType" NOT NULL DEFAULT 'SIMPLE',
    "penalty_rate" DECIMAL(5,2),
    "discount_cash" DECIMAL(5,2),
    "applicable_to" "PaymentConditionApplicable" NOT NULL DEFAULT 'ALL',
    "min_order_value" DECIMAL(10,2),
    "max_order_value" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "installment_number" INTEGER,
    "due_date" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "external_id" VARCHAR(128),
    "finance_entry_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_deliveries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "delivery_number" INTEGER NOT NULL,
    "method" "DeliveryMethod",
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PREPARING',
    "carrier_name" TEXT,
    "tracking_code" TEXT,
    "tracking_url" TEXT,
    "shipping_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "weight" DECIMAL(10,3),
    "address" JSONB,
    "estimated_date" TIMESTAMP(3),
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "received_by_name" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_delivery_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "delivery_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "warehouse_id" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_delivery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_returns" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "return_number" VARCHAR(64) NOT NULL,
    "type" "ReturnType" NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" "ReturnReason" NOT NULL,
    "reason_details" TEXT,
    "refund_method" "RefundMethod",
    "refund_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "credit_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "exchange_order_id" TEXT,
    "requested_by_user_id" TEXT NOT NULL,
    "approved_by_user_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "received_at" TIMESTAMP(3),
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_return_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "return_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "condition" "ReturnItemCondition" NOT NULL DEFAULT 'NEW',
    "restockable" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_credits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL,
    "source" "StoreCreditSource" NOT NULL,
    "source_id" TEXT,
    "reserved_for_order_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_credit_usages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "credit_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_credit_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_credit_limits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "credit_limit" DECIMAL(12,2) NOT NULL,
    "current_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "last_review_date" TIMESTAMP(3),
    "reviewed_by_user_id" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_credit_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "rule_type" "ApprovalRuleType" NOT NULL,
    "operator" "RuleOperator" NOT NULL,
    "value" VARCHAR(256) NOT NULL,
    "value2" VARCHAR(256),
    "approver_role" TEXT,
    "approver_user_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_commissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "base_value" DECIMAL(12,2) NOT NULL,
    "commission_type" "CommissionType" NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL,
    "commission_value" DECIMAL(10,2) NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "finance_entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "type" "CommissionType" NOT NULL,
    "value" DECIMAL(10,2),
    "tiers" JSONB,
    "applies_to" "CommissionAppliesTo" NOT NULL DEFAULT 'ALL',
    "target_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "min_order_value" DECIMAL(10,2),
    "exclude_discounted" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_history" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "action" "OrderHistoryAction" NOT NULL,
    "description" VARCHAR(512) NOT NULL,
    "metadata" JSONB,
    "performed_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_certificates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "type" "CertificateType" NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'ACTIVE',
    "subject_name" TEXT,
    "subject_cnpj" TEXT,
    "subject_cpf" TEXT,
    "issuer_name" TEXT,
    "serial_number" TEXT,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "thumbprint" TEXT,
    "pfx_file_id" TEXT,
    "pfx_password" TEXT,
    "cloud_provider_id" TEXT,
    "alert_days_before" INTEGER NOT NULL DEFAULT 30,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "allowed_modules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signature_envelopes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "description" TEXT,
    "status" "EnvelopeStatus" NOT NULL DEFAULT 'DRAFT',
    "signature_level" "SignatureLevel" NOT NULL,
    "min_signature_level" "SignatureLevel",
    "document_file_id" TEXT NOT NULL,
    "document_hash" VARCHAR(64) NOT NULL,
    "signed_file_id" TEXT,
    "document_type" VARCHAR(16) NOT NULL DEFAULT 'PDF',
    "source_module" VARCHAR(32) NOT NULL,
    "source_entity_type" VARCHAR(64) NOT NULL,
    "source_entity_id" TEXT NOT NULL,
    "routing_type" "EnvelopeRoutingType" NOT NULL,
    "expires_at" TIMESTAMP(3),
    "reminder_days" INTEGER NOT NULL DEFAULT 3,
    "auto_expire_days" INTEGER,
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "created_by_user_id" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signature_envelopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signature_envelope_signers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "envelope_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 1,
    "group" INTEGER NOT NULL DEFAULT 1,
    "role" "SignerRole" NOT NULL DEFAULT 'SIGNER',
    "status" "SignerStatus" NOT NULL DEFAULT 'PENDING',
    "user_id" TEXT,
    "contact_id" TEXT,
    "external_name" TEXT,
    "external_email" TEXT,
    "external_phone" TEXT,
    "external_document" TEXT,
    "signature_level" "SignatureLevel" NOT NULL,
    "certificate_id" TEXT,
    "access_token" VARCHAR(128),
    "access_token_expires_at" TIMESTAMP(3),
    "signed_at" TIMESTAMP(3),
    "signature_image_file_id" TEXT,
    "signature_data" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "geo_latitude" DECIMAL(8,6),
    "geo_longitude" DECIMAL(8,6),
    "otp_verified" BOOLEAN NOT NULL DEFAULT false,
    "rejected_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "last_notified_at" TIMESTAMP(3),
    "notification_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signature_envelope_signers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signature_audit_events" (
    "id" TEXT NOT NULL,
    "envelope_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "SignatureAuditType" NOT NULL,
    "signer_id" TEXT,
    "description" VARCHAR(512) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "geo_latitude" DECIMAL(8,6),
    "geo_longitude" DECIMAL(8,6),
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signature_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signature_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "signature_level" "SignatureLevel" NOT NULL,
    "routing_type" "EnvelopeRoutingType" NOT NULL,
    "signer_slots" JSONB NOT NULL,
    "expiration_days" INTEGER,
    "reminder_days" INTEGER NOT NULL DEFAULT 3,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signature_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_widgets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "type" "WidgetType" NOT NULL,
    "data_source" "WidgetDataSource" NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "position" JSONB NOT NULL DEFAULT '{}',
    "refresh_interval" INTEGER NOT NULL DEFAULT 300,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_dashboards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "role" "DashboardRole",
    "visibility" "DashboardVisibility" NOT NULL DEFAULT 'PRIVATE',
    "layout" JSONB,
    "created_by_user_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_dashboard_widgets" (
    "id" TEXT NOT NULL,
    "dashboard_id" TEXT NOT NULL,
    "widget_id" TEXT NOT NULL,
    "position" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_dashboard_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_goals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "type" "GoalType" NOT NULL,
    "target_value" DECIMAL(14,2) NOT NULL,
    "current_value" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "unit" VARCHAR(16) NOT NULL DEFAULT 'BRL',
    "period" "GoalPeriod" NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "scope" "GoalScope" NOT NULL,
    "user_id" TEXT,
    "team_id" TEXT,
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "achieved_at" TIMESTAMP(3),
    "created_by_user_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_reports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "type" "ReportType" NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "format" "ReportFormat" NOT NULL,
    "dashboard_id" TEXT,
    "is_scheduled" BOOLEAN NOT NULL DEFAULT false,
    "schedule_frequency" "ReportFrequency",
    "schedule_day_of_week" INTEGER,
    "schedule_day_of_month" INTEGER,
    "schedule_hour" INTEGER,
    "schedule_timezone" VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo',
    "delivery_method" "ReportDeliveryMethod",
    "recipient_user_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recipient_emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recipient_phones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "last_generated_at" TIMESTAMP(3),
    "last_file_id" TEXT,
    "last_status" "ReportGenerationStatus",
    "last_error" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_report_generations" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "status" "ReportGenerationStatus" NOT NULL,
    "file_id" TEXT,
    "format" "ReportFormat" NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "delivered_to" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "delivered_via" TEXT,
    "error" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_report_generations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_portal_accesses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "contact_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "last_access_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_portal_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_tenant_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "assistant_name" VARCHAR(64) NOT NULL DEFAULT 'Atlas',
    "assistant_avatar" TEXT,
    "personality" "AiPersonality" NOT NULL DEFAULT 'PROFESSIONAL',
    "custom_personality" TEXT,
    "tone_of_voice" "AiToneOfVoice" NOT NULL DEFAULT 'NEUTRAL',
    "language" VARCHAR(8) NOT NULL DEFAULT 'pt-BR',
    "greeting" TEXT,
    "enable_dedicated_chat" BOOLEAN NOT NULL DEFAULT true,
    "enable_inline_context" BOOLEAN NOT NULL DEFAULT true,
    "enable_command_bar" BOOLEAN NOT NULL DEFAULT true,
    "enable_voice" BOOLEAN NOT NULL DEFAULT false,
    "wake_word" TEXT,
    "tier1_provider" VARCHAR(32) NOT NULL DEFAULT 'GROQ_SMALL',
    "tier2_provider" VARCHAR(32) NOT NULL DEFAULT 'GROQ',
    "tier3_provider" VARCHAR(32) NOT NULL DEFAULT 'CLAUDE',
    "self_hosted_endpoint" TEXT,
    "tier1_api_key" TEXT,
    "tier2_api_key" TEXT,
    "tier3_api_key" TEXT,
    "can_execute_actions" BOOLEAN NOT NULL DEFAULT false,
    "require_confirmation" BOOLEAN NOT NULL DEFAULT true,
    "max_actions_per_minute" INTEGER NOT NULL DEFAULT 5,
    "enable_proactive_insights" BOOLEAN NOT NULL DEFAULT true,
    "insight_frequency" VARCHAR(16) NOT NULL DEFAULT 'DAILY',
    "enable_scheduled_reports" BOOLEAN NOT NULL DEFAULT false,
    "accessible_modules" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_tenant_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(256),
    "status" "AiConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "context" "AiConversationContext" NOT NULL DEFAULT 'DEDICATED',
    "context_module" VARCHAR(32),
    "context_entity_type" VARCHAR(64),
    "context_entity_id" TEXT,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMP(3),
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "content" TEXT,
    "content_type" "AiMessageContentType" NOT NULL DEFAULT 'TEXT',
    "render_data" JSONB,
    "attachments" JSONB,
    "ai_tier" INTEGER,
    "ai_model" VARCHAR(64),
    "ai_tokens_input" INTEGER,
    "ai_tokens_output" INTEGER,
    "ai_latency_ms" INTEGER,
    "ai_cost" DECIMAL(8,6),
    "tool_calls" JSONB,
    "actions_taken" JSONB,
    "audio_url" TEXT,
    "transcription" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_favorite_queries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "query" VARCHAR(512) NOT NULL,
    "shortcut" VARCHAR(64),
    "category" "AiFavoriteCategory" NOT NULL DEFAULT 'GENERAL',
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_favorite_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_action_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "message_id" TEXT,
    "action_type" VARCHAR(128) NOT NULL,
    "target_module" VARCHAR(32) NOT NULL,
    "target_entity_type" VARCHAR(64) NOT NULL,
    "target_entity_id" TEXT,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "status" "AiActionStatus" NOT NULL DEFAULT 'PROPOSED',
    "confirmed_by_user_id" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "executed_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "AiInsightType" NOT NULL,
    "priority" "AiInsightPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" VARCHAR(256) NOT NULL,
    "content" TEXT NOT NULL,
    "render_data" JSONB,
    "module" VARCHAR(32) NOT NULL,
    "related_entity_type" VARCHAR(64),
    "related_entity_id" TEXT,
    "target_user_ids" TEXT[],
    "status" "AiInsightStatus" NOT NULL DEFAULT 'NEW',
    "action_url" TEXT,
    "suggested_action" TEXT,
    "expires_at" TIMESTAMP(3),
    "viewed_at" TIMESTAMP(3),
    "acted_on_at" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),
    "ai_model" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_terminals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "device_id" VARCHAR(256) NOT NULL,
    "mode" "PosTerminalMode" NOT NULL,
    "cashier_mode" "PosCashierMode" NOT NULL DEFAULT 'INTEGRATED',
    "accepts_pending_orders" BOOLEAN NOT NULL DEFAULT false,
    "warehouse_id" TEXT NOT NULL,
    "default_price_table_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "last_online_at" TIMESTAMP(3),
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_terminals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_sessions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "terminal_id" TEXT NOT NULL,
    "operator_user_id" TEXT NOT NULL,
    "status" "PosSessionStatus" NOT NULL DEFAULT 'OPEN',
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "opening_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "closing_balance" DECIMAL(12,2),
    "expected_balance" DECIMAL(12,2),
    "difference" DECIMAL(12,2),
    "closing_breakdown" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "transaction_number" INTEGER NOT NULL,
    "status" "PosTransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(12,2) NOT NULL,
    "change_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "customer_id" TEXT,
    "customer_name" VARCHAR(128),
    "customer_document" VARCHAR(20),
    "override_by_user_id" TEXT,
    "override_reason" VARCHAR(256),
    "synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_transaction_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "method" "PosPaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "received_amount" DECIMAL(12,2),
    "change_amount" DECIMAL(12,2),
    "installments" INTEGER NOT NULL DEFAULT 1,
    "auth_code" VARCHAR(32),
    "nsu" VARCHAR(32),
    "pix_tx_id" VARCHAR(64),
    "payment_link_url" VARCHAR(512),
    "payment_link_status" "PosPaymentLinkStatus",
    "tef_transaction_id" VARCHAR(64),
    "notes" VARCHAR(256),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_transaction_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_cash_movements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "type" "PosCashMovementType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" VARCHAR(256),
    "performed_by_user_id" TEXT NOT NULL,
    "authorized_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_cash_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_offline_queue" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "terminal_id" TEXT NOT NULL,
    "operation_type" "PosOfflineOperationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "PosOfflineStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "pos_offline_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_visit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "address" VARCHAR(256),
    "check_in_at" TIMESTAMP(3) NOT NULL,
    "check_out_at" TIMESTAMP(3),
    "duration" INTEGER,
    "outcome" "PosVisitOutcome" NOT NULL,
    "order_id" TEXT,
    "notes" TEXT,
    "signature_file_id" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_visit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_integrations" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "type" "CardIntegrationType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_label" VARCHAR(256) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "card_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" VARCHAR(128) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "source" VARCHAR(64) NOT NULL,
    "source_entity_type" VARCHAR(64) NOT NULL,
    "source_entity_id" VARCHAR(64) NOT NULL,
    "data" JSONB NOT NULL,
    "metadata" JSONB,
    "correlation_id" VARCHAR(64),
    "causation_id" VARCHAR(64),
    "status" "event_log_status" NOT NULL DEFAULT 'PUBLISHED',
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
CREATE INDEX "crm_deals_tenant_id_idx" ON "crm_deals"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_deals_tenant_id_pipeline_id_idx" ON "crm_deals"("tenant_id", "pipeline_id");

-- CreateIndex
CREATE INDEX "crm_deals_tenant_id_customer_id_idx" ON "crm_deals"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "crm_deals_tenant_id_status_idx" ON "crm_deals"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "crm_deals_tenant_id_assigned_to_user_id_idx" ON "crm_deals"("tenant_id", "assigned_to_user_id");

-- CreateIndex
CREATE INDEX "crm_deals_tenant_id_stage_id_idx" ON "crm_deals"("tenant_id", "stage_id");

-- CreateIndex
CREATE INDEX "crm_activities_tenant_id_idx" ON "crm_activities"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_activities_tenant_id_deal_id_idx" ON "crm_activities"("tenant_id", "deal_id");

-- CreateIndex
CREATE INDEX "crm_activities_tenant_id_contact_id_idx" ON "crm_activities"("tenant_id", "contact_id");

-- CreateIndex
CREATE INDEX "crm_activities_tenant_id_user_id_idx" ON "crm_activities"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "crm_timeline_events_tenant_id_idx" ON "crm_timeline_events"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_timeline_events_deal_id_idx" ON "crm_timeline_events"("deal_id");

-- CreateIndex
CREATE INDEX "pipelines_tenant_id_idx" ON "pipelines"("tenant_id");

-- CreateIndex
CREATE INDEX "pipelines_tenant_id_type_idx" ON "pipelines"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "pipeline_stages_pipeline_id_idx" ON "pipeline_stages"("pipeline_id");

-- CreateIndex
CREATE INDEX "contacts_tenant_id_idx" ON "contacts"("tenant_id");

-- CreateIndex
CREATE INDEX "contacts_tenant_id_customer_id_idx" ON "contacts"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "contacts_tenant_id_lifecycle_stage_idx" ON "contacts"("tenant_id", "lifecycle_stage");

-- CreateIndex
CREATE INDEX "contacts_tenant_id_assigned_to_user_id_idx" ON "contacts"("tenant_id", "assigned_to_user_id");

-- CreateIndex
CREATE INDEX "contacts_tenant_id_lead_temperature_idx" ON "contacts"("tenant_id", "lead_temperature");

-- CreateIndex
CREATE INDEX "deals_tenant_id_idx" ON "deals"("tenant_id");

-- CreateIndex
CREATE INDEX "deals_tenant_id_pipeline_id_idx" ON "deals"("tenant_id", "pipeline_id");

-- CreateIndex
CREATE INDEX "deals_tenant_id_customer_id_idx" ON "deals"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "deals_tenant_id_status_idx" ON "deals"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "deals_tenant_id_assigned_to_user_id_idx" ON "deals"("tenant_id", "assigned_to_user_id");

-- CreateIndex
CREATE INDEX "deals_tenant_id_stage_id_idx" ON "deals"("tenant_id", "stage_id");

-- CreateIndex
CREATE INDEX "contact_deals_tenant_id_idx" ON "contact_deals"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "contact_deals_contact_id_deal_id_key" ON "contact_deals"("contact_id", "deal_id");

-- CreateIndex
CREATE INDEX "activities_tenant_id_idx" ON "activities"("tenant_id");

-- CreateIndex
CREATE INDEX "activities_tenant_id_contact_id_idx" ON "activities"("tenant_id", "contact_id");

-- CreateIndex
CREATE INDEX "activities_tenant_id_customer_id_idx" ON "activities"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "activities_tenant_id_deal_id_idx" ON "activities"("tenant_id", "deal_id");

-- CreateIndex
CREATE INDEX "activities_tenant_id_type_idx" ON "activities"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "timeline_events_tenant_id_idx" ON "timeline_events"("tenant_id");

-- CreateIndex
CREATE INDEX "timeline_events_tenant_id_contact_id_created_at_idx" ON "timeline_events"("tenant_id", "contact_id", "created_at");

-- CreateIndex
CREATE INDEX "timeline_events_tenant_id_customer_id_created_at_idx" ON "timeline_events"("tenant_id", "customer_id", "created_at");

-- CreateIndex
CREATE INDEX "timeline_events_tenant_id_deal_id_created_at_idx" ON "timeline_events"("tenant_id", "deal_id", "created_at");

-- CreateIndex
CREATE INDEX "company_documents_tenant_id_idx" ON "company_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "company_documents_company_id_idx" ON "company_documents"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_skill_definitions_code_key" ON "system_skill_definitions"("code");

-- CreateIndex
CREATE INDEX "system_skill_definitions_category_idx" ON "system_skill_definitions"("category");

-- CreateIndex
CREATE INDEX "system_skill_definitions_module_idx" ON "system_skill_definitions"("module");

-- CreateIndex
CREATE INDEX "system_skill_definitions_parent_skill_code_idx" ON "system_skill_definitions"("parent_skill_code");

-- CreateIndex
CREATE INDEX "system_skill_definitions_is_core_idx" ON "system_skill_definitions"("is_core");

-- CreateIndex
CREATE UNIQUE INDEX "skill_pricing_skill_code_key" ON "skill_pricing"("skill_code");

-- CreateIndex
CREATE INDEX "skill_pricing_pricingType_idx" ON "skill_pricing"("pricingType");

-- CreateIndex
CREATE INDEX "tenant_subscriptions_tenant_id_idx" ON "tenant_subscriptions"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_subscriptions_skill_code_idx" ON "tenant_subscriptions"("skill_code");

-- CreateIndex
CREATE INDEX "tenant_subscriptions_status_idx" ON "tenant_subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_subscriptions_tenant_id_skill_code_key" ON "tenant_subscriptions"("tenant_id", "skill_code");

-- CreateIndex
CREATE INDEX "tenant_consumptions_tenant_id_idx" ON "tenant_consumptions"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_consumptions_period_idx" ON "tenant_consumptions"("period");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_consumptions_tenant_id_period_metric_key" ON "tenant_consumptions"("tenant_id", "period", "metric");

-- CreateIndex
CREATE INDEX "tenant_billings_tenant_id_idx" ON "tenant_billings"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_billings_status_idx" ON "tenant_billings"("status");

-- CreateIndex
CREATE INDEX "tenant_billings_reference_month_idx" ON "tenant_billings"("reference_month");

-- CreateIndex
CREATE INDEX "tenant_billings_due_date_idx" ON "tenant_billings"("due_date");

-- CreateIndex
CREATE INDEX "tenant_integration_statuses_tenant_id_idx" ON "tenant_integration_statuses"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_integration_statuses_connection_status_idx" ON "tenant_integration_statuses"("connection_status");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_integration_statuses_tenant_id_integration_type_key" ON "tenant_integration_statuses"("tenant_id", "integration_type");

-- CreateIndex
CREATE UNIQUE INDEX "central_users_user_id_key" ON "central_users"("user_id");

-- CreateIndex
CREATE INDEX "central_users_role_idx" ON "central_users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_ticket_number_key" ON "support_tickets"("ticket_number");

-- CreateIndex
CREATE INDEX "support_tickets_tenant_id_idx" ON "support_tickets"("tenant_id");

-- CreateIndex
CREATE INDEX "support_tickets_creator_id_idx" ON "support_tickets"("creator_id");

-- CreateIndex
CREATE INDEX "support_tickets_assignee_id_idx" ON "support_tickets"("assignee_id");

-- CreateIndex
CREATE INDEX "support_tickets_status_idx" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "support_tickets_priority_idx" ON "support_tickets"("priority");

-- CreateIndex
CREATE INDEX "support_tickets_category_idx" ON "support_tickets"("category");

-- CreateIndex
CREATE INDEX "support_tickets_created_at_idx" ON "support_tickets"("created_at");

-- CreateIndex
CREATE INDEX "support_ticket_messages_ticket_id_idx" ON "support_ticket_messages"("ticket_id");

-- CreateIndex
CREATE INDEX "support_ticket_messages_author_id_idx" ON "support_ticket_messages"("author_id");

-- CreateIndex
CREATE INDEX "support_ticket_messages_created_at_idx" ON "support_ticket_messages"("created_at");

-- CreateIndex
CREATE INDEX "support_ticket_attachments_ticket_id_idx" ON "support_ticket_attachments"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "support_sla_configs_priority_key" ON "support_sla_configs"("priority");

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

-- CreateIndex
CREATE INDEX "orders_tenant_id_idx" ON "orders"("tenant_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_type_idx" ON "orders"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "orders_tenant_id_customer_id_idx" ON "orders"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_assigned_to_user_id_idx" ON "orders"("tenant_id", "assigned_to_user_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_stage_id_idx" ON "orders"("tenant_id", "stage_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_pipeline_id_idx" ON "orders"("tenant_id", "pipeline_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_channel_idx" ON "orders"("tenant_id", "channel");

-- CreateIndex
CREATE INDEX "orders_tenant_id_created_at_idx" ON "orders"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_tenant_id_order_number_key" ON "orders"("tenant_id", "order_number");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_tenant_id_idx" ON "order_items"("tenant_id");

-- CreateIndex
CREATE INDEX "order_items_order_id_variant_id_idx" ON "order_items"("order_id", "variant_id");

-- CreateIndex
CREATE INDEX "payment_conditions_tenant_id_idx" ON "payment_conditions"("tenant_id");

-- CreateIndex
CREATE INDEX "payment_conditions_tenant_id_is_active_idx" ON "payment_conditions"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "order_payments_order_id_idx" ON "order_payments"("order_id");

-- CreateIndex
CREATE INDEX "order_payments_tenant_id_idx" ON "order_payments"("tenant_id");

-- CreateIndex
CREATE INDEX "order_payments_tenant_id_status_idx" ON "order_payments"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "order_payments_tenant_id_due_date_idx" ON "order_payments"("tenant_id", "due_date");

-- CreateIndex
CREATE INDEX "order_payments_finance_entry_id_idx" ON "order_payments"("finance_entry_id");

-- CreateIndex
CREATE INDEX "order_deliveries_order_id_idx" ON "order_deliveries"("order_id");

-- CreateIndex
CREATE INDEX "order_deliveries_tenant_id_idx" ON "order_deliveries"("tenant_id");

-- CreateIndex
CREATE INDEX "order_deliveries_tracking_code_idx" ON "order_deliveries"("tracking_code");

-- CreateIndex
CREATE INDEX "order_delivery_items_delivery_id_idx" ON "order_delivery_items"("delivery_id");

-- CreateIndex
CREATE INDEX "order_delivery_items_tenant_id_idx" ON "order_delivery_items"("tenant_id");

-- CreateIndex
CREATE INDEX "order_returns_tenant_id_idx" ON "order_returns"("tenant_id");

-- CreateIndex
CREATE INDEX "order_returns_order_id_idx" ON "order_returns"("order_id");

-- CreateIndex
CREATE INDEX "order_returns_tenant_id_status_idx" ON "order_returns"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "order_returns_tenant_id_return_number_key" ON "order_returns"("tenant_id", "return_number");

-- CreateIndex
CREATE INDEX "order_return_items_return_id_idx" ON "order_return_items"("return_id");

-- CreateIndex
CREATE INDEX "order_return_items_tenant_id_idx" ON "order_return_items"("tenant_id");

-- CreateIndex
CREATE INDEX "store_credits_tenant_id_idx" ON "store_credits"("tenant_id");

-- CreateIndex
CREATE INDEX "store_credits_tenant_id_customer_id_idx" ON "store_credits"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "store_credits_tenant_id_customer_id_is_active_idx" ON "store_credits"("tenant_id", "customer_id", "is_active");

-- CreateIndex
CREATE INDEX "store_credit_usages_credit_id_idx" ON "store_credit_usages"("credit_id");

-- CreateIndex
CREATE INDEX "store_credit_usages_order_id_idx" ON "store_credit_usages"("order_id");

-- CreateIndex
CREATE INDEX "store_credit_usages_tenant_id_idx" ON "store_credit_usages"("tenant_id");

-- CreateIndex
CREATE INDEX "customer_credit_limits_tenant_id_idx" ON "customer_credit_limits"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_credit_limits_tenant_id_customer_id_key" ON "customer_credit_limits"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "approval_rules_tenant_id_idx" ON "approval_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "approval_rules_tenant_id_is_active_idx" ON "approval_rules"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "order_commissions_order_id_idx" ON "order_commissions"("order_id");

-- CreateIndex
CREATE INDEX "order_commissions_tenant_id_idx" ON "order_commissions"("tenant_id");

-- CreateIndex
CREATE INDEX "order_commissions_tenant_id_user_id_idx" ON "order_commissions"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "order_commissions_tenant_id_status_idx" ON "order_commissions"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "commission_rules_tenant_id_idx" ON "commission_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "commission_rules_tenant_id_is_active_idx" ON "commission_rules"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "order_history_order_id_idx" ON "order_history"("order_id");

-- CreateIndex
CREATE INDEX "order_history_tenant_id_idx" ON "order_history"("tenant_id");

-- CreateIndex
CREATE INDEX "order_history_order_id_created_at_idx" ON "order_history"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "digital_certificates_tenant_id_idx" ON "digital_certificates"("tenant_id");

-- CreateIndex
CREATE INDEX "digital_certificates_tenant_id_status_idx" ON "digital_certificates"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "digital_certificates_tenant_id_valid_until_idx" ON "digital_certificates"("tenant_id", "valid_until");

-- CreateIndex
CREATE INDEX "signature_envelopes_tenant_id_idx" ON "signature_envelopes"("tenant_id");

-- CreateIndex
CREATE INDEX "signature_envelopes_tenant_id_status_idx" ON "signature_envelopes"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "signature_envelopes_tenant_id_source_module_source_entity_i_idx" ON "signature_envelopes"("tenant_id", "source_module", "source_entity_id");

-- CreateIndex
CREATE INDEX "signature_envelopes_tenant_id_created_by_user_id_idx" ON "signature_envelopes"("tenant_id", "created_by_user_id");

-- CreateIndex
CREATE INDEX "signature_envelope_signers_envelope_id_idx" ON "signature_envelope_signers"("envelope_id");

-- CreateIndex
CREATE INDEX "signature_envelope_signers_tenant_id_idx" ON "signature_envelope_signers"("tenant_id");

-- CreateIndex
CREATE INDEX "signature_envelope_signers_envelope_id_order_group_idx" ON "signature_envelope_signers"("envelope_id", "order", "group");

-- CreateIndex
CREATE INDEX "signature_envelope_signers_access_token_idx" ON "signature_envelope_signers"("access_token");

-- CreateIndex
CREATE INDEX "signature_envelope_signers_user_id_idx" ON "signature_envelope_signers"("user_id");

-- CreateIndex
CREATE INDEX "signature_envelope_signers_tenant_id_status_idx" ON "signature_envelope_signers"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "signature_audit_events_envelope_id_idx" ON "signature_audit_events"("envelope_id");

-- CreateIndex
CREATE INDEX "signature_audit_events_tenant_id_idx" ON "signature_audit_events"("tenant_id");

-- CreateIndex
CREATE INDEX "signature_audit_events_envelope_id_timestamp_idx" ON "signature_audit_events"("envelope_id", "timestamp");

-- CreateIndex
CREATE INDEX "signature_templates_tenant_id_idx" ON "signature_templates"("tenant_id");

-- CreateIndex
CREATE INDEX "analytics_widgets_tenant_id_idx" ON "analytics_widgets"("tenant_id");

-- CreateIndex
CREATE INDEX "analytics_dashboards_tenant_id_idx" ON "analytics_dashboards"("tenant_id");

-- CreateIndex
CREATE INDEX "analytics_dashboards_tenant_id_role_idx" ON "analytics_dashboards"("tenant_id", "role");

-- CreateIndex
CREATE INDEX "analytics_dashboards_tenant_id_created_by_user_id_idx" ON "analytics_dashboards"("tenant_id", "created_by_user_id");

-- CreateIndex
CREATE INDEX "analytics_dashboard_widgets_dashboard_id_idx" ON "analytics_dashboard_widgets"("dashboard_id");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_dashboard_widgets_dashboard_id_widget_id_key" ON "analytics_dashboard_widgets"("dashboard_id", "widget_id");

-- CreateIndex
CREATE INDEX "analytics_goals_tenant_id_idx" ON "analytics_goals"("tenant_id");

-- CreateIndex
CREATE INDEX "analytics_goals_tenant_id_status_idx" ON "analytics_goals"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "analytics_goals_tenant_id_user_id_idx" ON "analytics_goals"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "analytics_goals_tenant_id_period_start_date_idx" ON "analytics_goals"("tenant_id", "period", "start_date");

-- CreateIndex
CREATE INDEX "analytics_reports_tenant_id_idx" ON "analytics_reports"("tenant_id");

-- CreateIndex
CREATE INDEX "analytics_reports_tenant_id_is_scheduled_is_active_idx" ON "analytics_reports"("tenant_id", "is_scheduled", "is_active");

-- CreateIndex
CREATE INDEX "analytics_report_generations_report_id_idx" ON "analytics_report_generations"("report_id");

-- CreateIndex
CREATE INDEX "analytics_report_generations_tenant_id_idx" ON "analytics_report_generations"("tenant_id");

-- CreateIndex
CREATE INDEX "analytics_report_generations_report_id_generated_at_idx" ON "analytics_report_generations"("report_id", "generated_at");

-- CreateIndex
CREATE UNIQUE INDEX "customer_portal_accesses_access_token_key" ON "customer_portal_accesses"("access_token");

-- CreateIndex
CREATE INDEX "customer_portal_accesses_tenant_id_idx" ON "customer_portal_accesses"("tenant_id");

-- CreateIndex
CREATE INDEX "customer_portal_accesses_tenant_id_customer_id_idx" ON "customer_portal_accesses"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "customer_portal_accesses_access_token_idx" ON "customer_portal_accesses"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "ai_tenant_configs_tenant_id_key" ON "ai_tenant_configs"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_conversations_tenant_id_idx" ON "ai_conversations"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_conversations_user_id_idx" ON "ai_conversations"("user_id");

-- CreateIndex
CREATE INDEX "ai_conversations_tenant_id_user_id_status_idx" ON "ai_conversations"("tenant_id", "user_id", "status");

-- CreateIndex
CREATE INDEX "ai_conversations_tenant_id_updated_at_idx" ON "ai_conversations"("tenant_id", "updated_at");

-- CreateIndex
CREATE INDEX "ai_messages_conversation_id_idx" ON "ai_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "ai_messages_conversation_id_created_at_idx" ON "ai_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_favorite_queries_tenant_id_user_id_idx" ON "ai_favorite_queries"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "ai_action_logs_tenant_id_idx" ON "ai_action_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_action_logs_tenant_id_user_id_idx" ON "ai_action_logs"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "ai_action_logs_tenant_id_status_idx" ON "ai_action_logs"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "ai_insights_tenant_id_idx" ON "ai_insights"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_insights_tenant_id_status_idx" ON "ai_insights"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "ai_insights_tenant_id_type_idx" ON "ai_insights"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "ai_insights_tenant_id_priority_status_idx" ON "ai_insights"("tenant_id", "priority", "status");

-- CreateIndex
CREATE INDEX "pos_terminals_tenant_id_idx" ON "pos_terminals"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_terminals_tenant_id_is_active_idx" ON "pos_terminals"("tenant_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "pos_terminals_tenant_id_device_id_key" ON "pos_terminals"("tenant_id", "device_id");

-- CreateIndex
CREATE INDEX "pos_sessions_tenant_id_idx" ON "pos_sessions"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_sessions_terminal_id_idx" ON "pos_sessions"("terminal_id");

-- CreateIndex
CREATE INDEX "pos_sessions_tenant_id_status_idx" ON "pos_sessions"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "pos_transactions_tenant_id_idx" ON "pos_transactions"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_transactions_session_id_idx" ON "pos_transactions"("session_id");

-- CreateIndex
CREATE INDEX "pos_transactions_order_id_idx" ON "pos_transactions"("order_id");

-- CreateIndex
CREATE INDEX "pos_transactions_tenant_id_synced_at_idx" ON "pos_transactions"("tenant_id", "synced_at");

-- CreateIndex
CREATE UNIQUE INDEX "pos_transactions_session_id_transaction_number_key" ON "pos_transactions"("session_id", "transaction_number");

-- CreateIndex
CREATE INDEX "pos_transaction_payments_transaction_id_idx" ON "pos_transaction_payments"("transaction_id");

-- CreateIndex
CREATE INDEX "pos_transaction_payments_tenant_id_idx" ON "pos_transaction_payments"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_cash_movements_session_id_idx" ON "pos_cash_movements"("session_id");

-- CreateIndex
CREATE INDEX "pos_cash_movements_tenant_id_idx" ON "pos_cash_movements"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_offline_queue_tenant_id_idx" ON "pos_offline_queue"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_offline_queue_tenant_id_status_idx" ON "pos_offline_queue"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "pos_offline_queue_terminal_id_status_idx" ON "pos_offline_queue"("terminal_id", "status");

-- CreateIndex
CREATE INDEX "pos_visit_logs_tenant_id_idx" ON "pos_visit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_visit_logs_tenant_id_user_id_idx" ON "pos_visit_logs"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "pos_visit_logs_tenant_id_customer_id_idx" ON "pos_visit_logs"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "pos_visit_logs_tenant_id_check_in_at_idx" ON "pos_visit_logs"("tenant_id", "check_in_at");

-- CreateIndex
CREATE INDEX "card_integrations_card_id_idx" ON "card_integrations"("card_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_integrations_card_id_type_entity_id_key" ON "card_integrations"("card_id", "type", "entity_id");

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

-- CreateIndex
CREATE INDEX "board_members_user_id_idx" ON "board_members"("user_id");

-- CreateIndex
CREATE INDEX "customers_tenant_id_source_idx" ON "customers"("tenant_id", "source");

-- CreateIndex
CREATE INDEX "customers_tenant_id_assigned_to_user_id_idx" ON "customers"("tenant_id", "assigned_to_user_id");

-- CreateIndex
CREATE INDEX "tenant_feature_flags_category_idx" ON "tenant_feature_flags"("category");

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
ALTER TABLE "customers" ADD CONSTRAINT "customers_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "crm_pipelines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "crm_pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_deals" ADD CONSTRAINT "crm_deals_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "crm_deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_timeline_events" ADD CONSTRAINT "crm_timeline_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_timeline_events" ADD CONSTRAINT "crm_timeline_events_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "crm_deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_timeline_events" ADD CONSTRAINT "crm_timeline_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipelines" ADD CONSTRAINT "pipelines_next_pipeline_id_fkey" FOREIGN KEY ("next_pipeline_id") REFERENCES "pipelines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "pipelines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_previous_deal_id_fkey" FOREIGN KEY ("previous_deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_deals" ADD CONSTRAINT "contact_deals_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_deals" ADD CONSTRAINT "contact_deals_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_performed_by_user_id_fkey" FOREIGN KEY ("performed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_documents" ADD CONSTRAINT "company_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_documents" ADD CONSTRAINT "company_documents_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_skill_definitions" ADD CONSTRAINT "system_skill_definitions_parent_skill_code_fkey" FOREIGN KEY ("parent_skill_code") REFERENCES "system_skill_definitions"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_pricing" ADD CONSTRAINT "skill_pricing_skill_code_fkey" FOREIGN KEY ("skill_code") REFERENCES "system_skill_definitions"("code") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_subscriptions" ADD CONSTRAINT "tenant_subscriptions_skill_code_fkey" FOREIGN KEY ("skill_code") REFERENCES "system_skill_definitions"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_consumptions" ADD CONSTRAINT "tenant_consumptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_billings" ADD CONSTRAINT "tenant_billings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_integration_statuses" ADD CONSTRAINT "tenant_integration_statuses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "central_users" ADD CONSTRAINT "central_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_ticket_attachments" ADD CONSTRAINT "support_ticket_attachments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "crm_pipelines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "crm_pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_price_table_id_fkey" FOREIGN KEY ("price_table_id") REFERENCES "price_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_condition_id_fkey" FOREIGN KEY ("payment_condition_id") REFERENCES "payment_conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_return_origin_id_fkey" FOREIGN KEY ("return_origin_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_source_warehouse_id_fkey" FOREIGN KEY ("source_warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "combos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_conditions" ADD CONSTRAINT "payment_conditions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_deliveries" ADD CONSTRAINT "order_deliveries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_delivery_items" ADD CONSTRAINT "order_delivery_items_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "order_deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_delivery_items" ADD CONSTRAINT "order_delivery_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_delivery_items" ADD CONSTRAINT "order_delivery_items_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_return_items" ADD CONSTRAINT "order_return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "order_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_return_items" ADD CONSTRAINT "order_return_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_credits" ADD CONSTRAINT "store_credits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_credits" ADD CONSTRAINT "store_credits_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_credits" ADD CONSTRAINT "store_credits_reserved_for_order_id_fkey" FOREIGN KEY ("reserved_for_order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_credit_usages" ADD CONSTRAINT "store_credit_usages_credit_id_fkey" FOREIGN KEY ("credit_id") REFERENCES "store_credits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_credit_usages" ADD CONSTRAINT "store_credit_usages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credit_limits" ADD CONSTRAINT "customer_credit_limits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credit_limits" ADD CONSTRAINT "customer_credit_limits_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credit_limits" ADD CONSTRAINT "customer_credit_limits_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_rules" ADD CONSTRAINT "approval_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_commissions" ADD CONSTRAINT "order_commissions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_commissions" ADD CONSTRAINT "order_commissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_history" ADD CONSTRAINT "order_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_history" ADD CONSTRAINT "order_history_performed_by_user_id_fkey" FOREIGN KEY ("performed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_certificates" ADD CONSTRAINT "digital_certificates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_certificates" ADD CONSTRAINT "digital_certificates_pfx_file_id_fkey" FOREIGN KEY ("pfx_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_envelopes" ADD CONSTRAINT "signature_envelopes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_envelopes" ADD CONSTRAINT "signature_envelopes_document_file_id_fkey" FOREIGN KEY ("document_file_id") REFERENCES "storage_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_envelopes" ADD CONSTRAINT "signature_envelopes_signed_file_id_fkey" FOREIGN KEY ("signed_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_envelopes" ADD CONSTRAINT "signature_envelopes_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_envelope_signers" ADD CONSTRAINT "signature_envelope_signers_envelope_id_fkey" FOREIGN KEY ("envelope_id") REFERENCES "signature_envelopes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_envelope_signers" ADD CONSTRAINT "signature_envelope_signers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_envelope_signers" ADD CONSTRAINT "signature_envelope_signers_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_envelope_signers" ADD CONSTRAINT "signature_envelope_signers_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "digital_certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_envelope_signers" ADD CONSTRAINT "signature_envelope_signers_signature_image_file_id_fkey" FOREIGN KEY ("signature_image_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_audit_events" ADD CONSTRAINT "signature_audit_events_envelope_id_fkey" FOREIGN KEY ("envelope_id") REFERENCES "signature_envelopes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_templates" ADD CONSTRAINT "signature_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_widgets" ADD CONSTRAINT "analytics_widgets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_widgets" ADD CONSTRAINT "analytics_widgets_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_dashboards" ADD CONSTRAINT "analytics_dashboards_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_dashboards" ADD CONSTRAINT "analytics_dashboards_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_dashboard_widgets" ADD CONSTRAINT "analytics_dashboard_widgets_dashboard_id_fkey" FOREIGN KEY ("dashboard_id") REFERENCES "analytics_dashboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_dashboard_widgets" ADD CONSTRAINT "analytics_dashboard_widgets_widget_id_fkey" FOREIGN KEY ("widget_id") REFERENCES "analytics_widgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_goals" ADD CONSTRAINT "analytics_goals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_goals" ADD CONSTRAINT "analytics_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_goals" ADD CONSTRAINT "analytics_goals_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_goals" ADD CONSTRAINT "analytics_goals_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_reports" ADD CONSTRAINT "analytics_reports_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_reports" ADD CONSTRAINT "analytics_reports_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_reports" ADD CONSTRAINT "analytics_reports_dashboard_id_fkey" FOREIGN KEY ("dashboard_id") REFERENCES "analytics_dashboards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_reports" ADD CONSTRAINT "analytics_reports_last_file_id_fkey" FOREIGN KEY ("last_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_report_generations" ADD CONSTRAINT "analytics_report_generations_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "analytics_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_report_generations" ADD CONSTRAINT "analytics_report_generations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_report_generations" ADD CONSTRAINT "analytics_report_generations_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_portal_accesses" ADD CONSTRAINT "customer_portal_accesses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_portal_accesses" ADD CONSTRAINT "customer_portal_accesses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_portal_accesses" ADD CONSTRAINT "customer_portal_accesses_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_tenant_configs" ADD CONSTRAINT "ai_tenant_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_favorite_queries" ADD CONSTRAINT "ai_favorite_queries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_favorite_queries" ADD CONSTRAINT "ai_favorite_queries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_action_logs" ADD CONSTRAINT "ai_action_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_action_logs" ADD CONSTRAINT "ai_action_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_action_logs" ADD CONSTRAINT "ai_action_logs_confirmed_by_user_id_fkey" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_default_price_table_id_fkey" FOREIGN KEY ("default_price_table_id") REFERENCES "price_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "pos_terminals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_operator_user_id_fkey" FOREIGN KEY ("operator_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "pos_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transaction_payments" ADD CONSTRAINT "pos_transaction_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "pos_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_cash_movements" ADD CONSTRAINT "pos_cash_movements_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "pos_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_cash_movements" ADD CONSTRAINT "pos_cash_movements_performed_by_user_id_fkey" FOREIGN KEY ("performed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_cash_movements" ADD CONSTRAINT "pos_cash_movements_authorized_by_user_id_fkey" FOREIGN KEY ("authorized_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_offline_queue" ADD CONSTRAINT "pos_offline_queue_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "pos_terminals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_visit_logs" ADD CONSTRAINT "pos_visit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_visit_logs" ADD CONSTRAINT "pos_visit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_visit_logs" ADD CONSTRAINT "pos_visit_logs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_visit_logs" ADD CONSTRAINT "pos_visit_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_visit_logs" ADD CONSTRAINT "pos_visit_logs_signature_file_id_fkey" FOREIGN KEY ("signature_file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_integrations" ADD CONSTRAINT "card_integrations_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_integrations" ADD CONSTRAINT "card_integrations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

