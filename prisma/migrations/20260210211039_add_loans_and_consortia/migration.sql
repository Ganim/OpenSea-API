-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('PERSONAL', 'BUSINESS', 'WORKING_CAPITAL', 'EQUIPMENT', 'REAL_ESTATE', 'CREDIT_LINE', 'OTHER');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('ACTIVE', 'PAID_OFF', 'DEFAULTED', 'RENEGOTIATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConsortiumStatus" AS ENUM ('ACTIVE', 'CONTEMPLATED', 'WITHDRAWN', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bank_account_id" TEXT NOT NULL,
    "cost_center_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "type" "LoanType" NOT NULL,
    "contract_number" VARCHAR(64),
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "principal_amount" DECIMAL(15,2) NOT NULL,
    "outstanding_balance" DECIMAL(15,2) NOT NULL,
    "interest_rate" DECIMAL(8,4) NOT NULL,
    "interest_type" VARCHAR(16),
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "total_installments" INTEGER NOT NULL,
    "paid_installments" INTEGER NOT NULL DEFAULT 0,
    "installment_day" INTEGER,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_installments" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "bank_account_id" TEXT,
    "installment_number" INTEGER NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "principal_amount" DECIMAL(15,2) NOT NULL,
    "interest_amount" DECIMAL(15,2) NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "paid_amount" DECIMAL(15,2),
    "paid_at" TIMESTAMP(3),
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consortia" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bank_account_id" TEXT NOT NULL,
    "cost_center_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "administrator" VARCHAR(128) NOT NULL,
    "group_number" VARCHAR(32),
    "quota_number" VARCHAR(32),
    "contract_number" VARCHAR(64),
    "status" "ConsortiumStatus" NOT NULL DEFAULT 'ACTIVE',
    "credit_value" DECIMAL(15,2) NOT NULL,
    "monthly_payment" DECIMAL(15,2) NOT NULL,
    "total_installments" INTEGER NOT NULL,
    "paid_installments" INTEGER NOT NULL DEFAULT 0,
    "is_contemplated" BOOLEAN NOT NULL DEFAULT false,
    "contemplated_at" TIMESTAMP(3),
    "contemplation_type" VARCHAR(16),
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "payment_day" INTEGER,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consortia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consortium_payments" (
    "id" TEXT NOT NULL,
    "consortium_id" TEXT NOT NULL,
    "bank_account_id" TEXT,
    "installment_number" INTEGER NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "expected_amount" DECIMAL(15,2) NOT NULL,
    "paid_amount" DECIMAL(15,2),
    "paid_at" TIMESTAMP(3),
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consortium_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loans_tenant_id_idx" ON "loans"("tenant_id");

-- CreateIndex
CREATE INDEX "loans_bank_account_id_idx" ON "loans"("bank_account_id");

-- CreateIndex
CREATE INDEX "loans_cost_center_id_idx" ON "loans"("cost_center_id");

-- CreateIndex
CREATE INDEX "loans_status_idx" ON "loans"("status");

-- CreateIndex
CREATE INDEX "loans_deleted_at_idx" ON "loans"("deleted_at");

-- CreateIndex
CREATE INDEX "loan_installments_loan_id_idx" ON "loan_installments"("loan_id");

-- CreateIndex
CREATE INDEX "loan_installments_due_date_idx" ON "loan_installments"("due_date");

-- CreateIndex
CREATE INDEX "loan_installments_status_idx" ON "loan_installments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "loan_installments_loan_id_installment_number_key" ON "loan_installments"("loan_id", "installment_number");

-- CreateIndex
CREATE INDEX "consortia_tenant_id_idx" ON "consortia"("tenant_id");

-- CreateIndex
CREATE INDEX "consortia_bank_account_id_idx" ON "consortia"("bank_account_id");

-- CreateIndex
CREATE INDEX "consortia_cost_center_id_idx" ON "consortia"("cost_center_id");

-- CreateIndex
CREATE INDEX "consortia_status_idx" ON "consortia"("status");

-- CreateIndex
CREATE INDEX "consortia_is_contemplated_idx" ON "consortia"("is_contemplated");

-- CreateIndex
CREATE INDEX "consortia_deleted_at_idx" ON "consortia"("deleted_at");

-- CreateIndex
CREATE INDEX "consortium_payments_consortium_id_idx" ON "consortium_payments"("consortium_id");

-- CreateIndex
CREATE INDEX "consortium_payments_due_date_idx" ON "consortium_payments"("due_date");

-- CreateIndex
CREATE INDEX "consortium_payments_status_idx" ON "consortium_payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "consortium_payments_consortium_id_installment_number_key" ON "consortium_payments"("consortium_id", "installment_number");

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_installments" ADD CONSTRAINT "loan_installments_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_installments" ADD CONSTRAINT "loan_installments_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consortia" ADD CONSTRAINT "consortia_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consortia" ADD CONSTRAINT "consortia_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consortia" ADD CONSTRAINT "consortia_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consortium_payments" ADD CONSTRAINT "consortium_payments_consortium_id_fkey" FOREIGN KEY ("consortium_id") REFERENCES "consortia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consortium_payments" ADD CONSTRAINT "consortium_payments_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
