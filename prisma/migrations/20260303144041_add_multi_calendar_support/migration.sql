-- CreateEnum
CREATE TYPE "calendar_type" AS ENUM ('PERSONAL', 'TEAM', 'SYSTEM');

-- CreateTable
CREATE TABLE "calendars" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7),
    "type" "calendar_type" NOT NULL,
    "owner_id" VARCHAR(36),
    "system_module" VARCHAR(32),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_calendar_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "calendar_id" TEXT NOT NULL,
    "owner_can_read" BOOLEAN NOT NULL DEFAULT true,
    "owner_can_create" BOOLEAN NOT NULL DEFAULT true,
    "owner_can_edit" BOOLEAN NOT NULL DEFAULT true,
    "owner_can_delete" BOOLEAN NOT NULL DEFAULT true,
    "owner_can_share" BOOLEAN NOT NULL DEFAULT true,
    "admin_can_read" BOOLEAN NOT NULL DEFAULT true,
    "admin_can_create" BOOLEAN NOT NULL DEFAULT true,
    "admin_can_edit" BOOLEAN NOT NULL DEFAULT true,
    "admin_can_delete" BOOLEAN NOT NULL DEFAULT false,
    "admin_can_share" BOOLEAN NOT NULL DEFAULT false,
    "member_can_read" BOOLEAN NOT NULL DEFAULT true,
    "member_can_create" BOOLEAN NOT NULL DEFAULT false,
    "member_can_edit" BOOLEAN NOT NULL DEFAULT false,
    "member_can_delete" BOOLEAN NOT NULL DEFAULT false,
    "member_can_share" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_calendar_configs_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add calendar_id to calendar_events (nullable for backwards compat)
ALTER TABLE "calendar_events" ADD COLUMN "calendar_id" TEXT;

-- CreateIndex
CREATE INDEX "calendars_tenant_id_idx" ON "calendars"("tenant_id");
CREATE INDEX "calendars_tenant_id_type_idx" ON "calendars"("tenant_id", "type");
CREATE INDEX "calendars_owner_id_idx" ON "calendars"("owner_id");
CREATE UNIQUE INDEX "calendars_unique_active" ON "calendars"("tenant_id", "owner_id", "type", "system_module", "deleted_at");

-- CreateIndex
CREATE INDEX "team_calendar_configs_tenant_id_idx" ON "team_calendar_configs"("tenant_id");
CREATE INDEX "team_calendar_configs_team_id_idx" ON "team_calendar_configs"("team_id");
CREATE INDEX "team_calendar_configs_calendar_id_idx" ON "team_calendar_configs"("calendar_id");
CREATE UNIQUE INDEX "team_calendar_configs_team_id_calendar_id_key" ON "team_calendar_configs"("team_id", "calendar_id");

-- CreateIndex
CREATE INDEX "calendar_events_calendar_id_idx" ON "calendar_events"("calendar_id");

-- AddForeignKey
ALTER TABLE "calendars" ADD CONSTRAINT "calendars_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "calendars" ADD CONSTRAINT "calendars_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_calendar_configs" ADD CONSTRAINT "team_calendar_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "team_calendar_configs" ADD CONSTRAINT "team_calendar_configs_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_calendar_configs" ADD CONSTRAINT "team_calendar_configs_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "calendars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
