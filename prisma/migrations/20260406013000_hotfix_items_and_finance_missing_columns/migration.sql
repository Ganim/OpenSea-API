-- Hotfix for production schema drift (safe/idempotent)

-- Stock/items: fields referenced by runtime Prisma queries
ALTER TABLE "items"
  ADD COLUMN IF NOT EXISTS "last_known_address" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "exit_movement_type" "MovementType";

-- Finance entries: field already present in Prisma schema and used by runtime
ALTER TABLE "finance_entries"
  ADD COLUMN IF NOT EXISTS "fiscal_document_id" TEXT;

CREATE INDEX IF NOT EXISTS "finance_entries_fiscal_document_id_idx"
  ON "finance_entries" ("fiscal_document_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'finance_entries_fiscal_document_id_fkey'
  ) THEN
    ALTER TABLE "finance_entries"
      ADD CONSTRAINT "finance_entries_fiscal_document_id_fkey"
      FOREIGN KEY ("fiscal_document_id") REFERENCES "fiscal_documents"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END
$$;
