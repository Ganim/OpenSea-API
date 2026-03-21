-- CreateEnum
CREATE TYPE "WidgetType" AS ENUM ('KPI_CARD', 'BAR_CHART', 'LINE_CHART', 'PIE_CHART', 'FUNNEL', 'TABLE', 'HEATMAP', 'SCATTER', 'GAUGE', 'RANKING', 'COMPARISON', 'TREND');

-- CreateEnum
CREATE TYPE "WidgetDataSource" AS ENUM ('ORDERS', 'DEALS', 'CONTACTS', 'CUSTOMERS', 'PRODUCTS', 'COMMISSIONS', 'CAMPAIGNS', 'BIDS', 'MARKETPLACE', 'CASHIER', 'CUSTOM_QUERY');

-- CreateEnum
CREATE TYPE "DashboardRole" AS ENUM ('SELLER', 'MANAGER', 'DIRECTOR', 'BID_SPECIALIST', 'MARKETPLACE_OPS', 'CASHIER');

-- CreateEnum
CREATE TYPE "DashboardVisibility" AS ENUM ('PRIVATE', 'TEAM', 'TENANT');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('REVENUE', 'QUANTITY', 'DEALS_WON', 'NEW_CUSTOMERS', 'TICKET_AVERAGE', 'CONVERSION_RATE', 'COMMISSION', 'BID_WIN_RATE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GoalPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GoalScope" AS ENUM ('INDIVIDUAL', 'TEAM', 'TENANT');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'ACHIEVED', 'MISSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('SALES_SUMMARY', 'COMMISSION_REPORT', 'PIPELINE_REPORT', 'PRODUCT_PERFORMANCE', 'CUSTOMER_ANALYSIS', 'BID_REPORT', 'MARKETPLACE_REPORT', 'CASHIER_REPORT', 'GOAL_PROGRESS', 'CURVA_ABC', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'EXCEL', 'CSV');

-- CreateEnum
CREATE TYPE "ReportFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "ReportDeliveryMethod" AS ENUM ('EMAIL', 'WHATSAPP', 'BOTH', 'DOWNLOAD_ONLY');

-- CreateEnum
CREATE TYPE "ReportGenerationStatus" AS ENUM ('GENERATING', 'SUCCESS', 'FAILED');

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
ALTER TABLE "analytics_report_generations" ADD CONSTRAINT "analytics_report_generations_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_portal_accesses" ADD CONSTRAINT "customer_portal_accesses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_portal_accesses" ADD CONSTRAINT "customer_portal_accesses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_portal_accesses" ADD CONSTRAINT "customer_portal_accesses_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
