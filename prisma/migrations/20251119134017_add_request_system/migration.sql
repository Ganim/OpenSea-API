-- CreateEnum
CREATE TYPE "public"."RequestType" AS ENUM ('ACCESS_REQUEST', 'PURCHASE_REQUEST', 'APPROVAL_REQUEST', 'ACTION_REQUEST', 'CHANGE_REQUEST', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."RequestStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_PROGRESS', 'PENDING_INFO', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."RequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."RequestTargetType" AS ENUM ('USER', 'GROUP', 'ROLE');

-- CreateTable
CREATE TABLE "public"."requests" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "type" "public"."RequestType" NOT NULL,
    "category" VARCHAR(100),
    "status" "public"."RequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "priority" "public"."RequestPriority" NOT NULL DEFAULT 'MEDIUM',
    "requester_id" TEXT NOT NULL,
    "target_type" "public"."RequestTargetType" NOT NULL,
    "target_id" TEXT,
    "target_role" "public"."Role",
    "assigned_to_id" TEXT,
    "due_date" TIMESTAMP(3),
    "sla_deadline" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "approval_id" TEXT,
    "submitted_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."request_attachments" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(512) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."request_comments" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "request_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."request_history" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "performed_by_id" TEXT NOT NULL,
    "old_value" JSONB,
    "new_value" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "requests_approval_id_key" ON "public"."requests"("approval_id");

-- CreateIndex
CREATE INDEX "requests_requester_id_idx" ON "public"."requests"("requester_id");

-- CreateIndex
CREATE INDEX "requests_assigned_to_id_idx" ON "public"."requests"("assigned_to_id");

-- CreateIndex
CREATE INDEX "requests_status_idx" ON "public"."requests"("status");

-- CreateIndex
CREATE INDEX "requests_type_category_idx" ON "public"."requests"("type", "category");

-- CreateIndex
CREATE INDEX "requests_due_date_idx" ON "public"."requests"("due_date");

-- CreateIndex
CREATE INDEX "requests_created_at_idx" ON "public"."requests"("created_at");

-- CreateIndex
CREATE INDEX "request_attachments_request_id_idx" ON "public"."request_attachments"("request_id");

-- CreateIndex
CREATE INDEX "request_comments_request_id_idx" ON "public"."request_comments"("request_id");

-- CreateIndex
CREATE INDEX "request_comments_author_id_idx" ON "public"."request_comments"("author_id");

-- CreateIndex
CREATE INDEX "request_history_request_id_idx" ON "public"."request_history"("request_id");

-- CreateIndex
CREATE INDEX "request_history_created_at_idx" ON "public"."request_history"("created_at");

-- AddForeignKey
ALTER TABLE "public"."requests" ADD CONSTRAINT "requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."requests" ADD CONSTRAINT "requests_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."request_attachments" ADD CONSTRAINT "request_attachments_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."request_attachments" ADD CONSTRAINT "request_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."request_comments" ADD CONSTRAINT "request_comments_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."request_comments" ADD CONSTRAINT "request_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."request_history" ADD CONSTRAINT "request_history_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."request_history" ADD CONSTRAINT "request_history_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
