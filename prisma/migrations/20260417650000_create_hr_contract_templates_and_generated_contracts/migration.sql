-- Backfill migration: creates hr_contract_templates and hr_generated_employment_contracts.
-- These tables were originally synced via `prisma db push` in local environments and
-- therefore never had a corresponding CREATE TABLE migration file. This caused the
-- subsequent ALTER TABLE migration (20260417700000_generated_contracts_signature_envelope)
-- to fail in production. All statements are idempotent (IF NOT EXISTS + DO blocks) so
-- this migration is safe to run on environments where the tables already exist.

-- 1. Enum ContractTemplateType
DO $$ BEGIN
  CREATE TYPE "ContractTemplateType" AS ENUM ('CLT', 'PJ', 'INTERN', 'TEMPORARY', 'EXPERIENCE', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. hr_contract_templates
CREATE TABLE IF NOT EXISTS "hr_contract_templates" (
  "id"         TEXT NOT NULL,
  "tenant_id"  TEXT NOT NULL,
  "name"       VARCHAR(256) NOT NULL,
  "type"       "ContractTemplateType" NOT NULL,
  "content"    TEXT NOT NULL,
  "is_active"  BOOLEAN NOT NULL DEFAULT true,
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3),
  CONSTRAINT "hr_contract_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "hr_contract_templates_tenant_id_idx"  ON "hr_contract_templates"("tenant_id");
CREATE INDEX IF NOT EXISTS "hr_contract_templates_type_idx"       ON "hr_contract_templates"("type");
CREATE INDEX IF NOT EXISTS "hr_contract_templates_is_active_idx"  ON "hr_contract_templates"("is_active");
CREATE INDEX IF NOT EXISTS "hr_contract_templates_deleted_at_idx" ON "hr_contract_templates"("deleted_at");

DO $$ BEGIN
  ALTER TABLE "hr_contract_templates"
    ADD CONSTRAINT "hr_contract_templates_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. hr_generated_employment_contracts
-- (signature_envelope_id column is added by migration 20260417700000)
CREATE TABLE IF NOT EXISTS "hr_generated_employment_contracts" (
  "id"               TEXT NOT NULL,
  "tenant_id"        TEXT NOT NULL,
  "template_id"      TEXT NOT NULL,
  "employee_id"      TEXT NOT NULL,
  "storage_file_id"  TEXT,
  "pdf_url"          VARCHAR(1024),
  "pdf_key"          VARCHAR(512),
  "generated_by"     TEXT NOT NULL,
  "variables"        JSONB NOT NULL DEFAULT '{}',
  "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hr_generated_employment_contracts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "hr_generated_employment_contracts_tenant_id_idx"    ON "hr_generated_employment_contracts"("tenant_id");
CREATE INDEX IF NOT EXISTS "hr_generated_employment_contracts_employee_id_idx"  ON "hr_generated_employment_contracts"("employee_id");
CREATE INDEX IF NOT EXISTS "hr_generated_employment_contracts_template_id_idx"  ON "hr_generated_employment_contracts"("template_id");
CREATE INDEX IF NOT EXISTS "hr_generated_employment_contracts_generated_by_idx" ON "hr_generated_employment_contracts"("generated_by");
CREATE INDEX IF NOT EXISTS "hr_generated_employment_contracts_created_at_idx"   ON "hr_generated_employment_contracts"("created_at");

DO $$ BEGIN
  ALTER TABLE "hr_generated_employment_contracts"
    ADD CONSTRAINT "hr_generated_employment_contracts_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "hr_generated_employment_contracts"
    ADD CONSTRAINT "hr_generated_employment_contracts_template_id_fkey"
    FOREIGN KEY ("template_id") REFERENCES "hr_contract_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "hr_generated_employment_contracts"
    ADD CONSTRAINT "hr_generated_employment_contracts_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
