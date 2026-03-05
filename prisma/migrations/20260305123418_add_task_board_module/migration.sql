-- CreateEnum
CREATE TYPE "BoardType" AS ENUM ('PERSONAL', 'TEAM');

-- CreateEnum
CREATE TYPE "BoardVisibility" AS ENUM ('PRIVATE', 'SHARED');

-- CreateEnum
CREATE TYPE "BoardView" AS ENUM ('KANBAN', 'TABLE', 'CALENDAR', 'TIMELINE', 'DASHBOARD');

-- CreateEnum
CREATE TYPE "BoardMemberRole" AS ENUM ('VIEWER', 'EDITOR');

-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE', 'CANCELED');

-- CreateEnum
CREATE TYPE "CardPriority" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'CHECKBOX', 'SELECT', 'MULTI_SELECT');

-- CreateEnum
CREATE TYPE "CardActivityType" AS ENUM ('CREATED', 'UPDATED', 'MOVED', 'ASSIGNED', 'COMMENTED', 'ATTACHMENT_ADDED', 'ATTACHMENT_REMOVED', 'LABEL_ADDED', 'LABEL_REMOVED', 'SUBTASK_COMPLETED', 'AUTOMATION_TRIGGERED', 'ARCHIVED', 'RESTORED', 'DELETED');

-- CreateEnum
CREATE TYPE "AutomationTrigger" AS ENUM ('CARD_MOVED', 'CARD_CREATED', 'DUE_DATE_REACHED', 'ALL_SUBTASKS_DONE', 'FIELD_CHANGED');

-- CreateEnum
CREATE TYPE "AutomationAction" AS ENUM ('SET_FIELD', 'MOVE_CARD', 'ASSIGN_USER', 'ADD_LABEL', 'SEND_NOTIFICATION', 'COMPLETE_CARD');

-- AlterEnum
ALTER TYPE "AuditModule" ADD VALUE 'TASKS';

-- AlterEnum
ALTER TYPE "SystemModuleEnum" ADD VALUE 'TASKS';

-- AlterTable
ALTER TABLE "team_calendar_configs" ADD COLUMN     "admin_can_manage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "member_can_manage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "owner_can_manage" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "boards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "description" TEXT,
    "type" "BoardType" NOT NULL DEFAULT 'PERSONAL',
    "team_id" TEXT,
    "owner_id" TEXT NOT NULL,
    "storage_folder_id" TEXT,
    "visibility" "BoardVisibility" NOT NULL DEFAULT 'PRIVATE',
    "default_view" "BoardView" NOT NULL DEFAULT 'KANBAN',
    "settings" JSONB,
    "metadata" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,
    "archived_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_columns" (
    "id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "color" VARCHAR(7),
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_done" BOOLEAN NOT NULL DEFAULT false,
    "wip_limit" INTEGER,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cards" (
    "id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "column_id" TEXT NOT NULL,
    "parent_card_id" TEXT,
    "title" VARCHAR(512) NOT NULL,
    "description" TEXT,
    "status" "CardStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "CardPriority" NOT NULL DEFAULT 'NONE',
    "position" INTEGER NOT NULL DEFAULT 0,
    "assignee_id" TEXT,
    "reporter_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "estimated_minutes" INTEGER,
    "cover_color" VARCHAR(7),
    "cover_image_id" TEXT,
    "metadata" JSONB,
    "system_source_type" VARCHAR(64),
    "system_source_id" TEXT,
    "archived_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_labels" (
    "id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "color" VARCHAR(7) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_labels" (
    "card_id" TEXT NOT NULL,
    "label_id" TEXT NOT NULL,

    CONSTRAINT "card_labels_pkey" PRIMARY KEY ("card_id","label_id")
);

-- CreateTable
CREATE TABLE "board_members" (
    "id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "BoardMemberRole" NOT NULL DEFAULT 'VIEWER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_custom_fields" (
    "id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "type" "CustomFieldType" NOT NULL,
    "options" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_custom_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_custom_field_values" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "card_custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_comments" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mentions" JSONB,
    "edited_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment_reactions" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" VARCHAR(16) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_attachments" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "added_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_checklists" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_items" (
    "id" TEXT NOT NULL,
    "checklist_id" TEXT NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "assignee_id" TEXT,
    "due_date" TIMESTAMP(3),
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_activities" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "CardActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "field" VARCHAR(128),
    "old_value" JSONB,
    "new_value" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_automations" (
    "id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "name" VARCHAR(256) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "trigger" "AutomationTrigger" NOT NULL,
    "trigger_config" JSONB NOT NULL,
    "action" "AutomationAction" NOT NULL,
    "action_config" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_automations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "boards_tenant_id_idx" ON "boards"("tenant_id");

-- CreateIndex
CREATE INDEX "boards_tenant_id_owner_id_idx" ON "boards"("tenant_id", "owner_id");

-- CreateIndex
CREATE INDEX "boards_tenant_id_team_id_idx" ON "boards"("tenant_id", "team_id");

-- CreateIndex
CREATE INDEX "boards_tenant_id_deleted_at_idx" ON "boards"("tenant_id", "deleted_at");

-- CreateIndex
CREATE INDEX "board_columns_board_id_idx" ON "board_columns"("board_id");

-- CreateIndex
CREATE INDEX "board_columns_board_id_position_idx" ON "board_columns"("board_id", "position");

-- CreateIndex
CREATE INDEX "cards_board_id_idx" ON "cards"("board_id");

-- CreateIndex
CREATE INDEX "cards_board_id_column_id_idx" ON "cards"("board_id", "column_id");

-- CreateIndex
CREATE INDEX "cards_board_id_assignee_id_idx" ON "cards"("board_id", "assignee_id");

-- CreateIndex
CREATE INDEX "cards_board_id_parent_card_id_idx" ON "cards"("board_id", "parent_card_id");

-- CreateIndex
CREATE INDEX "cards_board_id_deleted_at_idx" ON "cards"("board_id", "deleted_at");

-- CreateIndex
CREATE INDEX "cards_system_source_type_system_source_id_idx" ON "cards"("system_source_type", "system_source_id");

-- CreateIndex
CREATE INDEX "board_labels_board_id_idx" ON "board_labels"("board_id");

-- CreateIndex
CREATE INDEX "board_members_board_id_idx" ON "board_members"("board_id");

-- CreateIndex
CREATE UNIQUE INDEX "board_members_board_id_user_id_key" ON "board_members"("board_id", "user_id");

-- CreateIndex
CREATE INDEX "board_custom_fields_board_id_idx" ON "board_custom_fields"("board_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_custom_field_values_card_id_field_id_key" ON "card_custom_field_values"("card_id", "field_id");

-- CreateIndex
CREATE INDEX "card_comments_card_id_idx" ON "card_comments"("card_id");

-- CreateIndex
CREATE INDEX "card_comments_card_id_deleted_at_idx" ON "card_comments"("card_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "comment_reactions_comment_id_user_id_emoji_key" ON "comment_reactions"("comment_id", "user_id", "emoji");

-- CreateIndex
CREATE INDEX "card_attachments_card_id_idx" ON "card_attachments"("card_id");

-- CreateIndex
CREATE INDEX "card_checklists_card_id_idx" ON "card_checklists"("card_id");

-- CreateIndex
CREATE INDEX "checklist_items_checklist_id_idx" ON "checklist_items"("checklist_id");

-- CreateIndex
CREATE INDEX "card_activities_card_id_idx" ON "card_activities"("card_id");

-- CreateIndex
CREATE INDEX "card_activities_board_id_idx" ON "card_activities"("board_id");

-- CreateIndex
CREATE INDEX "card_activities_card_id_created_at_idx" ON "card_activities"("card_id", "created_at");

-- CreateIndex
CREATE INDEX "board_automations_board_id_idx" ON "board_automations"("board_id");

-- CreateIndex
CREATE INDEX "board_automations_board_id_is_active_idx" ON "board_automations"("board_id", "is_active");

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_storage_folder_id_fkey" FOREIGN KEY ("storage_folder_id") REFERENCES "storage_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_columns" ADD CONSTRAINT "board_columns_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "board_columns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_parent_card_id_fkey" FOREIGN KEY ("parent_card_id") REFERENCES "cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_labels" ADD CONSTRAINT "board_labels_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_labels" ADD CONSTRAINT "card_labels_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_labels" ADD CONSTRAINT "card_labels_label_id_fkey" FOREIGN KEY ("label_id") REFERENCES "board_labels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_members" ADD CONSTRAINT "board_members_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_members" ADD CONSTRAINT "board_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_custom_fields" ADD CONSTRAINT "board_custom_fields_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_custom_field_values" ADD CONSTRAINT "card_custom_field_values_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_custom_field_values" ADD CONSTRAINT "card_custom_field_values_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "board_custom_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_comments" ADD CONSTRAINT "card_comments_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_comments" ADD CONSTRAINT "card_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "card_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_attachments" ADD CONSTRAINT "card_attachments_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_attachments" ADD CONSTRAINT "card_attachments_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_checklists" ADD CONSTRAINT "card_checklists_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "card_checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_activities" ADD CONSTRAINT "card_activities_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_activities" ADD CONSTRAINT "card_activities_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_automations" ADD CONSTRAINT "board_automations_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
