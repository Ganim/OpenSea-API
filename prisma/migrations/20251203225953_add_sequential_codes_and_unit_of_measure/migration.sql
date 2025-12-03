/*
  Warnings:

  - You are about to drop the column `unit_of_measure` on the `products` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[full_code]` on the table `items` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[full_code]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[full_code]` on the table `variants` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."items" DROP CONSTRAINT "items_location_id_fkey";

-- AlterTable
ALTER TABLE "public"."items" ADD COLUMN     "full_code" VARCHAR(32),
ADD COLUMN     "sequential_code" SERIAL NOT NULL,
ADD COLUMN     "unit_cost" DECIMAL(10,2),
ALTER COLUMN "unique_code" DROP NOT NULL,
ALTER COLUMN "location_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."products" DROP COLUMN "unit_of_measure",
ADD COLUMN     "full_code" VARCHAR(32),
ADD COLUMN     "sequential_code" SERIAL NOT NULL,
ALTER COLUMN "code" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "public"."suppliers" ADD COLUMN     "sequential_code" SERIAL NOT NULL;

-- AlterTable
ALTER TABLE "public"."templates" ADD COLUMN     "care_label" JSONB,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sequential_code" SERIAL NOT NULL,
ADD COLUMN     "unit_of_measure" "public"."UnitOfMeasure" NOT NULL DEFAULT 'UNITS';

-- AlterTable
ALTER TABLE "public"."variants" ADD COLUMN     "full_code" VARCHAR(32),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sequential_code" SERIAL NOT NULL,
ALTER COLUMN "sku" DROP NOT NULL,
ALTER COLUMN "price" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "items_full_code_key" ON "public"."items"("full_code");

-- CreateIndex
CREATE INDEX "items_sequential_code_idx" ON "public"."items"("sequential_code");

-- CreateIndex
CREATE INDEX "items_full_code_idx" ON "public"."items"("full_code");

-- CreateIndex
CREATE UNIQUE INDEX "products_full_code_key" ON "public"."products"("full_code");

-- CreateIndex
CREATE INDEX "products_sequential_code_idx" ON "public"."products"("sequential_code");

-- CreateIndex
CREATE INDEX "products_full_code_idx" ON "public"."products"("full_code");

-- CreateIndex
CREATE INDEX "suppliers_sequential_code_idx" ON "public"."suppliers"("sequential_code");

-- CreateIndex
CREATE INDEX "templates_sequential_code_idx" ON "public"."templates"("sequential_code");

-- CreateIndex
CREATE INDEX "templates_is_active_idx" ON "public"."templates"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "variants_full_code_key" ON "public"."variants"("full_code");

-- CreateIndex
CREATE INDEX "variants_sequential_code_idx" ON "public"."variants"("sequential_code");

-- CreateIndex
CREATE INDEX "variants_full_code_idx" ON "public"."variants"("full_code");

-- CreateIndex
CREATE INDEX "variants_is_active_idx" ON "public"."variants"("is_active");

-- AddForeignKey
ALTER TABLE "public"."items" ADD CONSTRAINT "items_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
