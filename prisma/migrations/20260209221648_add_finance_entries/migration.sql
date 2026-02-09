-- CreateEnum
CREATE TYPE "FinanceEntryType" AS ENUM ('PAYABLE', 'RECEIVABLE');

-- CreateEnum
CREATE TYPE "FinanceEntryRecurrence" AS ENUM ('SINGLE', 'RECURRING', 'INSTALLMENT');

-- CreateEnum
CREATE TYPE "FinanceEntryStatus" AS ENUM ('PENDING', 'OVERDUE', 'PAID', 'RECEIVED', 'PARTIALLY_PAID', 'CANCELLED', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "RecurrenceUnit" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL');

-- CreateTable
CREATE TABLE "finance_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "FinanceEntryType" NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "notes" TEXT,
    "category_id" TEXT NOT NULL,
    "cost_center_id" TEXT NOT NULL,
    "bank_account_id" TEXT,
    "supplier_name" VARCHAR(256),
    "customer_name" VARCHAR(256),
    "supplier_id" TEXT,
    "customer_id" TEXT,
    "sales_order_id" TEXT,
    "expected_amount" DECIMAL(15,2) NOT NULL,
    "actual_amount" DECIMAL(15,2),
    "discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "interest" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "penalty" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "competence_date" TIMESTAMP(3),
    "payment_date" TIMESTAMP(3),
    "status" "FinanceEntryStatus" NOT NULL DEFAULT 'PENDING',
    "recurrence_type" "FinanceEntryRecurrence" NOT NULL DEFAULT 'SINGLE',
    "recurrence_interval" INTEGER,
    "recurrence_unit" "RecurrenceUnit",
    "total_installments" INTEGER,
    "current_installment" INTEGER,
    "parent_entry_id" TEXT,
    "boleto_barcode" VARCHAR(64),
    "boleto_digit_line" VARCHAR(64),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance_entry_payments" (
    "id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "bank_account_id" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "method" VARCHAR(32),
    "reference" VARCHAR(128),
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_entry_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "finance_entries_tenant_id_idx" ON "finance_entries"("tenant_id");

-- CreateIndex
CREATE INDEX "finance_entries_type_idx" ON "finance_entries"("type");

-- CreateIndex
CREATE INDEX "finance_entries_category_id_idx" ON "finance_entries"("category_id");

-- CreateIndex
CREATE INDEX "finance_entries_cost_center_id_idx" ON "finance_entries"("cost_center_id");

-- CreateIndex
CREATE INDEX "finance_entries_bank_account_id_idx" ON "finance_entries"("bank_account_id");

-- CreateIndex
CREATE INDEX "finance_entries_status_idx" ON "finance_entries"("status");

-- CreateIndex
CREATE INDEX "finance_entries_due_date_idx" ON "finance_entries"("due_date");

-- CreateIndex
CREATE INDEX "finance_entries_payment_date_idx" ON "finance_entries"("payment_date");

-- CreateIndex
CREATE INDEX "finance_entries_recurrence_type_idx" ON "finance_entries"("recurrence_type");

-- CreateIndex
CREATE INDEX "finance_entries_parent_entry_id_idx" ON "finance_entries"("parent_entry_id");

-- CreateIndex
CREATE INDEX "finance_entries_created_by_idx" ON "finance_entries"("created_by");

-- CreateIndex
CREATE INDEX "finance_entries_deleted_at_idx" ON "finance_entries"("deleted_at");

-- CreateIndex
CREATE INDEX "finance_entries_tenant_id_type_status_idx" ON "finance_entries"("tenant_id", "type", "status");

-- CreateIndex
CREATE INDEX "finance_entries_tenant_id_due_date_status_idx" ON "finance_entries"("tenant_id", "due_date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "finance_entries_code_tenant_id_deleted_at_key" ON "finance_entries"("code", "tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "finance_entry_payments_entry_id_idx" ON "finance_entry_payments"("entry_id");

-- CreateIndex
CREATE INDEX "finance_entry_payments_bank_account_id_idx" ON "finance_entry_payments"("bank_account_id");

-- CreateIndex
CREATE INDEX "finance_entry_payments_paid_at_idx" ON "finance_entry_payments"("paid_at");

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "finance_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_parent_entry_id_fkey" FOREIGN KEY ("parent_entry_id") REFERENCES "finance_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entry_payments" ADD CONSTRAINT "finance_entry_payments_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "finance_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entry_payments" ADD CONSTRAINT "finance_entry_payments_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
