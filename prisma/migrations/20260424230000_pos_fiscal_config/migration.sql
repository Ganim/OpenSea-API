-- CreateEnum
CREATE TYPE "PosFiscalEmissionMode" AS ENUM ('ONLINE_SYNC', 'OFFLINE_CONTINGENCY', 'NONE');

-- CreateEnum
CREATE TYPE "PosFiscalDocumentType" AS ENUM ('NFE', 'NFC_E', 'SAT_CFE', 'MFE');

-- CreateTable
CREATE TABLE "pos_fiscal_config" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "enabled_document_types" "PosFiscalDocumentType"[],
    "default_document_type" "PosFiscalDocumentType" NOT NULL,
    "emission_mode" "PosFiscalEmissionMode" NOT NULL DEFAULT 'ONLINE_SYNC',
    "certificate_path" VARCHAR(512),
    "nfce_series" INTEGER,
    "nfce_next_number" INTEGER,
    "sat_device_id" VARCHAR(128),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_fiscal_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pos_fiscal_config_tenant_id_key" ON "pos_fiscal_config"("tenant_id");

-- AddForeignKey
ALTER TABLE "pos_fiscal_config" ADD CONSTRAINT "pos_fiscal_config_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
