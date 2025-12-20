/*
  Warnings:

  - A unique constraint covering the columns `[registration_number,deleted_at]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cpf,deleted_at]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[pis,deleted_at]` on the table `employees` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "employees_cpf_key";

-- DropIndex
DROP INDEX "employees_pis_key";

-- DropIndex
DROP INDEX "employees_registration_number_key";

-- AlterTable
ALTER TABLE "absences" ADD COLUMN     "user_id" TEXT;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "emergency_contact_info" JSONB,
ADD COLUMN     "enterprise_id" TEXT,
ADD COLUMN     "health_conditions" JSONB,
ADD COLUMN     "pcd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pending_issues" JSONB NOT NULL DEFAULT '[]';

-- CreateIndex
CREATE INDEX "employees_enterprise_id_idx" ON "employees"("enterprise_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_registration_number_deleted_at_key" ON "employees"("registration_number", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "employees_cpf_deleted_at_key" ON "employees"("cpf", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "employees_pis_deleted_at_key" ON "employees"("pis", "deleted_at");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_enterprise_id_fkey" FOREIGN KEY ("enterprise_id") REFERENCES "enterprises"("id") ON DELETE SET NULL ON UPDATE CASCADE;
