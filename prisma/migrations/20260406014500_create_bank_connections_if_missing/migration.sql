-- Hotfix for environments where Open Finance schema was not created

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'BankConnectionStatus'
  ) THEN
    CREATE TYPE "BankConnectionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'ERROR', 'REVOKED');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "bank_connections" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "bank_account_id" TEXT NOT NULL,
  "provider" VARCHAR(32) NOT NULL DEFAULT 'PLUGGY',
  "external_item_id" VARCHAR(256) NOT NULL,
  "access_token" VARCHAR(1024) NOT NULL,
  "status" "BankConnectionStatus" NOT NULL DEFAULT 'ACTIVE',
  "last_sync_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bank_connections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "bank_connections_tenant_id_idx"
  ON "bank_connections" ("tenant_id");

CREATE INDEX IF NOT EXISTS "bank_connections_bank_account_id_idx"
  ON "bank_connections" ("bank_account_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bank_connections_tenant_id_fkey'
  ) THEN
    ALTER TABLE "bank_connections"
      ADD CONSTRAINT "bank_connections_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bank_connections_bank_account_id_fkey'
  ) THEN
    ALTER TABLE "bank_connections"
      ADD CONSTRAINT "bank_connections_bank_account_id_fkey"
      FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;
