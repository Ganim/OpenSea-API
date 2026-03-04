-- CreateIndex (GIN for full-text search on email messages)
CREATE INDEX IF NOT EXISTS email_messages_fts_idx ON email_messages USING GIN (to_tsvector('simple', coalesce(subject, '') || ' ' || coalesce(from_address, '') || ' ' || coalesce(from_name, '') || ' ' || coalesce(snippet, '')));
