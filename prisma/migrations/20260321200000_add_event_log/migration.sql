-- CreateEnum
CREATE TYPE "event_log_status" AS ENUM ('PUBLISHED', 'PROCESSING', 'PROCESSED', 'FAILED', 'DEAD_LETTER');

-- CreateTable
CREATE TABLE "event_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" VARCHAR(128) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "source" VARCHAR(64) NOT NULL,
    "source_entity_type" VARCHAR(64) NOT NULL,
    "source_entity_id" VARCHAR(64) NOT NULL,
    "data" JSONB NOT NULL,
    "metadata" JSONB,
    "correlation_id" VARCHAR(64),
    "causation_id" VARCHAR(64),
    "status" "event_log_status" NOT NULL DEFAULT 'PUBLISHED',
    "processed_by" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "failed_consumers" JSONB,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 3,
    "next_retry_at" TIMESTAMP(3),
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_logs_tenant_id_idx" ON "event_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "event_logs_tenant_id_type_idx" ON "event_logs"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "event_logs_tenant_id_created_at_idx" ON "event_logs"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX "event_logs_status_idx" ON "event_logs"("status");

-- CreateIndex
CREATE INDEX "event_logs_correlation_id_idx" ON "event_logs"("correlation_id");

-- CreateIndex
CREATE INDEX "event_logs_source_entity_type_source_entity_id_idx" ON "event_logs"("source_entity_type", "source_entity_id");

-- CreateIndex
CREATE INDEX "event_logs_status_next_retry_at_idx" ON "event_logs"("status", "next_retry_at");

-- AddForeignKey
ALTER TABLE "event_logs" ADD CONSTRAINT "event_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
