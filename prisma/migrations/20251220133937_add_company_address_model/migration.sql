-- CreateEnum
CREATE TYPE "CompanyAddressType" AS ENUM ('FISCAL', 'DELIVERY', 'BILLING', 'OTHER');

-- CreateTable
CREATE TABLE "company_addresses" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
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

    CONSTRAINT "company_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_addresses_company_id_idx" ON "company_addresses"("company_id");

-- CreateIndex
CREATE INDEX "company_addresses_type_idx" ON "company_addresses"("type");

-- CreateIndex
CREATE INDEX "company_addresses_zip_idx" ON "company_addresses"("zip");

-- CreateIndex
CREATE INDEX "company_addresses_is_primary_idx" ON "company_addresses"("is_primary");

-- CreateIndex
CREATE INDEX "company_addresses_deleted_at_idx" ON "company_addresses"("deleted_at");

-- CreateIndex
CREATE INDEX "company_addresses_created_at_idx" ON "company_addresses"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "company_addresses_company_id_type_deleted_at_key" ON "company_addresses"("company_id", "type", "deleted_at");

-- AddForeignKey
ALTER TABLE "company_addresses" ADD CONSTRAINT "company_addresses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "enterprises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
