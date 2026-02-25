-- AlterTable
ALTER TABLE "calendar_events" ADD COLUMN     "timezone" VARCHAR(64);

-- AlterTable: Add tenant_id as nullable first
ALTER TABLE "event_participants" ADD COLUMN     "tenant_id" TEXT;

-- Backfill tenant_id from parent calendar_events
UPDATE "event_participants" ep
SET "tenant_id" = ce."tenant_id"
FROM "calendar_events" ce
WHERE ep."event_id" = ce."id";

-- Now make it NOT NULL
ALTER TABLE "event_participants" ALTER COLUMN "tenant_id" SET NOT NULL;

-- AlterTable: Add tenant_id as nullable first
ALTER TABLE "event_reminders" ADD COLUMN     "tenant_id" TEXT;

-- Backfill tenant_id from parent calendar_events
UPDATE "event_reminders" er
SET "tenant_id" = ce."tenant_id"
FROM "calendar_events" ce
WHERE er."event_id" = ce."id";

-- Now make it NOT NULL
ALTER TABLE "event_reminders" ALTER COLUMN "tenant_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "event_participants_tenant_id_idx" ON "event_participants"("tenant_id");

-- CreateIndex
CREATE INDEX "event_reminders_tenant_id_idx" ON "event_reminders"("tenant_id");

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reminders" ADD CONSTRAINT "event_reminders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
