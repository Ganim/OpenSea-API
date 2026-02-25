-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('MEETING', 'TASK', 'REMINDER', 'DEADLINE', 'HOLIDAY', 'BIRTHDAY', 'VACATION', 'ABSENCE', 'FINANCE_DUE', 'PURCHASE_ORDER', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('OWNER', 'ASSIGNEE', 'GUEST');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE');

-- AlterEnum
ALTER TYPE "SystemModuleEnum" ADD VALUE 'CALENDAR';

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "description" TEXT,
    "location" VARCHAR(512),
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "type" "EventType" NOT NULL DEFAULT 'CUSTOM',
    "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC',
    "color" VARCHAR(7),
    "rrule" VARCHAR(512),
    "system_source_type" VARCHAR(64),
    "system_source_id" VARCHAR(36),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participants" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "ParticipantRole" NOT NULL DEFAULT 'GUEST',
    "status" "ParticipantStatus" NOT NULL DEFAULT 'PENDING',
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_reminders" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "minutes_before" INTEGER NOT NULL,
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendar_events_tenant_id_idx" ON "calendar_events"("tenant_id");

-- CreateIndex
CREATE INDEX "calendar_events_tenant_id_start_date_end_date_idx" ON "calendar_events"("tenant_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "calendar_events_tenant_id_type_idx" ON "calendar_events"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "calendar_events_created_by_idx" ON "calendar_events"("created_by");

-- CreateIndex
CREATE INDEX "calendar_events_system_source_type_system_source_id_idx" ON "calendar_events"("system_source_type", "system_source_id");

-- CreateIndex
CREATE INDEX "calendar_events_deleted_at_idx" ON "calendar_events"("deleted_at");

-- CreateIndex
CREATE INDEX "event_participants_event_id_idx" ON "event_participants"("event_id");

-- CreateIndex
CREATE INDEX "event_participants_user_id_idx" ON "event_participants"("user_id");

-- CreateIndex
CREATE INDEX "event_participants_status_idx" ON "event_participants"("status");

-- CreateIndex
CREATE UNIQUE INDEX "event_participants_event_id_user_id_key" ON "event_participants"("event_id", "user_id");

-- CreateIndex
CREATE INDEX "event_reminders_event_id_idx" ON "event_reminders"("event_id");

-- CreateIndex
CREATE INDEX "event_reminders_user_id_idx" ON "event_reminders"("user_id");

-- CreateIndex
CREATE INDEX "event_reminders_is_sent_event_id_idx" ON "event_reminders"("is_sent", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_reminders_event_id_user_id_minutes_before_key" ON "event_reminders"("event_id", "user_id", "minutes_before");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reminders" ADD CONSTRAINT "event_reminders_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reminders" ADD CONSTRAINT "event_reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
