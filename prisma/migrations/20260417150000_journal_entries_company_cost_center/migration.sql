-- P1-13: propagate companyId/costCenterId from source financial entities to auto-generated journal entries.

-- 1. Header columns
ALTER TABLE "journal_entries"
  ADD COLUMN "company_id" TEXT,
  ADD COLUMN "cost_center_id" TEXT;

CREATE INDEX "journal_entries_tenant_id_company_id_idx"
  ON "journal_entries" ("tenant_id", "company_id");

CREATE INDEX "journal_entries_tenant_id_cost_center_id_idx"
  ON "journal_entries" ("tenant_id", "cost_center_id");

-- 2. Line columns (per-line override; default cascades from header)
ALTER TABLE "journal_entry_lines"
  ADD COLUMN "company_id" TEXT,
  ADD COLUMN "cost_center_id" TEXT;

CREATE INDEX "journal_entry_lines_company_id_idx"
  ON "journal_entry_lines" ("company_id");

CREATE INDEX "journal_entry_lines_cost_center_id_idx"
  ON "journal_entry_lines" ("cost_center_id");

-- 3. Backfill header from FINANCE_ENTRY source (PAYABLE/RECEIVABLE provisioning journals)
UPDATE "journal_entries" je
SET "company_id"     = fe."company_id",
    "cost_center_id" = fe."cost_center_id"
FROM "finance_entries" fe
WHERE je."source_type" = 'FINANCE_ENTRY'
  AND je."source_id"   = fe."id"
  AND je."company_id" IS NULL
  AND je."cost_center_id" IS NULL;

-- 4. Backfill header from FINANCE_PAYMENT source (settlement journals — link via payment.entry_id)
UPDATE "journal_entries" je
SET "company_id"     = fe."company_id",
    "cost_center_id" = fe."cost_center_id"
FROM "finance_entry_payments" fep
JOIN "finance_entries" fe ON fe."id" = fep."entry_id"
WHERE je."source_type" = 'FINANCE_PAYMENT'
  AND je."source_id"   = fep."id"
  AND je."company_id" IS NULL
  AND je."cost_center_id" IS NULL;

-- 5. Cascade header values down to lines for backfilled records
UPDATE "journal_entry_lines" jel
SET "company_id"     = je."company_id",
    "cost_center_id" = je."cost_center_id"
FROM "journal_entries" je
WHERE jel."journal_entry_id" = je."id"
  AND jel."company_id" IS NULL
  AND jel."cost_center_id" IS NULL
  AND (je."company_id" IS NOT NULL OR je."cost_center_id" IS NOT NULL);
