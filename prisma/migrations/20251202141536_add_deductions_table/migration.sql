-- AlterEnum
ALTER TYPE "public"."PayrollStatus" ADD VALUE 'PROCESSING';

-- CreateTable
CREATE TABLE "public"."deductions" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "installments" INTEGER,
    "current_installment" INTEGER NOT NULL DEFAULT 0,
    "is_applied" BOOLEAN NOT NULL DEFAULT false,
    "applied_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deductions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deductions_employee_id_idx" ON "public"."deductions"("employee_id");

-- CreateIndex
CREATE INDEX "deductions_date_idx" ON "public"."deductions"("date");

-- CreateIndex
CREATE INDEX "deductions_is_applied_idx" ON "public"."deductions"("is_applied");

-- CreateIndex
CREATE INDEX "deductions_is_recurring_idx" ON "public"."deductions"("is_recurring");

-- AddForeignKey
ALTER TABLE "public"."deductions" ADD CONSTRAINT "deductions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
