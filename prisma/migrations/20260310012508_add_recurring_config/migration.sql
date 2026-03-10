-- CreateEnum
CREATE TYPE "RecurringStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'RENEWED', 'CANCELLED');

-- AlterTable
ALTER TABLE "finance_entries" ADD COLUMN     "contract_id" TEXT;

-- CreateTable
CREATE TABLE "recurring_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "FinanceEntryType" NOT NULL,
    "status" "RecurringStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" VARCHAR(500) NOT NULL,
    "category_id" TEXT NOT NULL,
    "cost_center_id" TEXT,
    "bank_account_id" TEXT,
    "supplier_name" VARCHAR(512),
    "customer_name" VARCHAR(512),
    "supplier_id" TEXT,
    "customer_id" TEXT,
    "expected_amount" DECIMAL(15,2) NOT NULL,
    "is_variable" BOOLEAN NOT NULL DEFAULT false,
    "frequency_unit" "RecurrenceUnit" NOT NULL,
    "frequency_interval" INTEGER NOT NULL DEFAULT 1,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "total_occurrences" INTEGER,
    "generated_count" INTEGER NOT NULL DEFAULT 0,
    "last_generated_date" TIMESTAMP(3),
    "next_due_date" TIMESTAMP(3),
    "interest_rate" DECIMAL(5,4),
    "penalty_rate" DECIMAL(5,4),
    "notes" TEXT,
    "created_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recurring_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "description" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "company_id" TEXT,
    "company_name" VARCHAR(256) NOT NULL,
    "contact_name" VARCHAR(128),
    "contact_email" VARCHAR(256),
    "total_value" DECIMAL(15,2) NOT NULL,
    "payment_frequency" "RecurrenceUnit" NOT NULL,
    "payment_amount" DECIMAL(15,2) NOT NULL,
    "category_id" TEXT,
    "cost_center_id" TEXT,
    "bank_account_id" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "auto_renew" BOOLEAN NOT NULL DEFAULT false,
    "renewal_period_months" INTEGER,
    "alert_days_before" INTEGER NOT NULL DEFAULT 30,
    "folder_path" VARCHAR(512),
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recurring_configs_tenant_id_idx" ON "recurring_configs"("tenant_id");

-- CreateIndex
CREATE INDEX "recurring_configs_status_idx" ON "recurring_configs"("status");

-- CreateIndex
CREATE INDEX "recurring_configs_next_due_date_idx" ON "recurring_configs"("next_due_date");

-- CreateIndex
CREATE INDEX "recurring_configs_tenant_id_status_idx" ON "recurring_configs"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "recurring_configs_tenant_id_status_next_due_date_idx" ON "recurring_configs"("tenant_id", "status", "next_due_date");

-- CreateIndex
CREATE INDEX "contracts_tenant_id_idx" ON "contracts"("tenant_id");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE INDEX "contracts_company_id_idx" ON "contracts"("company_id");

-- CreateIndex
CREATE INDEX "contracts_end_date_idx" ON "contracts"("end_date");

-- CreateIndex
CREATE INDEX "contracts_deleted_at_idx" ON "contracts"("deleted_at");

-- CreateIndex
CREATE INDEX "contracts_tenant_id_status_idx" ON "contracts"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_code_tenant_id_deleted_at_key" ON "contracts"("code", "tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "finance_entries_contract_id_idx" ON "finance_entries"("contract_id");

-- AddForeignKey
ALTER TABLE "recurring_configs" ADD CONSTRAINT "recurring_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
