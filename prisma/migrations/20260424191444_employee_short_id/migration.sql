-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "short_id" VARCHAR(6);

-- CreateIndex
CREATE INDEX "employees_tenant_id_short_id_idx" ON "employees"("tenant_id", "short_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_short_id_tenant_unique" ON "employees"("short_id", "tenant_id", "deleted_at") WHERE "short_id" IS NOT NULL;
