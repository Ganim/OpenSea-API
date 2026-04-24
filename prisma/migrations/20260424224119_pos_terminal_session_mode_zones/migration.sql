-- CreateEnum
CREATE TYPE "PosOperatorSessionMode" AS ENUM ('PER_SALE', 'STAY_LOGGED_IN');

-- CreateEnum
CREATE TYPE "PosCoordinationMode" AS ENUM ('STANDALONE', 'SELLER', 'CASHIER', 'BOTH');

-- CreateEnum
CREATE TYPE "PosZoneTier" AS ENUM ('PRIMARY', 'SECONDARY');

-- AlterTable
ALTER TABLE "pos_terminals"
  ADD COLUMN "operator_session_mode" "PosOperatorSessionMode" NOT NULL DEFAULT 'PER_SALE',
  ADD COLUMN "operator_session_timeout" INTEGER,
  ADD COLUMN "auto_close_session_at" VARCHAR(5),
  ADD COLUMN "coordination_mode" "PosCoordinationMode" NOT NULL DEFAULT 'STANDALONE',
  ADD COLUMN "applied_profile_id" TEXT;

-- CreateTable
CREATE TABLE "pos_terminal_zones" (
    "id" TEXT NOT NULL,
    "terminal_id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "tier" "PosZoneTier" NOT NULL DEFAULT 'PRIMARY',
    "tenant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_terminal_zones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pos_terminal_zones_unique" ON "pos_terminal_zones"("terminal_id", "zone_id");

-- CreateIndex
CREATE INDEX "pos_terminal_zones_tenant_id_idx" ON "pos_terminal_zones"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_terminal_zones_terminal_id_idx" ON "pos_terminal_zones"("terminal_id");

-- CreateIndex
CREATE INDEX "pos_terminal_zones_zone_id_idx" ON "pos_terminal_zones"("zone_id");

-- AddForeignKey
ALTER TABLE "pos_terminal_zones" ADD CONSTRAINT "pos_terminal_zones_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminal_zones" ADD CONSTRAINT "pos_terminal_zones_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "pos_terminals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminal_zones" ADD CONSTRAINT "pos_terminal_zones_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: PosTerminalWarehouse has no tenant_id, derive from PosTerminal.
-- For each existing (terminal, warehouse) link, create pos_terminal_zones
-- entries for every zone in that warehouse with tier=PRIMARY.
INSERT INTO "pos_terminal_zones" (
  "id", "terminal_id", "zone_id", "tier", "tenant_id", "created_at", "updated_at"
)
SELECT
  gen_random_uuid(),
  ptw."terminal_id",
  z."id",
  'PRIMARY'::"PosZoneTier",
  pt."tenant_id",
  NOW(),
  NOW()
FROM "pos_terminal_warehouses" ptw
JOIN "pos_terminals" pt ON pt."id" = ptw."terminal_id"
JOIN "zones" z ON z."warehouse_id" = ptw."warehouse_id" AND z."deleted_at" IS NULL
ON CONFLICT ("terminal_id", "zone_id") DO NOTHING;
