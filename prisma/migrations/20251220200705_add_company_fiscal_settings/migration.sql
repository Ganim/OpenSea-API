-- CreateEnum
CREATE TYPE "CompanyCnaeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "NfeEnvironment" AS ENUM ('HOMOLOGATION', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "DigitalCertificateType" AS ENUM ('NONE', 'A1', 'A3');

-- CreateTable
CREATE TABLE "company_cnaes" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "description" VARCHAR(256),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" "CompanyCnaeStatus" NOT NULL DEFAULT 'ACTIVE',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "pending_issues" JSONB NOT NULL DEFAULT '[]',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_cnaes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_fiscal_settings" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "nfe_environment" "NfeEnvironment",
    "nfe_series" VARCHAR(16),
    "nfe_last_number" INTEGER,
    "nfe_default_operation_nature" VARCHAR(256),
    "nfe_default_cfop" VARCHAR(8),
    "digital_certificate_type" "DigitalCertificateType" NOT NULL DEFAULT 'NONE',
    "certificate_a1_pfx_blob" BYTEA,
    "certificate_a1_password" TEXT,
    "certificate_a1_expires_at" TIMESTAMP(3),
    "nfce_enabled" BOOLEAN NOT NULL DEFAULT false,
    "nfce_csc_id" VARCHAR(64),
    "nfce_csc_token" VARCHAR(256),
    "default_tax_profile_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "pending_issues" JSONB NOT NULL DEFAULT '[]',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_fiscal_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_cnaes_company_id_idx" ON "company_cnaes"("company_id");

-- CreateIndex
CREATE INDEX "company_cnaes_code_idx" ON "company_cnaes"("code");

-- CreateIndex
CREATE INDEX "company_cnaes_is_primary_idx" ON "company_cnaes"("is_primary");

-- CreateIndex
CREATE INDEX "company_cnaes_status_idx" ON "company_cnaes"("status");

-- CreateIndex
CREATE INDEX "company_cnaes_deleted_at_idx" ON "company_cnaes"("deleted_at");

-- CreateIndex
CREATE INDEX "company_cnaes_created_at_idx" ON "company_cnaes"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "company_cnaes_company_id_code_deleted_at_key" ON "company_cnaes"("company_id", "code", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "company_fiscal_settings_company_id_key" ON "company_fiscal_settings"("company_id");

-- CreateIndex
CREATE INDEX "company_fiscal_settings_company_id_idx" ON "company_fiscal_settings"("company_id");

-- CreateIndex
CREATE INDEX "company_fiscal_settings_digital_certificate_type_idx" ON "company_fiscal_settings"("digital_certificate_type");

-- CreateIndex
CREATE INDEX "company_fiscal_settings_nfe_environment_idx" ON "company_fiscal_settings"("nfe_environment");

-- CreateIndex
CREATE INDEX "company_fiscal_settings_nfce_enabled_idx" ON "company_fiscal_settings"("nfce_enabled");

-- CreateIndex
CREATE INDEX "company_fiscal_settings_deleted_at_idx" ON "company_fiscal_settings"("deleted_at");

-- CreateIndex
CREATE INDEX "company_fiscal_settings_created_at_idx" ON "company_fiscal_settings"("created_at");

-- AddForeignKey
ALTER TABLE "company_cnaes" ADD CONSTRAINT "company_cnaes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "enterprises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_fiscal_settings" ADD CONSTRAINT "company_fiscal_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "enterprises"("id") ON DELETE CASCADE ON UPDATE CASCADE;
