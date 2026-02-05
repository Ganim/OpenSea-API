-- AlterEnum
ALTER TYPE "MovementType" ADD VALUE 'ZONE_RECONFIGURE';

-- AlterTable
ALTER TABLE "item_movements" ADD COLUMN     "origin_ref" VARCHAR(128);

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "last_known_address" VARCHAR(64);

-- DataMigration: Preencher lastKnownAddress para itens existentes que tem bin
UPDATE items i
SET last_known_address = b.address
FROM bins b
WHERE i.bin_id = b.id
  AND i.last_known_address IS NULL
  AND i.deleted_at IS NULL;
