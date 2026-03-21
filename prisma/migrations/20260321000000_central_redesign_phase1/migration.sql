-- CreateEnum
CREATE TYPE "SkillCategory" AS ENUM ('MODULE', 'CHANNEL', 'AI', 'INTEGRATION', 'FEATURE');

-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('FLAT', 'PER_UNIT', 'USAGE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'TRIAL', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('WHATSAPP', 'INSTAGRAM', 'TELEGRAM', 'SMS', 'MARKETPLACE_ML', 'MARKETPLACE_SHOPEE', 'MARKETPLACE_AMAZON', 'BID_PORTAL', 'EMAIL_IMAP', 'CERTIFICATE_A1', 'CERTIFICATE_CLOUD', 'TEF', 'OLLAMA', 'SEFAZ');

-- CreateEnum
CREATE TYPE "IntegrationConnectionStatus" AS ENUM ('CONNECTED', 'DISCONNECTED', 'ERROR', 'NOT_CONFIGURED');

-- CreateEnum
CREATE TYPE "CentralUserRole" AS ENUM ('OWNER', 'ADMIN', 'SUPPORT', 'FINANCE', 'VIEWER');

-- CreateEnum
CREATE TYPE "FeatureFlagCategory" AS ENUM ('BETA', 'EXPERIMENT', 'ROLLOUT', 'INTERNAL');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('BUG', 'QUESTION', 'REQUEST', 'FINANCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketAuthorType" AS ENUM ('TENANT_USER', 'CENTRAL_TEAM', 'AI_ASSISTANT');

-- AlterEnum
BEGIN;
CREATE TYPE "OrganizationType_new" AS ENUM ('COMPANY', 'CUSTOMER');
ALTER TABLE "organizations" ALTER COLUMN "type" TYPE "OrganizationType_new" USING ("type"::text::"OrganizationType_new");
ALTER TYPE "OrganizationType" RENAME TO "OrganizationType_old";
ALTER TYPE "OrganizationType_new" RENAME TO "OrganizationType";
DROP TYPE "public"."OrganizationType_old";
COMMIT;

-- AlterTable
ALTER TABLE "tenant_feature_flags" ADD COLUMN     "category" "FeatureFlagCategory" NOT NULL DEFAULT 'BETA',
ADD COLUMN     "enabled_by_user_id" TEXT,
ADD COLUMN     "expires_at" TIMESTAMP(3),
ADD COLUMN     "notes" VARCHAR(500);

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
CREATE INDEX "tenant_feature_flags_category_idx" ON "tenant_feature_flags"("category");

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

