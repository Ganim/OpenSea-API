-- CreateIndex (GIN index for full-text search on email messages)
-- This index supports the to_tsvector/plainto_tsquery queries in
-- prisma-email-messages-repository.ts for efficient email search.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "email_messages_fts_idx"
  ON "email_messages"
  USING GIN (
    to_tsvector('simple',
      COALESCE("subject", '') || ' ' ||
      COALESCE("from_address", '') || ' ' ||
      COALESCE("from_name", '') || ' ' ||
      COALESCE("snippet", '')
    )
  );
