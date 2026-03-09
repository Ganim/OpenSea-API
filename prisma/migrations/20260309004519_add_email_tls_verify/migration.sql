-- DropForeignKey
ALTER TABLE "cards" DROP CONSTRAINT "cards_column_id_fkey";

-- DropIndex
DROP INDEX "notifications_user_entity_active_idx";

-- AlterTable
ALTER TABLE "email_accounts" ADD COLUMN     "tls_verify" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "card_comments_author_id_idx" ON "card_comments"("author_id");

-- CreateIndex
CREATE INDEX "card_labels_label_id_idx" ON "card_labels"("label_id");

-- CreateIndex
CREATE INDEX "cards_board_id_status_idx" ON "cards"("board_id", "status");

-- CreateIndex
CREATE INDEX "cards_board_id_priority_idx" ON "cards"("board_id", "priority");

-- CreateIndex
CREATE INDEX "cards_due_date_idx" ON "cards"("due_date");

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "board_columns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_activities" ADD CONSTRAINT "card_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
