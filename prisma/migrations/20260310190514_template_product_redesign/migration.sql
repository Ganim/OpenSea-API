/*
  Warnings:

  - You are about to drop the column `care_instruction_ids` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `care_label` on the `templates` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `variants` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Pattern" AS ENUM ('SOLID', 'STRIPED', 'PLAID', 'PRINTED', 'GRADIENT', 'JACQUARD');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UnitOfMeasure" ADD VALUE 'GRAMS';
ALTER TYPE "UnitOfMeasure" ADD VALUE 'LITERS';
ALTER TYPE "UnitOfMeasure" ADD VALUE 'MILLILITERS';
ALTER TYPE "UnitOfMeasure" ADD VALUE 'SQUARE_METERS';
ALTER TYPE "UnitOfMeasure" ADD VALUE 'PAIRS';
ALTER TYPE "UnitOfMeasure" ADD VALUE 'BOXES';
ALTER TYPE "UnitOfMeasure" ADD VALUE 'PACKS';

-- AlterTable
ALTER TABLE "products" DROP COLUMN "care_instruction_ids";

-- AlterTable
ALTER TABLE "templates" DROP COLUMN "care_label",
ADD COLUMN     "special_modules" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "variants" DROP COLUMN "image_url",
ADD COLUMN     "pattern" "Pattern",
ADD COLUMN     "secondary_color_hex" VARCHAR(7),
ADD COLUMN     "secondary_color_pantone" VARCHAR(32);

-- CreateTable
CREATE TABLE "product_care_instructions" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "care_instruction_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_care_instructions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_attachments" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "file_url" VARCHAR(512) NOT NULL,
    "file_name" VARCHAR(256) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(128) NOT NULL,
    "label" VARCHAR(128),
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_attachments" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "file_url" VARCHAR(512) NOT NULL,
    "file_name" VARCHAR(256) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(128) NOT NULL,
    "label" VARCHAR(128),
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_care_instructions_product_id_idx" ON "product_care_instructions"("product_id");

-- CreateIndex
CREATE INDEX "product_care_instructions_tenant_id_idx" ON "product_care_instructions"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_care_instructions_product_id_care_instruction_id_key" ON "product_care_instructions"("product_id", "care_instruction_id");

-- CreateIndex
CREATE INDEX "product_attachments_product_id_idx" ON "product_attachments"("product_id");

-- CreateIndex
CREATE INDEX "product_attachments_tenant_id_idx" ON "product_attachments"("tenant_id");

-- CreateIndex
CREATE INDEX "variant_attachments_variant_id_idx" ON "variant_attachments"("variant_id");

-- CreateIndex
CREATE INDEX "variant_attachments_tenant_id_idx" ON "variant_attachments"("tenant_id");

-- AddForeignKey
ALTER TABLE "product_care_instructions" ADD CONSTRAINT "product_care_instructions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_care_instructions" ADD CONSTRAINT "product_care_instructions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attachments" ADD CONSTRAINT "product_attachments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_attachments" ADD CONSTRAINT "product_attachments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_attachments" ADD CONSTRAINT "variant_attachments_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_attachments" ADD CONSTRAINT "variant_attachments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
