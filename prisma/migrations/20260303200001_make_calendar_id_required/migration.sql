-- Make calendar_id NOT NULL now that all events have been backfilled
-- Any remaining NULL values (deleted events) get a default assignment first

-- Safety: assign any remaining orphan events (including soft-deleted) to their creator's personal calendar
UPDATE "calendar_events" ce
SET "calendar_id" = c."id"
FROM "calendars" c
WHERE c."tenant_id" = ce."tenant_id"
  AND c."owner_id" = ce."created_by"
  AND c."type" = 'PERSONAL'
  AND c."deleted_at" IS NULL
  AND ce."calendar_id" IS NULL;

-- Now make the column required
ALTER TABLE "calendar_events" ALTER COLUMN "calendar_id" SET NOT NULL;
