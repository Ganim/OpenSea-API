/*
  Warnings:

  - The values [SALARY,VACATION] on the enum `PayrollItemType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."PayrollItemType_new" AS ENUM ('BASE_SALARY', 'BONUS', 'COMMISSION', 'OVERTIME', 'NIGHT_SHIFT', 'HAZARD_PAY', 'DANGER_PAY', 'VACATION_PAY', 'THIRTEENTH_SALARY', 'HOLIDAY', 'INSS', 'IRRF', 'FGTS', 'HEALTH_INSURANCE', 'DENTAL_PLAN', 'TRANSPORT_VOUCHER', 'MEAL_VOUCHER', 'OTHER_BENEFIT', 'ADVANCE', 'LOAN', 'OTHER_DEDUCTION');
ALTER TABLE "public"."payroll_items" ALTER COLUMN "type" TYPE "public"."PayrollItemType_new" USING ("type"::text::"public"."PayrollItemType_new");
ALTER TYPE "public"."PayrollItemType" RENAME TO "PayrollItemType_old";
ALTER TYPE "public"."PayrollItemType_new" RENAME TO "PayrollItemType";
DROP TYPE "public"."PayrollItemType_old";
COMMIT;
