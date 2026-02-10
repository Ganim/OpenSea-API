-- CreateEnum
CREATE TYPE "FinanceAttachmentType" AS ENUM ('BOLETO', 'PAYMENT_RECEIPT', 'CONTRACT', 'INVOICE', 'OTHER');

-- CreateTable
CREATE TABLE "finance_attachments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "type" "FinanceAttachmentType" NOT NULL DEFAULT 'OTHER',
    "file_name" VARCHAR(256) NOT NULL,
    "file_key" VARCHAR(512) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(128) NOT NULL,
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "finance_attachments_tenant_id_idx" ON "finance_attachments"("tenant_id");

-- CreateIndex
CREATE INDEX "finance_attachments_entry_id_idx" ON "finance_attachments"("entry_id");

-- AddForeignKey
ALTER TABLE "finance_attachments" ADD CONSTRAINT "finance_attachments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_attachments" ADD CONSTRAINT "finance_attachments_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "finance_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
