-- CreateEnum
CREATE TYPE "ContactRole" AS ENUM ('DECISION_MAKER', 'INFLUENCER', 'CHAMPION', 'GATEKEEPER', 'END_USER', 'OTHER');

-- CreateEnum
CREATE TYPE "LifecycleStage" AS ENUM ('SUBSCRIBER', 'LEAD', 'QUALIFIED', 'OPPORTUNITY', 'CUSTOMER', 'EVANGELIST');

-- CreateEnum
CREATE TYPE "LeadTemperature" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateEnum
CREATE TYPE "ContactSource" AS ENUM ('MANUAL', 'IMPORT', 'FORM', 'WHATSAPP', 'INSTAGRAM', 'TELEGRAM', 'SMS', 'WEBCHAT', 'EMAIL', 'PDV', 'MARKETPLACE', 'BID', 'API');

-- CreateEnum
CREATE TYPE "PipelineType" AS ENUM ('SALES', 'ONBOARDING', 'SUPPORT', 'CUSTOM', 'ORDER_B2C', 'ORDER_B2B', 'ORDER_BID', 'ORDER_ECOMMERCE');

-- CreateEnum
CREATE TYPE "PipelineStageType" AS ENUM ('OPEN', 'WON', 'LOST', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PROCESSING', 'INVOICED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('OPEN', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('NOTE', 'CALL', 'MEETING', 'TASK', 'EMAIL_SENT', 'EMAIL_RECEIVED');

-- CreateEnum
CREATE TYPE "ActivityOutcome" AS ENUM ('ANSWERED', 'NO_ANSWER', 'VOICEMAIL', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('STAGE_CHANGE', 'LIFECYCLE_CHANGE', 'DEAL_CREATED', 'DEAL_WON', 'DEAL_LOST', 'SCORE_CHANGE', 'ASSIGNMENT_CHANGE', 'AI_INSIGHT', 'SYSTEM_EVENT', 'EXTERNAL_EVENT');

-- CreateEnum
CREATE TYPE "TimelineEventSource" AS ENUM ('SYSTEM', 'AI', 'EXTERNAL_MODULE');

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
CREATE INDEX "customers_tenant_id_source_idx" ON "customers"("tenant_id", "source");

-- CreateIndex
CREATE INDEX "customers_tenant_id_assigned_to_user_id_idx" ON "customers"("tenant_id", "assigned_to_user_id");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

