/*
  Warnings:

  - You are about to drop the column `enterprise_id` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the `enterprises` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CompanyStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "OrganizationType" AS ENUM ('COMPANY', 'SUPPLIER', 'MANUFACTURER', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "OrganizationStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'BLOCKED');

-- DropForeignKey
ALTER TABLE "company_addresses" DROP CONSTRAINT "company_addresses_company_id_fkey";

-- DropForeignKey
ALTER TABLE "company_cnaes" DROP CONSTRAINT "company_cnaes_company_id_fkey";

-- DropForeignKey
ALTER TABLE "company_fiscal_settings" DROP CONSTRAINT "company_fiscal_settings_company_id_fkey";

-- DropForeignKey
ALTER TABLE "company_stakeholders" DROP CONSTRAINT "company_stakeholders_company_id_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_enterprise_id_fkey";

-- DropIndex
DROP INDEX "employees_enterprise_id_idx";

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "enterprise_id",
ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "organization_id" TEXT;

-- DropTable
DROP TABLE "enterprises";

-- DropEnum
DROP TYPE "EnterpriseStatusEnum";

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "type" "OrganizationType" NOT NULL,
    "legal_name" VARCHAR(256) NOT NULL,
    "cnpj" VARCHAR(18),
    "cpf" VARCHAR(14),
    "trade_name" VARCHAR(256),
    "state_registration" VARCHAR(128),
    "municipal_registration" VARCHAR(128),
    "legal_nature" VARCHAR(256),
    "tax_regime" "TaxRegimeEnum",
    "tax_regime_detail" VARCHAR(256),
    "activity_start_date" TIMESTAMP(3),
    "status" "OrganizationStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "email" VARCHAR(256),
    "phone_main" VARCHAR(20),
    "phone_alt" VARCHAR(20),
    "website" VARCHAR(512),
    "logo_url" VARCHAR(512),
    "type_specific_data" JSONB DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_addresses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "type" "CompanyAddressType" NOT NULL DEFAULT 'OTHER',
    "street" VARCHAR(256),
    "number" VARCHAR(32),
    "complement" VARCHAR(128),
    "district" VARCHAR(128),
    "city" VARCHAR(128),
    "state" VARCHAR(2),
    "zip" VARCHAR(10) NOT NULL,
    "ibge_city_code" VARCHAR(16),
    "country_code" VARCHAR(4) DEFAULT 'BR',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "pending_issues" JSONB NOT NULL DEFAULT '[]',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_cnaes" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "description" VARCHAR(256),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" "CompanyCnaeStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "pending_issues" JSONB NOT NULL DEFAULT '[]',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_cnaes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_fiscal_settings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "nfe_enabled" BOOLEAN DEFAULT false,
    "nfe_series" INTEGER,
    "nfe_number" INTEGER DEFAULT 1,
    "nfe_environment" "NfeEnvironment",
    "nfe_password" VARCHAR(128),
    "nfe_certificate" TEXT,
    "nfe_cert_type" "DigitalCertificateType",
    "default_icms_rate" DECIMAL(5,2) DEFAULT 0,
    "default_ipi_rate" DECIMAL(5,2) DEFAULT 0,
    "default_pis_rate" DECIMAL(5,2) DEFAULT 0,
    "default_cofins_rate" DECIMAL(5,2) DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "pending_issues" JSONB NOT NULL DEFAULT '[]',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_fiscal_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_stakeholders" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "cpf" VARCHAR(14),
    "role" "CompanyStakeholderRole",
    "qualification" VARCHAR(256),
    "entry_date" TIMESTAMP(3),
    "exit_date" TIMESTAMP(3),
    "status" "CompanyStakeholderStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "CompanyStakeholderSource" DEFAULT 'MANUAL',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "pending_issues" JSONB NOT NULL DEFAULT '[]',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_stakeholders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "legal_name" VARCHAR(256) NOT NULL,
    "cnpj" VARCHAR(18) NOT NULL,
    "trade_name" VARCHAR(256),
    "state_registration" VARCHAR(128),
    "municipal_registration" VARCHAR(128),
    "legal_nature" VARCHAR(256),
    "tax_regime" "TaxRegimeEnum",
    "tax_regime_detail" VARCHAR(256),
    "activity_start_date" TIMESTAMP(3),
    "status" "CompanyStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "email" VARCHAR(256),
    "phone_main" VARCHAR(20),
    "phone_alt" VARCHAR(20),
    "logo_url" VARCHAR(512),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "pendingIssues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organizations_type_idx" ON "organizations"("type");

-- CreateIndex
CREATE INDEX "organizations_cnpj_idx" ON "organizations"("cnpj");

-- CreateIndex
CREATE INDEX "organizations_cpf_idx" ON "organizations"("cpf");

-- CreateIndex
CREATE INDEX "organizations_legal_name_idx" ON "organizations"("legal_name");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "organizations"("status");

-- CreateIndex
CREATE INDEX "organizations_deleted_at_idx" ON "organizations"("deleted_at");

-- CreateIndex
CREATE INDEX "organizations_created_at_idx" ON "organizations"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_cnpj_type_deleted_at_key" ON "organizations"("cnpj", "type", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_cpf_type_deleted_at_key" ON "organizations"("cpf", "type", "deleted_at");

-- CreateIndex
CREATE INDEX "organization_addresses_organization_id_idx" ON "organization_addresses"("organization_id");

-- CreateIndex
CREATE INDEX "organization_addresses_type_idx" ON "organization_addresses"("type");

-- CreateIndex
CREATE INDEX "organization_addresses_zip_idx" ON "organization_addresses"("zip");

-- CreateIndex
CREATE INDEX "organization_addresses_is_primary_idx" ON "organization_addresses"("is_primary");

-- CreateIndex
CREATE INDEX "organization_addresses_deleted_at_idx" ON "organization_addresses"("deleted_at");

-- CreateIndex
CREATE INDEX "organization_addresses_created_at_idx" ON "organization_addresses"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "organization_addresses_organization_id_type_deleted_at_key" ON "organization_addresses"("organization_id", "type", "deleted_at");

-- CreateIndex
CREATE INDEX "organization_cnaes_organization_id_idx" ON "organization_cnaes"("organization_id");

-- CreateIndex
CREATE INDEX "organization_cnaes_code_idx" ON "organization_cnaes"("code");

-- CreateIndex
CREATE INDEX "organization_cnaes_is_primary_idx" ON "organization_cnaes"("is_primary");

-- CreateIndex
CREATE INDEX "organization_cnaes_status_idx" ON "organization_cnaes"("status");

-- CreateIndex
CREATE INDEX "organization_cnaes_deleted_at_idx" ON "organization_cnaes"("deleted_at");

-- CreateIndex
CREATE INDEX "organization_cnaes_created_at_idx" ON "organization_cnaes"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "organization_cnaes_organization_id_code_deleted_at_key" ON "organization_cnaes"("organization_id", "code", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "organization_fiscal_settings_organization_id_key" ON "organization_fiscal_settings"("organization_id");

-- CreateIndex
CREATE INDEX "organization_fiscal_settings_organization_id_idx" ON "organization_fiscal_settings"("organization_id");

-- CreateIndex
CREATE INDEX "organization_fiscal_settings_deleted_at_idx" ON "organization_fiscal_settings"("deleted_at");

-- CreateIndex
CREATE INDEX "organization_fiscal_settings_created_at_idx" ON "organization_fiscal_settings"("created_at");

-- CreateIndex
CREATE INDEX "organization_stakeholders_organization_id_idx" ON "organization_stakeholders"("organization_id");

-- CreateIndex
CREATE INDEX "organization_stakeholders_cpf_idx" ON "organization_stakeholders"("cpf");

-- CreateIndex
CREATE INDEX "organization_stakeholders_status_idx" ON "organization_stakeholders"("status");

-- CreateIndex
CREATE INDEX "organization_stakeholders_deleted_at_idx" ON "organization_stakeholders"("deleted_at");

-- CreateIndex
CREATE INDEX "organization_stakeholders_created_at_idx" ON "organization_stakeholders"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "organization_stakeholders_organization_id_cpf_deleted_at_key" ON "organization_stakeholders"("organization_id", "cpf", "deleted_at");

-- CreateIndex
CREATE INDEX "companies_cnpj_idx" ON "companies"("cnpj");

-- CreateIndex
CREATE INDEX "companies_legal_name_idx" ON "companies"("legal_name");

-- CreateIndex
CREATE INDEX "companies_status_idx" ON "companies"("status");

-- CreateIndex
CREATE INDEX "companies_deleted_at_idx" ON "companies"("deleted_at");

-- CreateIndex
CREATE INDEX "companies_created_at_idx" ON "companies"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "companies_cnpj_deleted_at_key" ON "companies"("cnpj", "deleted_at");

-- CreateIndex
CREATE INDEX "employees_organization_id_idx" ON "employees"("organization_id");

-- CreateIndex
CREATE INDEX "products_organization_id_idx" ON "products"("organization_id");

-- AddForeignKey
ALTER TABLE "organization_addresses" ADD CONSTRAINT "organization_addresses_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_cnaes" ADD CONSTRAINT "organization_cnaes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_fiscal_settings" ADD CONSTRAINT "organization_fiscal_settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_stakeholders" ADD CONSTRAINT "organization_stakeholders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_addresses" ADD CONSTRAINT "company_addresses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_cnaes" ADD CONSTRAINT "company_cnaes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_fiscal_settings" ADD CONSTRAINT "company_fiscal_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_stakeholders" ADD CONSTRAINT "company_stakeholders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
