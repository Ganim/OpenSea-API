-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_messages_account_id_thread_id_idx" ON "email_messages"("account_id", "thread_id");
