-- CreateEnum
CREATE TYPE "FinanceCategoryType" AS ENUM ('EXPENSE', 'REVENUE', 'BOTH');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('CHECKING', 'SAVINGS', 'SALARY', 'PAYMENT', 'INVESTMENT', 'DIGITAL', 'OTHER');

-- CreateEnum
CREATE TYPE "BankAccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CLOSED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEntity" ADD VALUE 'COST_CENTER';
ALTER TYPE "AuditEntity" ADD VALUE 'BANK_ACCOUNT';
ALTER TYPE "AuditEntity" ADD VALUE 'FINANCE_CATEGORY';
ALTER TYPE "AuditEntity" ADD VALUE 'FINANCE_ENTRY';
ALTER TYPE "AuditEntity" ADD VALUE 'FINANCE_ENTRY_PAYMENT';
ALTER TYPE "AuditEntity" ADD VALUE 'FINANCE_ATTACHMENT';
ALTER TYPE "AuditEntity" ADD VALUE 'LOAN';
ALTER TYPE "AuditEntity" ADD VALUE 'LOAN_INSTALLMENT';
ALTER TYPE "AuditEntity" ADD VALUE 'CONSORTIUM';
ALTER TYPE "AuditEntity" ADD VALUE 'CONSORTIUM_PAYMENT';

-- AlterEnum
ALTER TYPE "AuditModule" ADD VALUE 'FINANCE';

-- AlterEnum
ALTER TYPE "SystemModuleEnum" ADD VALUE 'FINANCE';

-- CreateTable
CREATE TABLE "cost_centers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "company_id" TEXT,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "monthly_budget" DECIMAL(15,2),
    "annual_budget" DECIMAL(15,2),
    "parent_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "bank_code" VARCHAR(5) NOT NULL,
    "bank_name" VARCHAR(128),
    "agency" VARCHAR(10) NOT NULL,
    "agency_digit" VARCHAR(2),
    "account_number" VARCHAR(20) NOT NULL,
    "account_digit" VARCHAR(2),
    "account_type" "BankAccountType" NOT NULL,
    "status" "BankAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "pix_key_type" VARCHAR(16),
    "pix_key" VARCHAR(128),
    "current_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "balance_updated_at" TIMESTAMP(3),
    "color" VARCHAR(7),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "description" VARCHAR(500),
    "icon_url" VARCHAR(512),
    "color" VARCHAR(7),
    "type" "FinanceCategoryType" NOT NULL,
    "parent_id" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cost_centers_tenant_id_idx" ON "cost_centers"("tenant_id");

-- CreateIndex
CREATE INDEX "cost_centers_company_id_idx" ON "cost_centers"("company_id");

-- CreateIndex
CREATE INDEX "cost_centers_parent_id_idx" ON "cost_centers"("parent_id");

-- CreateIndex
CREATE INDEX "cost_centers_is_active_idx" ON "cost_centers"("is_active");

-- CreateIndex
CREATE INDEX "cost_centers_deleted_at_idx" ON "cost_centers"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "cost_centers_code_tenant_id_deleted_at_key" ON "cost_centers"("code", "tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "bank_accounts_tenant_id_idx" ON "bank_accounts"("tenant_id");

-- CreateIndex
CREATE INDEX "bank_accounts_company_id_idx" ON "bank_accounts"("company_id");

-- CreateIndex
CREATE INDEX "bank_accounts_bank_code_idx" ON "bank_accounts"("bank_code");

-- CreateIndex
CREATE INDEX "bank_accounts_account_type_idx" ON "bank_accounts"("account_type");

-- CreateIndex
CREATE INDEX "bank_accounts_status_idx" ON "bank_accounts"("status");

-- CreateIndex
CREATE INDEX "bank_accounts_deleted_at_idx" ON "bank_accounts"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_tenant_id_bank_code_agency_account_number_del_key" ON "bank_accounts"("tenant_id", "bank_code", "agency", "account_number", "deleted_at");

-- CreateIndex
CREATE INDEX "finance_categories_tenant_id_idx" ON "finance_categories"("tenant_id");

-- CreateIndex
CREATE INDEX "finance_categories_type_idx" ON "finance_categories"("type");

-- CreateIndex
CREATE INDEX "finance_categories_parent_id_idx" ON "finance_categories"("parent_id");

-- CreateIndex
CREATE INDEX "finance_categories_is_active_idx" ON "finance_categories"("is_active");

-- CreateIndex
CREATE INDEX "finance_categories_deleted_at_idx" ON "finance_categories"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "finance_categories_slug_tenant_id_deleted_at_key" ON "finance_categories"("slug", "tenant_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "finance_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
