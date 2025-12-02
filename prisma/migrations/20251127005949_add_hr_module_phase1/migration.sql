-- CreateEnum
CREATE TYPE "public"."EmployeeStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'VACATION', 'SUSPENDED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "public"."ContractType" AS ENUM ('CLT', 'PJ', 'INTERN', 'TEMPORARY', 'APPRENTICE');

-- CreateEnum
CREATE TYPE "public"."WorkRegime" AS ENUM ('FULL_TIME', 'PART_TIME', 'HOURLY', 'SHIFT', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "public"."TimeEntryType" AS ENUM ('CLOCK_IN', 'CLOCK_OUT', 'BREAK_START', 'BREAK_END', 'OVERTIME_START', 'OVERTIME_END');

-- CreateEnum
CREATE TYPE "public"."AbsenceType" AS ENUM ('VACATION', 'SICK_LEAVE', 'PERSONAL_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE', 'BEREAVEMENT_LEAVE', 'WEDDING_LEAVE', 'MEDICAL_APPOINTMENT', 'JURY_DUTY', 'UNPAID_LEAVE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."AbsenceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."PayrollStatus" AS ENUM ('DRAFT', 'CALCULATED', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PayrollItemType" AS ENUM ('SALARY', 'BONUS', 'COMMISSION', 'OVERTIME', 'VACATION', 'HOLIDAY', 'INSS', 'IRRF', 'FGTS', 'HEALTH_INSURANCE', 'DENTAL_PLAN', 'TRANSPORT_VOUCHER', 'MEAL_VOUCHER', 'OTHER_BENEFIT', 'ADVANCE', 'LOAN', 'OTHER_DEDUCTION');

-- CreateTable
CREATE TABLE "public"."employees" (
    "id" TEXT NOT NULL,
    "registration_number" VARCHAR(32) NOT NULL,
    "user_id" TEXT,
    "fullName" VARCHAR(256) NOT NULL,
    "socialName" VARCHAR(256),
    "birth_date" TIMESTAMP(3),
    "gender" VARCHAR(32),
    "maritalStatus" VARCHAR(32),
    "nationality" VARCHAR(64),
    "birthPlace" VARCHAR(128),
    "cpf" VARCHAR(14) NOT NULL,
    "rg" VARCHAR(20),
    "rg_issuer" VARCHAR(32),
    "rg_issue_date" TIMESTAMP(3),
    "pis" VARCHAR(14),
    "ctpsNumber" VARCHAR(32),
    "ctpsSeries" VARCHAR(16),
    "ctpsState" VARCHAR(2),
    "voterTitle" VARCHAR(16),
    "militaryDoc" VARCHAR(32),
    "email" VARCHAR(254),
    "personal_email" VARCHAR(254),
    "phone" VARCHAR(20),
    "mobile_phone" VARCHAR(20),
    "emergency_contact" VARCHAR(128),
    "emergency_phone" VARCHAR(20),
    "address" VARCHAR(256),
    "addressNumber" VARCHAR(16),
    "complement" VARCHAR(128),
    "neighborhood" VARCHAR(128),
    "city" VARCHAR(128),
    "state" VARCHAR(2),
    "zip_code" VARCHAR(10),
    "country" VARCHAR(64) NOT NULL DEFAULT 'Brasil',
    "bankCode" VARCHAR(8),
    "bankName" VARCHAR(128),
    "bankAgency" VARCHAR(16),
    "bankAccount" VARCHAR(32),
    "bankAccountType" VARCHAR(32),
    "pixKey" VARCHAR(128),
    "department_id" TEXT,
    "position_id" TEXT,
    "supervisor_id" TEXT,
    "hire_date" TIMESTAMP(3) NOT NULL,
    "termination_date" TIMESTAMP(3),
    "status" "public"."EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "base_salary" DECIMAL(10,2) NOT NULL,
    "contract_type" "public"."ContractType" NOT NULL,
    "work_regime" "public"."WorkRegime" NOT NULL,
    "weekly_hours" DECIMAL(5,2) NOT NULL,
    "photo_url" VARCHAR(512),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."departments" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "manager_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."positions" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "description" TEXT,
    "department_id" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "min_salary" DECIMAL(10,2),
    "max_salary" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."time_entries" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "entry_type" "public"."TimeEntryType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "ip_address" VARCHAR(64),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."work_schedules" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "monday_start" VARCHAR(5),
    "monday_end" VARCHAR(5),
    "tuesday_start" VARCHAR(5),
    "tuesday_end" VARCHAR(5),
    "wednesday_start" VARCHAR(5),
    "wednesday_end" VARCHAR(5),
    "thursday_start" VARCHAR(5),
    "thursday_end" VARCHAR(5),
    "friday_start" VARCHAR(5),
    "friday_end" VARCHAR(5),
    "saturday_start" VARCHAR(5),
    "saturday_end" VARCHAR(5),
    "sunday_start" VARCHAR(5),
    "sunday_end" VARCHAR(5),
    "break_duration" INTEGER NOT NULL DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."overtime" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DECIMAL(5,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "overtime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."time_banks" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "balance" DECIMAL(8,2) NOT NULL,
    "year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."absences" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "type" "public"."AbsenceType" NOT NULL,
    "status" "public"."AbsenceStatus" NOT NULL DEFAULT 'PENDING',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "total_days" INTEGER NOT NULL,
    "reason" TEXT,
    "document_url" VARCHAR(512),
    "cid" VARCHAR(10),
    "is_paid" BOOLEAN NOT NULL DEFAULT true,
    "is_inss_responsibility" BOOLEAN NOT NULL DEFAULT false,
    "vacation_period_id" TEXT,
    "notes" TEXT,
    "requested_by" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "absences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vacation_periods" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "acquisition_start" TIMESTAMP(3) NOT NULL,
    "acquisition_end" TIMESTAMP(3) NOT NULL,
    "concession_start" TIMESTAMP(3) NOT NULL,
    "concession_end" TIMESTAMP(3) NOT NULL,
    "total_days" INTEGER NOT NULL DEFAULT 30,
    "used_days" INTEGER NOT NULL DEFAULT 0,
    "sold_days" INTEGER NOT NULL DEFAULT 0,
    "remaining_days" INTEGER NOT NULL DEFAULT 30,
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "scheduled_start" TIMESTAMP(3),
    "scheduled_end" TIMESTAMP(3),
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacation_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payrolls" (
    "id" TEXT NOT NULL,
    "reference_month" INTEGER NOT NULL,
    "reference_year" INTEGER NOT NULL,
    "status" "public"."PayrollStatus" NOT NULL DEFAULT 'DRAFT',
    "total_gross" DECIMAL(12,2) NOT NULL,
    "total_deductions" DECIMAL(12,2) NOT NULL,
    "total_net" DECIMAL(12,2) NOT NULL,
    "processed_at" TIMESTAMP(3),
    "processed_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "paid_at" TIMESTAMP(3),
    "paid_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."payroll_items" (
    "id" TEXT NOT NULL,
    "payroll_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "type" "public"."PayrollItemType" NOT NULL,
    "description" VARCHAR(256) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "is_deduction" BOOLEAN NOT NULL DEFAULT false,
    "reference_id" TEXT,
    "reference_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bonuses" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bonuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employees_registration_number_key" ON "public"."employees"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "employees_user_id_key" ON "public"."employees"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_cpf_key" ON "public"."employees"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "employees_pis_key" ON "public"."employees"("pis");

-- CreateIndex
CREATE INDEX "employees_user_id_idx" ON "public"."employees"("user_id");

-- CreateIndex
CREATE INDEX "employees_cpf_idx" ON "public"."employees"("cpf");

-- CreateIndex
CREATE INDEX "employees_registration_number_idx" ON "public"."employees"("registration_number");

-- CreateIndex
CREATE INDEX "employees_department_id_idx" ON "public"."employees"("department_id");

-- CreateIndex
CREATE INDEX "employees_position_id_idx" ON "public"."employees"("position_id");

-- CreateIndex
CREATE INDEX "employees_supervisor_id_idx" ON "public"."employees"("supervisor_id");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "public"."employees"("status");

-- CreateIndex
CREATE INDEX "employees_hire_date_idx" ON "public"."employees"("hire_date");

-- CreateIndex
CREATE INDEX "employees_termination_date_idx" ON "public"."employees"("termination_date");

-- CreateIndex
CREATE INDEX "employees_deleted_at_idx" ON "public"."employees"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "public"."departments"("code");

-- CreateIndex
CREATE INDEX "departments_code_idx" ON "public"."departments"("code");

-- CreateIndex
CREATE INDEX "departments_parent_id_idx" ON "public"."departments"("parent_id");

-- CreateIndex
CREATE INDEX "departments_manager_id_idx" ON "public"."departments"("manager_id");

-- CreateIndex
CREATE INDEX "departments_is_active_idx" ON "public"."departments"("is_active");

-- CreateIndex
CREATE INDEX "departments_deleted_at_idx" ON "public"."departments"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "positions_code_key" ON "public"."positions"("code");

-- CreateIndex
CREATE INDEX "positions_code_idx" ON "public"."positions"("code");

-- CreateIndex
CREATE INDEX "positions_department_id_idx" ON "public"."positions"("department_id");

-- CreateIndex
CREATE INDEX "positions_level_idx" ON "public"."positions"("level");

-- CreateIndex
CREATE INDEX "positions_is_active_idx" ON "public"."positions"("is_active");

-- CreateIndex
CREATE INDEX "positions_deleted_at_idx" ON "public"."positions"("deleted_at");

-- CreateIndex
CREATE INDEX "time_entries_employee_id_idx" ON "public"."time_entries"("employee_id");

-- CreateIndex
CREATE INDEX "time_entries_timestamp_idx" ON "public"."time_entries"("timestamp");

-- CreateIndex
CREATE INDEX "time_entries_entry_type_idx" ON "public"."time_entries"("entry_type");

-- CreateIndex
CREATE INDEX "time_entries_employee_id_timestamp_idx" ON "public"."time_entries"("employee_id", "timestamp");

-- CreateIndex
CREATE INDEX "overtime_employee_id_idx" ON "public"."overtime"("employee_id");

-- CreateIndex
CREATE INDEX "overtime_date_idx" ON "public"."overtime"("date");

-- CreateIndex
CREATE INDEX "overtime_approved_idx" ON "public"."overtime"("approved");

-- CreateIndex
CREATE INDEX "time_banks_employee_id_idx" ON "public"."time_banks"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "time_banks_employee_id_year_key" ON "public"."time_banks"("employee_id", "year");

-- CreateIndex
CREATE INDEX "absences_employee_id_idx" ON "public"."absences"("employee_id");

-- CreateIndex
CREATE INDEX "absences_type_idx" ON "public"."absences"("type");

-- CreateIndex
CREATE INDEX "absences_status_idx" ON "public"."absences"("status");

-- CreateIndex
CREATE INDEX "absences_start_date_end_date_idx" ON "public"."absences"("start_date", "end_date");

-- CreateIndex
CREATE INDEX "absences_vacation_period_id_idx" ON "public"."absences"("vacation_period_id");

-- CreateIndex
CREATE INDEX "absences_deleted_at_idx" ON "public"."absences"("deleted_at");

-- CreateIndex
CREATE INDEX "vacation_periods_employee_id_idx" ON "public"."vacation_periods"("employee_id");

-- CreateIndex
CREATE INDEX "vacation_periods_status_idx" ON "public"."vacation_periods"("status");

-- CreateIndex
CREATE INDEX "vacation_periods_acquisition_start_acquisition_end_idx" ON "public"."vacation_periods"("acquisition_start", "acquisition_end");

-- CreateIndex
CREATE INDEX "vacation_periods_concession_start_concession_end_idx" ON "public"."vacation_periods"("concession_start", "concession_end");

-- CreateIndex
CREATE INDEX "vacation_periods_deleted_at_idx" ON "public"."vacation_periods"("deleted_at");

-- CreateIndex
CREATE INDEX "payrolls_status_idx" ON "public"."payrolls"("status");

-- CreateIndex
CREATE INDEX "payrolls_reference_year_reference_month_idx" ON "public"."payrolls"("reference_year", "reference_month");

-- CreateIndex
CREATE UNIQUE INDEX "payrolls_reference_month_reference_year_key" ON "public"."payrolls"("reference_month", "reference_year");

-- CreateIndex
CREATE INDEX "payroll_items_payroll_id_idx" ON "public"."payroll_items"("payroll_id");

-- CreateIndex
CREATE INDEX "payroll_items_employee_id_idx" ON "public"."payroll_items"("employee_id");

-- CreateIndex
CREATE INDEX "payroll_items_type_idx" ON "public"."payroll_items"("type");

-- CreateIndex
CREATE INDEX "bonuses_employee_id_idx" ON "public"."bonuses"("employee_id");

-- CreateIndex
CREATE INDEX "bonuses_date_idx" ON "public"."bonuses"("date");

-- CreateIndex
CREATE INDEX "bonuses_is_paid_idx" ON "public"."bonuses"("is_paid");

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."departments" ADD CONSTRAINT "departments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."departments" ADD CONSTRAINT "departments_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."positions" ADD CONSTRAINT "positions_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."time_entries" ADD CONSTRAINT "time_entries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."overtime" ADD CONSTRAINT "overtime_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."overtime" ADD CONSTRAINT "overtime_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."time_banks" ADD CONSTRAINT "time_banks_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."absences" ADD CONSTRAINT "absences_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."absences" ADD CONSTRAINT "absences_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vacation_periods" ADD CONSTRAINT "vacation_periods_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payrolls" ADD CONSTRAINT "payrolls_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payrolls" ADD CONSTRAINT "payrolls_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payrolls" ADD CONSTRAINT "payrolls_paid_by_fkey" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_items" ADD CONSTRAINT "payroll_items_payroll_id_fkey" FOREIGN KEY ("payroll_id") REFERENCES "public"."payrolls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payroll_items" ADD CONSTRAINT "payroll_items_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bonuses" ADD CONSTRAINT "bonuses_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
