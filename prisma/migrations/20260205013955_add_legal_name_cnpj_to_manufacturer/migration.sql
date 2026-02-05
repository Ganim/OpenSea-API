-- AlterTable
ALTER TABLE "manufacturers" ADD COLUMN     "cnpj" VARCHAR(18),
ADD COLUMN     "legal_name" VARCHAR(256);

-- RenameIndex
ALTER INDEX "companies_cnpj_tenant_unique_active" RENAME TO "companies_cnpj_tenant_id_deleted_at_key";

-- RenameIndex
ALTER INDEX "departments_code_company_tenant_unique_active" RENAME TO "departments_code_company_id_tenant_id_deleted_at_key";

-- RenameIndex
ALTER INDEX "employees_cpf_tenant_unique_active" RENAME TO "employees_cpf_tenant_id_deleted_at_key";

-- RenameIndex
ALTER INDEX "employees_pis_tenant_unique_active" RENAME TO "employees_pis_tenant_id_deleted_at_key";

-- RenameIndex
ALTER INDEX "employees_registration_tenant_unique_active" RENAME TO "employees_registration_number_tenant_id_deleted_at_key";

-- RenameIndex
ALTER INDEX "payrolls_month_year_tenant_unique" RENAME TO "payrolls_reference_month_reference_year_tenant_id_key";

-- RenameIndex
ALTER INDEX "positions_code_tenant_unique" RENAME TO "positions_code_tenant_id_key";
