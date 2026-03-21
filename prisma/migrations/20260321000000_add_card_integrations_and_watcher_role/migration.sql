-- CreateEnum
CREATE TYPE "CardIntegrationType" AS ENUM ('CUSTOMER', 'PRODUCT', 'FINANCE_ENTRY', 'EMAIL', 'DEPARTMENT', 'CALENDAR_EVENT');

-- AlterTable
ALTER TABLE "card_watchers" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'WATCHER';

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

-- CreateIndex
CREATE INDEX "card_integrations_card_id_idx" ON "card_integrations"("card_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_integrations_card_id_type_entity_id_key" ON "card_integrations"("card_id", "type", "entity_id");

-- AddForeignKey
ALTER TABLE "card_integrations" ADD CONSTRAINT "card_integrations_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_integrations" ADD CONSTRAINT "card_integrations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
