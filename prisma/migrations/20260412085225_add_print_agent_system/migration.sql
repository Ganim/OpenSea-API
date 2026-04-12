-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('ONLINE', 'OFFLINE', 'ERROR');

-- CreateEnum
CREATE TYPE "PrinterStatus" AS ENUM ('ONLINE', 'OFFLINE', 'BUSY', 'ERROR', 'UNKNOWN');

-- CreateTable
CREATE TABLE "print_agents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "pairing_secret" VARCHAR(64) NOT NULL,
    "device_token_hash" VARCHAR(128),
    "device_label" VARCHAR(128),
    "paired_at" TIMESTAMP(3),
    "paired_by_user_id" TEXT,
    "revoked_at" TIMESTAMP(3),
    "status" "AgentStatus" NOT NULL DEFAULT 'OFFLINE',
    "last_seen_at" TIMESTAMP(3),
    "ip_address" VARCHAR(45),
    "hostname" VARCHAR(128),
    "os_info" JSONB,
    "version" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "print_agents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "print_agents_device_token_hash_key" ON "print_agents"("device_token_hash");

-- CreateIndex
CREATE INDEX "print_agents_tenant_id_idx" ON "print_agents"("tenant_id");

-- CreateIndex
CREATE INDEX "print_agents_device_token_hash_idx" ON "print_agents"("device_token_hash");

-- AddForeignKey
ALTER TABLE "print_agents" ADD CONSTRAINT "print_agents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable pos_printers: add agent columns
ALTER TABLE "pos_printers" ADD COLUMN "agent_id" TEXT;
ALTER TABLE "pos_printers" ADD COLUMN "capabilities" JSONB;
ALTER TABLE "pos_printers" ADD COLUMN "last_seen_at" TIMESTAMP(3);
ALTER TABLE "pos_printers" ADD COLUMN "os_name" VARCHAR(255);
ALTER TABLE "pos_printers" ADD COLUMN "status" "PrinterStatus" NOT NULL DEFAULT 'UNKNOWN';

-- CreateIndex
CREATE INDEX "pos_printers_agent_id_idx" ON "pos_printers"("agent_id");

-- AddForeignKey
ALTER TABLE "pos_printers" ADD CONSTRAINT "pos_printers_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "print_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable print_jobs: add agent columns
ALTER TABLE "print_jobs" ADD COLUMN "agent_id" TEXT;
ALTER TABLE "print_jobs" ADD COLUMN "copies" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "print_jobs" ADD COLUMN "label_data" JSONB;
ALTER TABLE "print_jobs" ADD COLUMN "printer_name" VARCHAR(255);
ALTER TABLE "print_jobs" ADD COLUMN "started_at" TIMESTAMP(3);
