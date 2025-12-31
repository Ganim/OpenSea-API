/*
  Warnings:

  - You are about to drop the column `phone` on the `enterprises` table. All the data in the column will be lost.
  - The `tax_regime` column on the `enterprises` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EnterpriseStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "TaxRegimeEnum" AS ENUM ('SIMPLES', 'LUCRO_PRESUMIDO', 'LUCRO_REAL', 'IMUNE_ISENTA', 'OUTROS');

-- AlterTable
ALTER TABLE "enterprises" DROP COLUMN "phone",
ADD COLUMN     "activity_start_date" TIMESTAMP(3),
ADD COLUMN     "email" VARCHAR(256),
ADD COLUMN     "legal_nature" VARCHAR(256),
ADD COLUMN     "municipal_registration" VARCHAR(128),
ADD COLUMN     "pendingIssues" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "phone_alt" VARCHAR(20),
ADD COLUMN     "phone_main" VARCHAR(20),
ADD COLUMN     "state_registration" VARCHAR(128),
ADD COLUMN     "status" "EnterpriseStatusEnum" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "tax_regime_detail" VARCHAR(256),
ADD COLUMN     "trade_name" VARCHAR(256),
DROP COLUMN "tax_regime",
ADD COLUMN     "tax_regime" "TaxRegimeEnum";

-- CreateIndex
CREATE INDEX "enterprises_status_idx" ON "enterprises"("status");
