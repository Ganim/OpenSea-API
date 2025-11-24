/*
  Warnings:

  - You are about to drop the column `description` on the `locations` table. All the data in the column will be lost.
  - You are about to alter the column `code` on the `locations` table. The data in that column could be lost. The data in that column will be cast from `VarChar(64)` to `VarChar(5)`.
  - Added the required column `titulo` to the `locations` table without a default value. This is not possible if the table is not empty.
  - Made the column `location_type` on table `locations` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."locations_code_key";

-- AlterTable
ALTER TABLE "public"."locations" ADD COLUMN     "titulo" VARCHAR(256),
ADD COLUMN     "total_childs" INTEGER NOT NULL DEFAULT 0;

-- Migrate description to titulo
UPDATE "public"."locations" SET "titulo" = "description" WHERE "description" IS NOT NULL;
UPDATE "public"."locations" SET "titulo" = 'Location' WHERE "titulo" IS NULL;

-- Generate random codes for existing records
UPDATE "public"."locations" SET "code" = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5));

-- Set default location_type for NULL values
UPDATE "public"."locations" SET "location_type" = 'OTHER' WHERE "location_type" IS NULL;

-- Now make titulo and location_type required
ALTER TABLE "public"."locations" ALTER COLUMN "titulo" SET NOT NULL,
ALTER COLUMN "location_type" SET NOT NULL,
ALTER COLUMN "code" SET DATA TYPE VARCHAR(5);

-- Drop the old description column
ALTER TABLE "public"."locations" DROP COLUMN "description";
