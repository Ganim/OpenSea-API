-- Soft-delete older duplicate notifications, keeping only the most recent per user+entity
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id, entity_type, entity_id
    ORDER BY created_at DESC
  ) as rn
  FROM notifications
  WHERE deleted_at IS NULL
    AND entity_type IS NOT NULL
    AND entity_id IS NOT NULL
)
UPDATE notifications SET deleted_at = NOW()
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Partial unique index: one active notification per user + entity combination
CREATE UNIQUE INDEX "notifications_user_entity_active_idx"
  ON "notifications" ("user_id", "entity_type", "entity_id")
  WHERE "deleted_at" IS NULL
    AND "entity_type" IS NOT NULL
    AND "entity_id" IS NOT NULL;
