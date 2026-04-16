-- CreateEnum
CREATE TYPE "SalaryChangeReason" AS ENUM ('ADMISSION', 'ADJUSTMENT', 'PROMOTION', 'MERIT', 'ROLE_CHANGE', 'CORRECTION');

-- CreateEnum
CREATE TYPE "OneOnOneStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "employee_kudos" ADD COLUMN     "is_pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pinned_at" TIMESTAMP(3),
ADD COLUMN     "pinned_by" TEXT;

-- CreateTable
CREATE TABLE "hr_review_competencies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "self_score" DOUBLE PRECISION,
    "manager_score" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hr_review_competencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_kudos_reactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "kudos_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "emoji" VARCHAR(16) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_kudos_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_kudos_replies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "kudos_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hr_kudos_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_announcement_read_receipts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "announcement_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_announcement_read_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_salary_history" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "previous_salary" DECIMAL(15,2),
    "new_salary" DECIMAL(15,2) NOT NULL,
    "reason" "SalaryChangeReason" NOT NULL,
    "notes" TEXT,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "changed_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_salary_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_one_on_one_meetings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "manager_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "status" "OneOnOneStatus" NOT NULL DEFAULT 'SCHEDULED',
    "private_notes_manager" TEXT,
    "private_notes_report" TEXT,
    "shared_notes" TEXT,
    "cancelled_reason" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "hr_one_on_one_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_one_on_one_talking_points" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "added_by_employee_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_one_on_one_talking_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_one_on_one_action_items" (
    "id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_one_on_one_action_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hr_review_competencies_tenant_id_idx" ON "hr_review_competencies"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_review_competencies_review_id_idx" ON "hr_review_competencies"("review_id");

-- CreateIndex
CREATE INDEX "hr_kudos_reactions_tenant_id_idx" ON "hr_kudos_reactions"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_kudos_reactions_kudos_id_idx" ON "hr_kudos_reactions"("kudos_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_kudos_reactions_kudos_id_employee_id_emoji_key" ON "hr_kudos_reactions"("kudos_id", "employee_id", "emoji");

-- CreateIndex
CREATE INDEX "hr_kudos_replies_tenant_id_idx" ON "hr_kudos_replies"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_kudos_replies_kudos_id_idx" ON "hr_kudos_replies"("kudos_id");

-- CreateIndex
CREATE INDEX "hr_announcement_read_receipts_tenant_id_idx" ON "hr_announcement_read_receipts"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_announcement_read_receipts_announcement_id_idx" ON "hr_announcement_read_receipts"("announcement_id");

-- CreateIndex
CREATE UNIQUE INDEX "hr_announcement_read_receipts_announcement_id_employee_id_key" ON "hr_announcement_read_receipts"("announcement_id", "employee_id");

-- CreateIndex
CREATE INDEX "hr_salary_history_tenant_id_idx" ON "hr_salary_history"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_salary_history_employee_id_idx" ON "hr_salary_history"("employee_id");

-- CreateIndex
CREATE INDEX "hr_salary_history_effective_date_idx" ON "hr_salary_history"("effective_date");

-- CreateIndex
CREATE INDEX "hr_one_on_one_meetings_tenant_id_idx" ON "hr_one_on_one_meetings"("tenant_id");

-- CreateIndex
CREATE INDEX "hr_one_on_one_meetings_manager_id_idx" ON "hr_one_on_one_meetings"("manager_id");

-- CreateIndex
CREATE INDEX "hr_one_on_one_meetings_report_id_idx" ON "hr_one_on_one_meetings"("report_id");

-- CreateIndex
CREATE INDEX "hr_one_on_one_meetings_scheduled_at_idx" ON "hr_one_on_one_meetings"("scheduled_at");

-- CreateIndex
CREATE INDEX "hr_one_on_one_talking_points_meeting_id_idx" ON "hr_one_on_one_talking_points"("meeting_id");

-- CreateIndex
CREATE INDEX "hr_one_on_one_action_items_meeting_id_idx" ON "hr_one_on_one_action_items"("meeting_id");

-- CreateIndex
CREATE INDEX "hr_one_on_one_action_items_owner_id_idx" ON "hr_one_on_one_action_items"("owner_id");

-- AddForeignKey
ALTER TABLE "hr_review_competencies" ADD CONSTRAINT "hr_review_competencies_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "performance_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_review_competencies" ADD CONSTRAINT "hr_review_competencies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_kudos_reactions" ADD CONSTRAINT "hr_kudos_reactions_kudos_id_fkey" FOREIGN KEY ("kudos_id") REFERENCES "employee_kudos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_kudos_reactions" ADD CONSTRAINT "hr_kudos_reactions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_kudos_reactions" ADD CONSTRAINT "hr_kudos_reactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_kudos_replies" ADD CONSTRAINT "hr_kudos_replies_kudos_id_fkey" FOREIGN KEY ("kudos_id") REFERENCES "employee_kudos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_kudos_replies" ADD CONSTRAINT "hr_kudos_replies_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_kudos_replies" ADD CONSTRAINT "hr_kudos_replies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_announcement_read_receipts" ADD CONSTRAINT "hr_announcement_read_receipts_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "company_announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_announcement_read_receipts" ADD CONSTRAINT "hr_announcement_read_receipts_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_announcement_read_receipts" ADD CONSTRAINT "hr_announcement_read_receipts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_salary_history" ADD CONSTRAINT "hr_salary_history_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_salary_history" ADD CONSTRAINT "hr_salary_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_one_on_one_meetings" ADD CONSTRAINT "hr_one_on_one_meetings_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_one_on_one_meetings" ADD CONSTRAINT "hr_one_on_one_meetings_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_one_on_one_meetings" ADD CONSTRAINT "hr_one_on_one_meetings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_one_on_one_talking_points" ADD CONSTRAINT "hr_one_on_one_talking_points_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "hr_one_on_one_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_one_on_one_talking_points" ADD CONSTRAINT "hr_one_on_one_talking_points_added_by_employee_id_fkey" FOREIGN KEY ("added_by_employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_one_on_one_action_items" ADD CONSTRAINT "hr_one_on_one_action_items_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "hr_one_on_one_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_one_on_one_action_items" ADD CONSTRAINT "hr_one_on_one_action_items_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

