-- Plan 06-05 (Phase 06 / Compliance Portaria 671)
-- Adds:
--   1. `esocial_configs.inpi_number` VARCHAR(17) nullable (D-06 — INPI number for AFD header)
--   2. `compliance_rubrica_map` table (A5 Part B — maps CLT concepts to eSocial codRubr)
--
-- Hand-curated using the workaround introduced by Plan 04-01
-- (`prisma db execute --file <sql> && prisma migrate resolve --applied`) because
-- `prisma migrate dev` would pull in accumulated drift from production / finance /
-- items / hr_contracts modules unrelated to Plan 06-05 (documented in STATE.md
-- 04-01 Pending Todos).
--
-- Rollback is provided as a commented block at the bottom (REP-P demands reversibility
-- evidence per Portaria 671).

-- AlterTable: add inpiNumber to esocial_configs
ALTER TABLE "esocial_configs" ADD COLUMN "inpi_number" VARCHAR(17);

-- CreateTable: compliance_rubrica_map
CREATE TABLE "compliance_rubrica_map" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "clt_concept" VARCHAR(32) NOT NULL,
    "cod_rubr" VARCHAR(16) NOT NULL,
    "ide_tab_rubr" VARCHAR(16) NOT NULL,
    "ind_apur_ir" SMALLINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "compliance_rubrica_map_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compliance_rubrica_map_tenant_id_idx" ON "compliance_rubrica_map"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_rubrica_map_tenant_id_clt_concept_key" ON "compliance_rubrica_map"("tenant_id", "clt_concept");

-- AddForeignKey
ALTER TABLE "compliance_rubrica_map" ADD CONSTRAINT "compliance_rubrica_map_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ========================================
-- ROLLBACK (emergency backout — execute in reverse order)
-- ========================================
-- ALTER TABLE "compliance_rubrica_map" DROP CONSTRAINT "compliance_rubrica_map_tenant_id_fkey";
-- DROP INDEX "compliance_rubrica_map_tenant_id_clt_concept_key";
-- DROP INDEX "compliance_rubrica_map_tenant_id_idx";
-- DROP TABLE "compliance_rubrica_map";
-- ALTER TABLE "esocial_configs" DROP COLUMN "inpi_number";
