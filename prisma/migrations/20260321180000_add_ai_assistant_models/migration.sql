-- CreateEnum
CREATE TYPE "AiPersonality" AS ENUM ('PROFESSIONAL', 'FRIENDLY', 'CASUAL', 'FORMAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AiToneOfVoice" AS ENUM ('NEUTRAL', 'WARM', 'DIRECT', 'ENTHUSIASTIC');

-- CreateEnum
CREATE TYPE "AiConversationContext" AS ENUM ('DEDICATED', 'INLINE', 'COMMAND_BAR', 'VOICE');

-- CreateEnum
CREATE TYPE "AiConversationStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AiMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL_CALL', 'TOOL_RESULT');

-- CreateEnum
CREATE TYPE "AiMessageContentType" AS ENUM ('TEXT', 'CHART', 'TABLE', 'KPI_CARD', 'ACTION_CARD', 'IMAGE', 'ERROR', 'LOADING');

-- CreateEnum
CREATE TYPE "AiFavoriteCategory" AS ENUM ('SALES', 'STOCK', 'FINANCE', 'HR', 'CRM', 'GENERAL');

-- CreateEnum
CREATE TYPE "AiActionStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'EXECUTED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AiInsightType" AS ENUM ('TREND', 'ANOMALY', 'OPPORTUNITY', 'RISK', 'PREDICTION', 'RECOMMENDATION', 'ALERT', 'CELEBRATION');

-- CreateEnum
CREATE TYPE "AiInsightPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AiInsightStatus" AS ENUM ('NEW', 'VIEWED', 'ACTED_ON', 'DISMISSED', 'EXPIRED');

-- CreateTable
CREATE TABLE "ai_tenant_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "assistant_name" VARCHAR(64) NOT NULL DEFAULT 'Atlas',
    "assistant_avatar" TEXT,
    "personality" "AiPersonality" NOT NULL DEFAULT 'PROFESSIONAL',
    "custom_personality" TEXT,
    "tone_of_voice" "AiToneOfVoice" NOT NULL DEFAULT 'NEUTRAL',
    "language" VARCHAR(8) NOT NULL DEFAULT 'pt-BR',
    "greeting" TEXT,
    "enable_dedicated_chat" BOOLEAN NOT NULL DEFAULT true,
    "enable_inline_context" BOOLEAN NOT NULL DEFAULT true,
    "enable_command_bar" BOOLEAN NOT NULL DEFAULT true,
    "enable_voice" BOOLEAN NOT NULL DEFAULT false,
    "wake_word" TEXT,
    "tier1_provider" VARCHAR(32) NOT NULL DEFAULT 'GROQ_SMALL',
    "tier2_provider" VARCHAR(32) NOT NULL DEFAULT 'GROQ',
    "tier3_provider" VARCHAR(32) NOT NULL DEFAULT 'CLAUDE',
    "self_hosted_endpoint" TEXT,
    "tier1_api_key" TEXT,
    "tier2_api_key" TEXT,
    "tier3_api_key" TEXT,
    "can_execute_actions" BOOLEAN NOT NULL DEFAULT false,
    "require_confirmation" BOOLEAN NOT NULL DEFAULT true,
    "max_actions_per_minute" INTEGER NOT NULL DEFAULT 5,
    "enable_proactive_insights" BOOLEAN NOT NULL DEFAULT true,
    "insight_frequency" VARCHAR(16) NOT NULL DEFAULT 'DAILY',
    "enable_scheduled_reports" BOOLEAN NOT NULL DEFAULT false,
    "accessible_modules" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_tenant_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" VARCHAR(256),
    "status" "AiConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "context" "AiConversationContext" NOT NULL DEFAULT 'DEDICATED',
    "context_module" VARCHAR(32),
    "context_entity_type" VARCHAR(64),
    "context_entity_id" TEXT,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMP(3),
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "content" TEXT,
    "content_type" "AiMessageContentType" NOT NULL DEFAULT 'TEXT',
    "render_data" JSONB,
    "attachments" JSONB,
    "ai_tier" INTEGER,
    "ai_model" VARCHAR(64),
    "ai_tokens_input" INTEGER,
    "ai_tokens_output" INTEGER,
    "ai_latency_ms" INTEGER,
    "ai_cost" DECIMAL(8,6),
    "tool_calls" JSONB,
    "actions_taken" JSONB,
    "audio_url" TEXT,
    "transcription" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_favorite_queries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "query" VARCHAR(512) NOT NULL,
    "shortcut" VARCHAR(64),
    "category" "AiFavoriteCategory" NOT NULL DEFAULT 'GENERAL',
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_favorite_queries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_action_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "message_id" TEXT,
    "action_type" VARCHAR(128) NOT NULL,
    "target_module" VARCHAR(32) NOT NULL,
    "target_entity_type" VARCHAR(64) NOT NULL,
    "target_entity_id" TEXT,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "status" "AiActionStatus" NOT NULL DEFAULT 'PROPOSED',
    "confirmed_by_user_id" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "executed_at" TIMESTAMP(3),
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_action_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" "AiInsightType" NOT NULL,
    "priority" "AiInsightPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" VARCHAR(256) NOT NULL,
    "content" TEXT NOT NULL,
    "render_data" JSONB,
    "module" VARCHAR(32) NOT NULL,
    "related_entity_type" VARCHAR(64),
    "related_entity_id" TEXT,
    "target_user_ids" TEXT[],
    "status" "AiInsightStatus" NOT NULL DEFAULT 'NEW',
    "action_url" TEXT,
    "suggested_action" TEXT,
    "expires_at" TIMESTAMP(3),
    "viewed_at" TIMESTAMP(3),
    "acted_on_at" TIMESTAMP(3),
    "dismissed_at" TIMESTAMP(3),
    "ai_model" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_tenant_configs_tenant_id_key" ON "ai_tenant_configs"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_conversations_tenant_id_idx" ON "ai_conversations"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_conversations_user_id_idx" ON "ai_conversations"("user_id");

-- CreateIndex
CREATE INDEX "ai_conversations_tenant_id_user_id_status_idx" ON "ai_conversations"("tenant_id", "user_id", "status");

-- CreateIndex
CREATE INDEX "ai_conversations_tenant_id_updated_at_idx" ON "ai_conversations"("tenant_id", "updated_at");

-- CreateIndex
CREATE INDEX "ai_messages_conversation_id_idx" ON "ai_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "ai_messages_conversation_id_created_at_idx" ON "ai_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "ai_favorite_queries_tenant_id_user_id_idx" ON "ai_favorite_queries"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "ai_action_logs_tenant_id_idx" ON "ai_action_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_action_logs_tenant_id_user_id_idx" ON "ai_action_logs"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "ai_action_logs_tenant_id_status_idx" ON "ai_action_logs"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "ai_insights_tenant_id_idx" ON "ai_insights"("tenant_id");

-- CreateIndex
CREATE INDEX "ai_insights_tenant_id_status_idx" ON "ai_insights"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "ai_insights_tenant_id_type_idx" ON "ai_insights"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "ai_insights_tenant_id_priority_status_idx" ON "ai_insights"("tenant_id", "priority", "status");

-- AddForeignKey
ALTER TABLE "ai_tenant_configs" ADD CONSTRAINT "ai_tenant_configs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_favorite_queries" ADD CONSTRAINT "ai_favorite_queries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_favorite_queries" ADD CONSTRAINT "ai_favorite_queries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_action_logs" ADD CONSTRAINT "ai_action_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_action_logs" ADD CONSTRAINT "ai_action_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_action_logs" ADD CONSTRAINT "ai_action_logs_confirmed_by_user_id_fkey" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
