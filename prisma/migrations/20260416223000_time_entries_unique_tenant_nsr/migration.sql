-- Portaria 671 Anexo III: NSR must be unique per tenant.
-- Backfill sequential NSRs where missing, then enforce uniqueness.

-- 1. Backfill nsr_number for existing rows with NULL values using row_number()
--    ordered by timestamp, grouped by tenant. This preserves chronological order.
WITH ranked AS (
  SELECT
    id,
    tenant_id,
    ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY timestamp, created_at, id) AS seq
  FROM time_entries
  WHERE nsr_number IS NULL
)
UPDATE time_entries te
SET nsr_number = (
  SELECT COALESCE(MAX(nsr_number), 0) FROM time_entries WHERE tenant_id = te.tenant_id
) + ranked.seq
FROM ranked
WHERE te.id = ranked.id;

-- 2. Resolve any existing duplicates by re-sequencing within the tenant.
--    Duplicates (pre-fix race losers) get bumped above the current max.
WITH duplicated AS (
  SELECT
    id,
    tenant_id,
    nsr_number,
    ROW_NUMBER() OVER (PARTITION BY tenant_id, nsr_number ORDER BY timestamp, created_at, id) AS dup_rank
  FROM time_entries
  WHERE nsr_number IS NOT NULL
),
to_fix AS (
  SELECT id, tenant_id FROM duplicated WHERE dup_rank > 1
),
renumbered AS (
  SELECT
    tf.id,
    tf.tenant_id,
    ROW_NUMBER() OVER (PARTITION BY tf.tenant_id ORDER BY tf.id) AS bump
  FROM to_fix tf
)
UPDATE time_entries te
SET nsr_number = (
  SELECT COALESCE(MAX(nsr_number), 0) FROM time_entries WHERE tenant_id = te.tenant_id
) + renumbered.bump
FROM renumbered
WHERE te.id = renumbered.id;

-- 3. Enforce uniqueness.
CREATE UNIQUE INDEX "time_entries_tenant_nsr_unique" ON "time_entries" ("tenant_id", "nsr_number");
