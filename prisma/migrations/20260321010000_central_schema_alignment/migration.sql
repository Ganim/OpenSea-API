-- AlterTable - SkillPricing: add pricing detail fields
ALTER TABLE "skill_pricing" ADD COLUMN IF NOT EXISTS "unit_metric" VARCHAR(64),
ADD COLUMN IF NOT EXISTS "unit_metric_label" VARCHAR(64),
ADD COLUMN IF NOT EXISTS "usage_included" INTEGER,
ADD COLUMN IF NOT EXISTS "usage_price" DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS "usage_metric_label" VARCHAR(64),
ADD COLUMN IF NOT EXISTS "annual_discount" DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable - TenantSubscription: add custom pricing and grant fields
ALTER TABLE "tenant_subscriptions" ADD COLUMN IF NOT EXISTS "custom_price" DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS "discount_percent" DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS "notes" VARCHAR(500),
ADD COLUMN IF NOT EXISTS "granted_by" TEXT;

-- AlterTable - TenantConsumption: add usage tracking fields
ALTER TABLE "tenant_consumptions" ADD COLUMN IF NOT EXISTS "used" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "included" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "overage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "overage_cost" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- AlterTable - SupportTicketMessage: add internal note flag
ALTER TABLE "support_ticket_messages" ADD COLUMN IF NOT EXISTS "is_internal" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable - SystemSkillDefinition: add setup and ordering fields
ALTER TABLE "system_skill_definitions" ADD COLUMN IF NOT EXISTS "requires_setup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "setup_url" VARCHAR(500),
ADD COLUMN IF NOT EXISTS "sort_order" INTEGER NOT NULL DEFAULT 0;
