-- Backfill: Create PERSONAL calendars for users who have events but no calendar
-- Then assign calendarId to existing events

-- Step 1: Create a PERSONAL calendar for each (tenant, user) that has events without a calendarId
INSERT INTO "calendars" ("id", "tenant_id", "name", "color", "type", "owner_id", "is_default", "settings", "created_by", "created_at", "updated_at")
SELECT
  gen_random_uuid(),
  ce."tenant_id",
  'Meu Calendário',
  '#3b82f6',
  'PERSONAL',
  ce."created_by",
  true,
  '{}',
  ce."created_by",
  now(),
  now()
FROM "calendar_events" ce
WHERE ce."calendar_id" IS NULL
  AND ce."deleted_at" IS NULL
GROUP BY ce."tenant_id", ce."created_by"
ON CONFLICT DO NOTHING;

-- Step 2: Assign calendarId to orphan events
UPDATE "calendar_events" ce
SET "calendar_id" = c."id"
FROM "calendars" c
WHERE c."tenant_id" = ce."tenant_id"
  AND c."owner_id" = ce."created_by"
  AND c."type" = 'PERSONAL'
  AND c."deleted_at" IS NULL
  AND ce."calendar_id" IS NULL
  AND ce."deleted_at" IS NULL;
