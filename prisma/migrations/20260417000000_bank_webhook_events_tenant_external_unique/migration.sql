-- P0-15: garante idempotencia dos webhooks bancarios via unique (tenantId, externalId).
-- Duplicatas pre-existentes sao mantidas apenas com o registro mais antigo;
-- os demais sao movidos para bank_webhook_events_duplicates antes da constraint
-- para preservar auditoria. Em bancos vazios (esperado em producao via cron +
-- sandbox), a migration e puramente estrutural.

CREATE TABLE IF NOT EXISTS "bank_webhook_events_duplicates" (
  LIKE "bank_webhook_events" INCLUDING ALL
);

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "tenant_id", "external_id"
      ORDER BY "created_at" ASC
    ) AS rnum
  FROM "bank_webhook_events"
)
INSERT INTO "bank_webhook_events_duplicates"
SELECT bwe.* FROM "bank_webhook_events" bwe
INNER JOIN ranked r ON r."id" = bwe."id"
WHERE r.rnum > 1;

DELETE FROM "bank_webhook_events"
WHERE "id" IN (SELECT "id" FROM "bank_webhook_events_duplicates");

CREATE UNIQUE INDEX "bank_webhook_events_tenant_external_unique"
  ON "bank_webhook_events" ("tenant_id", "external_id");
