-- AlterTable
ALTER TABLE "variants" ADD COLUMN "fractional_allowed" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "zones" ADD COLUMN "allows_fractional_sale" BOOLEAN NOT NULL DEFAULT false,
                    ADD COLUMN "min_fractional_sale" DECIMAL(10,3);

-- AlterTable
ALTER TABLE "items" ADD COLUMN "fractional_sale_enabled" BOOLEAN NOT NULL DEFAULT false;
