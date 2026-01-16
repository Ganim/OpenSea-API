/*
  Warnings:

  - You are about to drop the column `location_id` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `location_id` on the `stock_snapshots` table. All the data in the column will be lost.
  - You are about to drop the `locations` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "BinLabeling" AS ENUM ('LETTERS', 'NUMBERS');

-- CreateEnum
CREATE TYPE "BinDirection" AS ENUM ('BOTTOM_UP', 'TOP_DOWN');

-- CreateEnum
CREATE TYPE "LayoutAnnotationType" AS ENUM ('DOOR', 'PILLAR', 'WALL', 'LABEL', 'AREA');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LocationType" ADD VALUE 'RACK';
ALTER TYPE "LocationType" ADD VALUE 'FLOOR';
ALTER TYPE "LocationType" ADD VALUE 'ROOM';

-- DropForeignKey
ALTER TABLE "items" DROP CONSTRAINT "items_location_id_fkey";

-- DropForeignKey
ALTER TABLE "locations" DROP CONSTRAINT "locations_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "stock_snapshots" DROP CONSTRAINT "stock_snapshots_location_id_fkey";

-- DropIndex
DROP INDEX "items_location_id_idx";

-- DropIndex
DROP INDEX "items_variant_id_location_id_idx";

-- DropIndex
DROP INDEX "stock_snapshots_location_id_idx";

-- AlterTable
ALTER TABLE "items" DROP COLUMN "location_id",
ADD COLUMN     "bin_id" TEXT;

-- AlterTable
ALTER TABLE "stock_snapshots" DROP COLUMN "location_id",
ADD COLUMN     "bin_id" TEXT;

-- DropTable
DROP TABLE "locations";

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(5) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" VARCHAR(500),
    "address" VARCHAR(256),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "code" VARCHAR(5) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" VARCHAR(500),
    "structure" JSONB NOT NULL DEFAULT '{}',
    "layout" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bins" (
    "id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "address" VARCHAR(32) NOT NULL,
    "aisle" INTEGER NOT NULL,
    "shelf" INTEGER NOT NULL,
    "position" VARCHAR(3) NOT NULL,
    "capacity" INTEGER,
    "current_occupancy" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "block_reason" VARCHAR(256),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "bins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "warehouses_is_active_idx" ON "warehouses"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_deleted_at_key" ON "warehouses"("code", "deleted_at");

-- CreateIndex
CREATE INDEX "zones_warehouse_id_idx" ON "zones"("warehouse_id");

-- CreateIndex
CREATE INDEX "zones_is_active_idx" ON "zones"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "zones_warehouse_id_code_deleted_at_key" ON "zones"("warehouse_id", "code", "deleted_at");

-- CreateIndex
CREATE INDEX "bins_zone_id_idx" ON "bins"("zone_id");

-- CreateIndex
CREATE INDEX "bins_address_idx" ON "bins"("address");

-- CreateIndex
CREATE INDEX "bins_aisle_idx" ON "bins"("aisle");

-- CreateIndex
CREATE INDEX "bins_is_active_idx" ON "bins"("is_active");

-- CreateIndex
CREATE INDEX "bins_is_blocked_idx" ON "bins"("is_blocked");

-- CreateIndex
CREATE INDEX "bins_zone_id_aisle_shelf_idx" ON "bins"("zone_id", "aisle", "shelf");

-- CreateIndex
CREATE UNIQUE INDEX "bins_address_deleted_at_key" ON "bins"("address", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "bins_zone_id_aisle_shelf_position_deleted_at_key" ON "bins"("zone_id", "aisle", "shelf", "position", "deleted_at");

-- CreateIndex
CREATE INDEX "items_bin_id_idx" ON "items"("bin_id");

-- CreateIndex
CREATE INDEX "items_variant_id_bin_id_idx" ON "items"("variant_id", "bin_id");

-- CreateIndex
CREATE INDEX "stock_snapshots_bin_id_idx" ON "stock_snapshots"("bin_id");

-- AddForeignKey
ALTER TABLE "zones" ADD CONSTRAINT "zones_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bins" ADD CONSTRAINT "bins_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_bin_id_fkey" FOREIGN KEY ("bin_id") REFERENCES "bins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_snapshots" ADD CONSTRAINT "stock_snapshots_bin_id_fkey" FOREIGN KEY ("bin_id") REFERENCES "bins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
