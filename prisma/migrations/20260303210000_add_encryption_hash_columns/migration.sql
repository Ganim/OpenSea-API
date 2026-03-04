-- DropForeignKey
ALTER TABLE "calendar_events" DROP CONSTRAINT "calendar_events_calendar_id_fkey";

-- DropIndex
DROP INDEX "bank_accounts_tenant_id_bank_code_agency_account_number_del_key";

-- DropIndex
DROP INDEX "companies_cnpj_idx";

-- DropIndex
DROP INDEX "companies_cnpj_tenant_id_deleted_at_key";

-- DropIndex
DROP INDEX "customers_document_idx";

-- DropIndex
DROP INDEX "customers_document_tenant_id_deleted_at_key";

-- DropIndex
DROP INDEX "customers_email_idx";

-- DropIndex
DROP INDEX "employees_cpf_idx";

-- DropIndex
DROP INDEX "employees_cpf_tenant_id_deleted_at_key";

-- DropIndex
DROP INDEX "employees_pis_tenant_id_deleted_at_key";

-- DropIndex
DROP INDEX "organization_stakeholders_cpf_idx";

-- DropIndex
DROP INDEX "organization_stakeholders_organization_id_cpf_deleted_at_key";

-- DropIndex
DROP INDEX "organizations_cnpj_idx";

-- DropIndex
DROP INDEX "organizations_cnpj_type_tenant_id_deleted_at_key";

-- DropIndex
DROP INDEX "organizations_cpf_idx";

-- DropIndex
DROP INDEX "organizations_cpf_type_tenant_id_deleted_at_key";

-- DropIndex
DROP INDEX "suppliers_cnpj_tenant_id_deleted_at_key";

-- AlterTable
ALTER TABLE "absences" ALTER COLUMN "cid" SET DATA TYPE VARCHAR(256);

-- AlterTable
ALTER TABLE "bank_accounts" ADD COLUMN     "account_number_hash" VARCHAR(64),
ADD COLUMN     "pix_key_hash" VARCHAR(64),
ALTER COLUMN "agency" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "agency_digit" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "account_number" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "account_digit" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "pix_key" SET DATA TYPE VARCHAR(256);

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "cnpj_hash" VARCHAR(64),
ALTER COLUMN "cnpj" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "phone_main" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "phone_alt" SET DATA TYPE VARCHAR(256);

-- AlterTable
ALTER TABLE "company_fiscal_settings" ALTER COLUMN "nfce_csc_id" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "nfce_csc_token" SET DATA TYPE VARCHAR(512);

-- AlterTable
ALTER TABLE "company_stakeholders" ALTER COLUMN "person_document_masked" SET DATA TYPE VARCHAR(256);

-- AlterTable
ALTER TABLE "consortia" ALTER COLUMN "contract_number" SET DATA TYPE VARCHAR(256);

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "document_hash" VARCHAR(64),
ADD COLUMN     "email_hash" VARCHAR(64),
ALTER COLUMN "document" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "address" SET DATA TYPE VARCHAR(512);

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "bank_account_hash" VARCHAR(64),
ADD COLUMN     "cpf_hash" VARCHAR(64),
ADD COLUMN     "pis_hash" VARCHAR(64),
ADD COLUMN     "pix_key_hash" VARCHAR(64),
ADD COLUMN     "rg_hash" VARCHAR(64),
ALTER COLUMN "cpf" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "rg" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "pis" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "ctpsNumber" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "ctpsSeries" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "voterTitle" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "militaryDoc" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "personal_email" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "mobile_phone" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "emergency_contact" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "emergency_phone" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "address" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "bankAgency" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "bankAccount" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "pixKey" SET DATA TYPE VARCHAR(256);

-- AlterTable
ALTER TABLE "finance_entries" ALTER COLUMN "supplier_name" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "customer_name" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "boleto_barcode" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "boleto_digit_line" SET DATA TYPE VARCHAR(256);

-- AlterTable
ALTER TABLE "loans" ALTER COLUMN "contract_number" SET DATA TYPE VARCHAR(256);

-- AlterTable
ALTER TABLE "manufacturers" ADD COLUMN     "cnpj_hash" VARCHAR(64),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "address" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "cnpj" SET DATA TYPE VARCHAR(256);

-- AlterTable
ALTER TABLE "organization_fiscal_settings" ALTER COLUMN "nfe_password" SET DATA TYPE VARCHAR(512);

-- AlterTable
ALTER TABLE "organization_stakeholders" ADD COLUMN     "cpf_hash" VARCHAR(64),
ALTER COLUMN "cpf" SET DATA TYPE VARCHAR(256);

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "cnpj_hash" VARCHAR(64),
ADD COLUMN     "cpf_hash" VARCHAR(64),
ALTER COLUMN "cnpj" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "cpf" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "phone_main" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "phone_alt" SET DATA TYPE VARCHAR(256);

-- AlterTable
ALTER TABLE "storage_share_links" ALTER COLUMN "password" SET DATA TYPE VARCHAR(512);

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "cnpj_hash" VARCHAR(64),
ADD COLUMN     "email_hash" VARCHAR(64),
ALTER COLUMN "cnpj" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "contact" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(256),
ALTER COLUMN "address" SET DATA TYPE VARCHAR(512);

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_tenant_id_bank_code_account_number_hash_delet_key" ON "bank_accounts"("tenant_id", "bank_code", "account_number_hash", "deleted_at");

-- CreateIndex
CREATE INDEX "companies_cnpj_hash_idx" ON "companies"("cnpj_hash");

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_hash_tenant_id_deleted_at_key" ON "companies"("cnpj_hash", "tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "customers_document_hash_idx" ON "customers"("document_hash");

-- CreateIndex
CREATE INDEX "customers_email_hash_idx" ON "customers"("email_hash");

-- CreateIndex
CREATE UNIQUE INDEX "customers_document_hash_tenant_id_deleted_at_key" ON "customers"("document_hash", "tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "employees_cpf_hash_idx" ON "employees"("cpf_hash");

-- CreateIndex
CREATE INDEX "employees_pis_hash_idx" ON "employees"("pis_hash");

-- CreateIndex
CREATE INDEX "employees_pix_key_hash_idx" ON "employees"("pix_key_hash");

-- CreateIndex
CREATE INDEX "employees_bank_account_hash_idx" ON "employees"("bank_account_hash");

-- CreateIndex
CREATE UNIQUE INDEX "employees_cpf_hash_tenant_id_deleted_at_key" ON "employees"("cpf_hash", "tenant_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "employees_pis_hash_tenant_id_deleted_at_key" ON "employees"("pis_hash", "tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "organization_stakeholders_cpf_hash_idx" ON "organization_stakeholders"("cpf_hash");

-- CreateIndex
CREATE UNIQUE INDEX "organization_stakeholders_organization_id_cpf_hash_deleted__key" ON "organization_stakeholders"("organization_id", "cpf_hash", "deleted_at");

-- CreateIndex
CREATE INDEX "organizations_cnpj_hash_idx" ON "organizations"("cnpj_hash");

-- CreateIndex
CREATE INDEX "organizations_cpf_hash_idx" ON "organizations"("cpf_hash");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_cnpj_hash_type_tenant_id_deleted_at_key" ON "organizations"("cnpj_hash", "type", "tenant_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_cpf_hash_type_tenant_id_deleted_at_key" ON "organizations"("cpf_hash", "type", "tenant_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_cnpj_hash_tenant_id_deleted_at_key" ON "suppliers"("cnpj_hash", "tenant_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "calendars"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "calendars_unique_active" RENAME TO "calendars_tenant_id_owner_id_type_system_module_deleted_at_key";

