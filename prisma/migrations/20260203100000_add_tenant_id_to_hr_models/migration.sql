-- DropIndex (remove old unique constraints that don't include tenant_id)
DROP INDEX IF EXISTS "companies_cnpj_deleted_at_key";
DROP INDEX IF EXISTS "departments_code_company_id_deleted_at_key";
DROP INDEX IF EXISTS "employees_registration_number_deleted_at_key";
DROP INDEX IF EXISTS "employees_cpf_deleted_at_key";
DROP INDEX IF EXISTS "employees_pis_deleted_at_key";
DROP INDEX IF EXISTS "payrolls_reference_month_reference_year_key";
DROP INDEX IF EXISTS "positions_code_key";

-- AlterTable: Add tenant_id to HR models
ALTER TABLE "absences" ADD COLUMN "tenant_id" TEXT NOT NULL;
ALTER TABLE "bonuses" ADD COLUMN "tenant_id" TEXT NOT NULL;
ALTER TABLE "companies" ADD COLUMN "tenant_id" TEXT NOT NULL;
ALTER TABLE "deductions" ADD COLUMN "tenant_id" TEXT NOT NULL;
ALTER TABLE "departments" ADD COLUMN "tenant_id" TEXT NOT NULL;
ALTER TABLE "employees" ADD COLUMN "tenant_id" TEXT NOT NULL;
ALTER TABLE "overtime" ADD COLUMN "tenant_id" TEXT NOT NULL;
ALTER TABLE "payrolls" ADD COLUMN "tenant_id" TEXT NOT NULL;
ALTER TABLE "positions" ADD COLUMN "tenant_id" TEXT NOT NULL;
ALTER TABLE "time_banks" ADD COLUMN "tenant_id" TEXT NOT NULL;
ALTER TABLE "time_entries" ADD COLUMN "tenant_id" TEXT NOT NULL;
ALTER TABLE "vacation_periods" ADD COLUMN "tenant_id" TEXT NOT NULL;
ALTER TABLE "work_schedules" ADD COLUMN "tenant_id" TEXT NOT NULL;

-- CreateIndex: Add indexes for tenant_id
CREATE INDEX "absences_tenant_id_idx" ON "absences"("tenant_id");
CREATE INDEX "bonuses_tenant_id_idx" ON "bonuses"("tenant_id");
CREATE INDEX "companies_tenant_id_idx" ON "companies"("tenant_id");
CREATE INDEX "deductions_tenant_id_idx" ON "deductions"("tenant_id");
CREATE INDEX "departments_tenant_id_idx" ON "departments"("tenant_id");
CREATE INDEX "employees_tenant_id_idx" ON "employees"("tenant_id");
CREATE INDEX "overtime_tenant_id_idx" ON "overtime"("tenant_id");
CREATE INDEX "payrolls_tenant_id_idx" ON "payrolls"("tenant_id");
CREATE INDEX "positions_tenant_id_idx" ON "positions"("tenant_id");
CREATE INDEX "time_banks_tenant_id_idx" ON "time_banks"("tenant_id");
CREATE INDEX "time_entries_tenant_id_idx" ON "time_entries"("tenant_id");
CREATE INDEX "vacation_periods_tenant_id_idx" ON "vacation_periods"("tenant_id");
CREATE INDEX "work_schedules_tenant_id_idx" ON "work_schedules"("tenant_id");

-- CreateIndex: New unique constraints including tenant_id
CREATE UNIQUE INDEX "companies_cnpj_tenant_unique_active" ON "companies"("cnpj", "tenant_id", "deleted_at");
CREATE UNIQUE INDEX "departments_code_company_tenant_unique_active" ON "departments"("code", "company_id", "tenant_id", "deleted_at");
CREATE UNIQUE INDEX "employees_registration_tenant_unique_active" ON "employees"("registration_number", "tenant_id", "deleted_at");
CREATE UNIQUE INDEX "employees_cpf_tenant_unique_active" ON "employees"("cpf", "tenant_id", "deleted_at");
CREATE UNIQUE INDEX "employees_pis_tenant_unique_active" ON "employees"("pis", "tenant_id", "deleted_at");
CREATE UNIQUE INDEX "payrolls_month_year_tenant_unique" ON "payrolls"("reference_month", "reference_year", "tenant_id");
CREATE UNIQUE INDEX "positions_code_tenant_unique" ON "positions"("code", "tenant_id");

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bonuses" ADD CONSTRAINT "bonuses_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "companies" ADD CONSTRAINT "companies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "deductions" ADD CONSTRAINT "deductions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "departments" ADD CONSTRAINT "departments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employees" ADD CONSTRAINT "employees_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "overtime" ADD CONSTRAINT "overtime_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "positions" ADD CONSTRAINT "positions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "time_banks" ADD CONSTRAINT "time_banks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "vacation_periods" ADD CONSTRAINT "vacation_periods_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "work_schedules" ADD CONSTRAINT "work_schedules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
