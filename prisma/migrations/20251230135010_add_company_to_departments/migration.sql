/*
  Warnings:

  - A unique constraint covering the columns `[code,company_id,deleted_at]` on the table `departments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `company_id` to the `departments` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "departments_code_key";

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "company_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "departments_company_id_idx" ON "departments"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_company_id_deleted_at_key" ON "departments"("code", "company_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
