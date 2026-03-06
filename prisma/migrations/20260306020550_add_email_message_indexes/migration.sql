-- CreateIndex
CREATE INDEX "email_messages_account_id_message_id_idx" ON "email_messages"("account_id", "message_id");

-- CreateIndex
CREATE INDEX "email_messages_account_id_folder_id_received_at_idx" ON "email_messages"("account_id", "folder_id", "received_at" DESC);
