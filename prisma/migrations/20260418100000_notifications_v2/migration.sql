-- =========================================================================
-- notifications_v2 migration
-- Introduces the isolated notifications module schema:
--  - New enums: NotificationKind, NotificationState, NotificationCallbackStatus,
--    NotificationFrequency, NotificationDeliveryStatus
--  - New columns on `notifications` (all nullable for backwards compatibility)
--  - New tables: notification_categories, notification_module_registry,
--    notification_preferences_v2, notification_module_settings,
--    user_notification_settings, notification_delivery_attempts,
--    push_subscriptions, notification_callback_jobs
--
-- Legacy tables (notification_preferences, notification_templates) are kept
-- intact so existing consumers keep working during the phased rollout.
-- =========================================================================

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('INFORMATIONAL', 'LINK', 'ACTIONABLE', 'APPROVAL', 'FORM', 'PROGRESS', 'SYSTEM_BANNER');

-- CreateEnum
CREATE TYPE "NotificationState" AS ENUM ('PENDING', 'RESOLVED', 'EXPIRED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationCallbackStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationFrequency" AS ENUM ('INSTANT', 'HOURLY_DIGEST', 'DAILY_DIGEST', 'WEEKLY_DIGEST', 'DISABLED');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'SKIPPED');

-- AlterTable (notifications)
ALTER TABLE "notifications"
  ADD COLUMN "tenant_id" TEXT,
  ADD COLUMN "kind" "NotificationKind",
  ADD COLUMN "category_id" TEXT,
  ADD COLUMN "channels" "NotificationChannel"[] DEFAULT ARRAY[]::"NotificationChannel"[],
  ADD COLUMN "fallback_url" VARCHAR(512),
  ADD COLUMN "actions" JSONB,
  ADD COLUMN "state" "NotificationState",
  ADD COLUMN "resolved_action" VARCHAR(64),
  ADD COLUMN "resolved_by_id" TEXT,
  ADD COLUMN "resolved_at" TIMESTAMP(3),
  ADD COLUMN "resolved_payload" JSONB,
  ADD COLUMN "callback_url" VARCHAR(512),
  ADD COLUMN "callback_status" "NotificationCallbackStatus",
  ADD COLUMN "callback_error" TEXT,
  ADD COLUMN "expires_at" TIMESTAMP(3),
  ADD COLUMN "group_key" VARCHAR(128),
  ADD COLUMN "digest_batch_id" TEXT,
  ADD COLUMN "idempotency_key" VARCHAR(128),
  ADD COLUMN "progress" INTEGER,
  ADD COLUMN "progress_total" INTEGER,
  ADD COLUMN "template_code" VARCHAR(64);

-- CreateTable
CREATE TABLE "notification_categories" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "module" VARCHAR(32) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(64),
    "default_kind" "NotificationKind" NOT NULL,
    "default_priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "default_channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "digest_supported" BOOLEAN NOT NULL DEFAULT true,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_module_registry" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "display_name" VARCHAR(128) NOT NULL,
    "icon" VARCHAR(64),
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_module_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences_v2" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" "NotificationFrequency" NOT NULL DEFAULT 'INSTANT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_v2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_module_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "module" VARCHAR(32) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_module_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification_settings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "do_not_disturb" BOOLEAN NOT NULL DEFAULT false,
    "dnd_start" VARCHAR(5),
    "dnd_end" VARCHAR(5),
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo',
    "digest_schedule" VARCHAR(32),
    "sound_enabled" BOOLEAN NOT NULL DEFAULT true,
    "master_in_app" BOOLEAN NOT NULL DEFAULT true,
    "master_email" BOOLEAN NOT NULL DEFAULT true,
    "master_push" BOOLEAN NOT NULL DEFAULT false,
    "master_sms" BOOLEAN NOT NULL DEFAULT false,
    "master_whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "allow_banner_ads" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_delivery_attempts" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "status" "NotificationDeliveryStatus" NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "provider_id" VARCHAR(128),
    "provider_name" VARCHAR(32),
    "error" TEXT,
    "latency_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_delivery_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "endpoint" TEXT NOT NULL,
    "p256dh_key" VARCHAR(128) NOT NULL,
    "auth_key" VARCHAR(64) NOT NULL,
    "user_agent" VARCHAR(256),
    "device_name" VARCHAR(128),
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_callback_jobs" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT NOT NULL,
    "callback_url" VARCHAR(512) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "NotificationCallbackStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "next_attempt_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_callback_jobs_pkey" PRIMARY KEY ("id")
);

-- Unique indexes & indexes on existing notifications table
CREATE INDEX "notifications_tenant_id_idx" ON "notifications"("tenant_id");
CREATE INDEX "notifications_kind_idx" ON "notifications"("kind");
CREATE INDEX "notifications_state_expires_at_idx" ON "notifications"("state", "expires_at");
CREATE INDEX "notifications_category_id_idx" ON "notifications"("category_id");
CREATE INDEX "notifications_group_key_idx" ON "notifications"("group_key");
CREATE UNIQUE INDEX "notifications_tenant_id_user_id_idempotency_key_key" ON "notifications"("tenant_id", "user_id", "idempotency_key");

-- Unique indexes & indexes for new tables
CREATE UNIQUE INDEX "notification_categories_code_key" ON "notification_categories"("code");
CREATE INDEX "notification_categories_module_idx" ON "notification_categories"("module");
CREATE INDEX "notification_categories_is_active_idx" ON "notification_categories"("is_active");

CREATE UNIQUE INDEX "notification_module_registry_code_key" ON "notification_module_registry"("code");

CREATE INDEX "notification_preferences_v2_user_id_tenant_id_idx" ON "notification_preferences_v2"("user_id", "tenant_id");
CREATE INDEX "notification_preferences_v2_category_id_idx" ON "notification_preferences_v2"("category_id");
CREATE UNIQUE INDEX "notification_preferences_v2_user_id_tenant_id_category_id_c_key" ON "notification_preferences_v2"("user_id", "tenant_id", "category_id", "channel");

CREATE INDEX "notification_module_settings_user_id_tenant_id_idx" ON "notification_module_settings"("user_id", "tenant_id");
CREATE UNIQUE INDEX "notification_module_settings_user_id_tenant_id_module_key" ON "notification_module_settings"("user_id", "tenant_id", "module");

CREATE INDEX "user_notification_settings_user_id_idx" ON "user_notification_settings"("user_id");
CREATE UNIQUE INDEX "user_notification_settings_user_id_tenant_id_key" ON "user_notification_settings"("user_id", "tenant_id");

CREATE INDEX "notification_delivery_attempts_notification_id_idx" ON "notification_delivery_attempts"("notification_id");
CREATE INDEX "notification_delivery_attempts_status_created_at_idx" ON "notification_delivery_attempts"("status", "created_at");

CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");
CREATE INDEX "push_subscriptions_user_id_revoked_at_idx" ON "push_subscriptions"("user_id", "revoked_at");
CREATE INDEX "push_subscriptions_tenant_id_idx" ON "push_subscriptions"("tenant_id");

CREATE INDEX "notification_callback_jobs_status_next_attempt_at_idx" ON "notification_callback_jobs"("status", "next_attempt_at");
CREATE INDEX "notification_callback_jobs_notification_id_idx" ON "notification_callback_jobs"("notification_id");

-- Foreign keys
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "notification_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "notification_preferences_v2" ADD CONSTRAINT "notification_preferences_v2_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_preferences_v2" ADD CONSTRAINT "notification_preferences_v2_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_preferences_v2" ADD CONSTRAINT "notification_preferences_v2_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "notification_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_module_settings" ADD CONSTRAINT "notification_module_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_module_settings" ADD CONSTRAINT "notification_module_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notification_module_settings" ADD CONSTRAINT "notification_module_settings_module_fkey" FOREIGN KEY ("module") REFERENCES "notification_module_registry"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_delivery_attempts" ADD CONSTRAINT "notification_delivery_attempts_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill tenant_id on existing notifications via the user's first active tenant assignment.
-- Notifications without a resolvable tenant remain NULL (historical rows).
UPDATE "notifications" n
SET "tenant_id" = (
  SELECT tu."tenant_id"
  FROM "tenant_users" tu
  WHERE tu."user_id" = n."user_id"
    AND tu."deleted_at" IS NULL
  ORDER BY tu."created_at" ASC
  LIMIT 1
)
WHERE n."tenant_id" IS NULL;
