-- Hotfix: add missing columns observed in production runtime
-- Safe to run multiple times due IF NOT EXISTS

ALTER TABLE "customers"
  ADD COLUMN IF NOT EXISTS "is_system" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "bank_accounts"
  ADD COLUMN IF NOT EXISTS "chart_of_account_id" TEXT,
  ADD COLUMN IF NOT EXISTS "api_provider" VARCHAR(32),
  ADD COLUMN IF NOT EXISTS "api_client_id" VARCHAR(256),
  ADD COLUMN IF NOT EXISTS "api_cert_file_id" TEXT,
  ADD COLUMN IF NOT EXISTS "api_cert_key_file_id" TEXT,
  ADD COLUMN IF NOT EXISTS "api_scopes" VARCHAR(512),
  ADD COLUMN IF NOT EXISTS "api_webhook_secret" VARCHAR(256),
  ADD COLUMN IF NOT EXISTS "api_enabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "auto_emit_boleto" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "auto_low_threshold" NUMERIC(15,2);

ALTER TABLE "finance_categories"
  ADD COLUMN IF NOT EXISTS "chart_of_account_id" TEXT;

ALTER TABLE "finance_entries"
  ADD COLUMN IF NOT EXISTS "chart_of_account_id" TEXT,
  ADD COLUMN IF NOT EXISTS "pix_charge_id" TEXT,
  ADD COLUMN IF NOT EXISTS "boleto_charge_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "boleto_barcode_number" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "boleto_digitable_line" VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "boleto_pdf_url" VARCHAR(1024),
  ADD COLUMN IF NOT EXISTS "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS "exchange_rate" NUMERIC(12,6),
  ADD COLUMN IF NOT EXISTS "original_amount" NUMERIC(15,2);
