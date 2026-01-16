-- CreateEnum
CREATE TYPE "VolumeStatus" AS ENUM ('OPEN', 'CLOSED', 'DELIVERED', 'RETURNED');

-- CreateTable
CREATE TABLE "volumes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" VARCHAR(256),
    "status" "VolumeStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "destinationRef" VARCHAR(256),
    "sales_order_id" TEXT,
    "customer_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "returned_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "closed_by" TEXT,
    "delivered_by" TEXT,

    CONSTRAINT "volumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volume_items" (
    "id" TEXT NOT NULL,
    "volume_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "added_by" TEXT NOT NULL,

    CONSTRAINT "volume_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "volumes_code_key" ON "volumes"("code");

-- CreateIndex
CREATE INDEX "volumes_status_idx" ON "volumes"("status");

-- CreateIndex
CREATE INDEX "volumes_code_idx" ON "volumes"("code");

-- CreateIndex
CREATE INDEX "volumes_created_at_idx" ON "volumes"("created_at");

-- CreateIndex
CREATE INDEX "volumes_closed_at_idx" ON "volumes"("closed_at");

-- CreateIndex
CREATE INDEX "volumes_deleted_at_idx" ON "volumes"("deleted_at");

-- CreateIndex
CREATE INDEX "volume_items_volume_id_idx" ON "volume_items"("volume_id");

-- CreateIndex
CREATE INDEX "volume_items_item_id_idx" ON "volume_items"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "volume_items_volume_id_item_id_key" ON "volume_items"("volume_id", "item_id");

-- AddForeignKey
ALTER TABLE "volumes" ADD CONSTRAINT "volumes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volumes" ADD CONSTRAINT "volumes_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volumes" ADD CONSTRAINT "volumes_delivered_by_fkey" FOREIGN KEY ("delivered_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volume_items" ADD CONSTRAINT "volume_items_volume_id_fkey" FOREIGN KEY ("volume_id") REFERENCES "volumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volume_items" ADD CONSTRAINT "volume_items_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
