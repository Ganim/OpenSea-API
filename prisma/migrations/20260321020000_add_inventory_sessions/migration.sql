-- =============================================
-- CRM Base (enums + tables that were applied via db push)
-- =============================================

-- CreateEnum
CREATE TYPE "ContactLifecycleStage" AS ENUM ('LEAD', 'MQL', 'SQL', 'OPPORTUNITY', 'CUSTOMER', 'EVANGELIST', 'CHURNED');

-- CreateEnum
CREATE TYPE "ContactRole" AS ENUM ('DECISION_MAKER', 'INFLUENCER', 'TECHNICAL', 'FINANCIAL', 'LEGAL', 'END_USER', 'OTHER');

-- CreateEnum
CREATE TYPE "PipelineType" AS ENUM ('SALES', 'SUPPORT', 'ONBOARDING', 'RENEWAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PipelineStageType" AS ENUM ('OPEN', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('OPEN', 'WON', 'LOST', 'ABANDONED');

-- CreateEnum
CREATE TYPE "DealPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CrmActivityType" AS ENUM ('CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE', 'WHATSAPP', 'VISIT', 'PROPOSAL', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "CrmActivityStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('DEAL_CREATED', 'DEAL_UPDATED', 'DEAL_WON', 'DEAL_LOST', 'STAGE_CHANGED', 'ACTIVITY_CREATED', 'ACTIVITY_COMPLETED', 'NOTE_ADDED', 'EMAIL_SENT', 'CONTACT_ADDED', 'VALUE_CHANGED', 'OWNER_CHANGED');

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

-- CreateIndex (board_members drift fix)
CREATE INDEX "board_members_user_id_idx" ON "board_members"("user_id");

-- =============================================
-- Inventory Session + PurchaseOrder receivedQuantity
-- =============================================

-- CreateEnum
CREATE TYPE "inventory_session_mode" AS ENUM ('BIN', 'ZONE', 'PRODUCT');

-- CreateEnum
CREATE TYPE "inventory_session_status" AS ENUM ('OPEN', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "inventory_item_status" AS ENUM ('PENDING', 'CONFIRMED', 'MISSING', 'EXTRA', 'WRONG_BIN');

-- CreateEnum
CREATE TYPE "inventory_item_resolution" AS ENUM ('LOSS_REGISTERED', 'TRANSFERRED', 'ENTRY_CREATED', 'PENDING_REVIEW');

-- AlterTable
ALTER TABLE "purchase_order_items" ADD COLUMN     "received_quantity" DECIMAL(10,3) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "inventory_sessions" (
    "id" TEXT NOT NULL,
    "mode" "inventory_session_mode" NOT NULL,
    "status" "inventory_session_status" NOT NULL DEFAULT 'OPEN',
    "scope" JSONB NOT NULL,
    "total_items" INTEGER NOT NULL DEFAULT 0,
    "confirmed_items" INTEGER NOT NULL DEFAULT 0,
    "divergences" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paused_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "started_by" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,

    CONSTRAINT "inventory_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_session_items" (
    "id" TEXT NOT NULL,
    "status" "inventory_item_status" NOT NULL DEFAULT 'PENDING',
    "resolution" "inventory_item_resolution",
    "notes" TEXT,
    "scanned_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" TEXT NOT NULL,
    "item_id" TEXT,
    "bin_id" TEXT NOT NULL,
    "resolved_by" TEXT,

    CONSTRAINT "inventory_session_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_sessions_tenant_id_status_idx" ON "inventory_sessions"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "inventory_sessions_started_by_idx" ON "inventory_sessions"("started_by");

-- CreateIndex
CREATE INDEX "inventory_session_items_session_id_status_idx" ON "inventory_session_items"("session_id", "status");

-- CreateIndex
CREATE INDEX "inventory_session_items_item_id_idx" ON "inventory_session_items"("item_id");

-- AddForeignKey
ALTER TABLE "inventory_sessions" ADD CONSTRAINT "inventory_sessions_started_by_fkey" FOREIGN KEY ("started_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_session_items" ADD CONSTRAINT "inventory_session_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "inventory_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_session_items" ADD CONSTRAINT "inventory_session_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_session_items" ADD CONSTRAINT "inventory_session_items_bin_id_fkey" FOREIGN KEY ("bin_id") REFERENCES "bins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_session_items" ADD CONSTRAINT "inventory_session_items_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================
-- CRM Deals, Activities, Timeline
-- =============================================

-- CreateTable
CREATE TABLE "crm_deals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "customer_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "pipeline_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "status" "DealStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "DealPriority" NOT NULL DEFAULT 'MEDIUM',
    "value" DECIMAL(15,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "expected_close_date" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "lost_reason" VARCHAR(500),
    "source" VARCHAR(100),
    "tags" JSONB NOT NULL DEFAULT '[]',
    "custom_fields" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,
    "assigned_to_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_activities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "deal_id" TEXT,
    "contact_id" TEXT,
    "type" "CrmActivityType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "CrmActivityStatus" NOT NULL DEFAULT 'PLANNED',
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration" INTEGER,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_timeline_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "type" "TimelineEventType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "metadata" JSONB,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crm_deals_tenant_id_idx" ON "crm_deals"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_deals_tenant_id_deleted_at_idx" ON "crm_deals"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "crm_deals_customer_id_idx" ON "crm_deals"("customer_id");

-- CreateIndex
CREATE INDEX "crm_deals_pipeline_id_idx" ON "crm_deals"("pipeline_id");

-- CreateIndex
CREATE INDEX "crm_deals_stage_id_idx" ON "crm_deals"("stage_id");

-- CreateIndex
CREATE INDEX "crm_deals_assigned_to_user_id_idx" ON "crm_deals"("assigned_to_user_id");

-- CreateIndex
CREATE INDEX "crm_deals_status_idx" ON "crm_deals"("status");

-- CreateIndex
CREATE INDEX "crm_activities_tenant_id_idx" ON "crm_activities"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_activities_tenant_id_deleted_at_idx" ON "crm_activities"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "crm_activities_deal_id_idx" ON "crm_activities"("deal_id");

-- CreateIndex
CREATE INDEX "crm_activities_contact_id_idx" ON "crm_activities"("contact_id");

-- CreateIndex
CREATE INDEX "crm_activities_user_id_idx" ON "crm_activities"("user_id");

-- CreateIndex
CREATE INDEX "crm_activities_status_idx" ON "crm_activities"("status");

-- CreateIndex
CREATE INDEX "crm_activities_due_date_idx" ON "crm_activities"("due_date");

-- CreateIndex
CREATE INDEX "crm_timeline_events_tenant_id_idx" ON "crm_timeline_events"("tenant_id");

-- CreateIndex
CREATE INDEX "crm_timeline_events_deal_id_idx" ON "crm_timeline_events"("deal_id");

-- CreateIndex
CREATE INDEX "crm_timeline_events_deal_id_created_at_idx" ON "crm_timeline_events"("deal_id", "created_at");

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
