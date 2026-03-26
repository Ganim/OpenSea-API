-- CreateEnum
CREATE TYPE "RetentionTaxType" AS ENUM ('IRRF', 'ISS', 'INSS', 'PIS', 'COFINS', 'CSLL');

-- CreateTable
CREATE TABLE "finance_entry_retentions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "tax_type" "RetentionTaxType" NOT NULL,
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "rate" DECIMAL(6,4) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "withheld" BOOLEAN NOT NULL DEFAULT true,
    "description" VARCHAR(256),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_entry_retentions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "finance_entry_retentions_tenant_id_idx" ON "finance_entry_retentions"("tenant_id");

-- CreateIndex
CREATE INDEX "finance_entry_retentions_entry_id_idx" ON "finance_entry_retentions"("entry_id");

-- AddForeignKey
ALTER TABLE "finance_entry_retentions" ADD CONSTRAINT "finance_entry_retentions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entry_retentions" ADD CONSTRAINT "finance_entry_retentions_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "finance_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
