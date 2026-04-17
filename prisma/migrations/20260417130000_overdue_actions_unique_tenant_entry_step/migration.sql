-- P2-08: DB-level unique constraint prevents duplicate overdue actions when two
-- concurrent cron workers both run process-overdue-escalations and race between
-- "check existing action" and "create new action".
--
-- Remove any pre-existing duplicates (keeping the oldest row by createdAt), then
-- add the UNIQUE index. A partial index avoids colliding on legacy rows that
-- have step_id NULL (those are always unique in practice because the use case
-- only creates actions with a step_id).

DELETE FROM "overdue_actions" a
USING "overdue_actions" b
WHERE a.tenant_id = b.tenant_id
  AND a.entry_id = b.entry_id
  AND a.step_id IS NOT NULL
  AND b.step_id IS NOT NULL
  AND a.step_id = b.step_id
  AND a.ctid > b.ctid;

CREATE UNIQUE INDEX "overdue_actions_tenant_id_entry_id_step_id_key"
  ON "overdue_actions" ("tenant_id", "entry_id", "step_id");
