-- =====================================================
-- Migration: Add Performance Indexes
-- Description: Adds optimized indexes for common queries
-- =====================================================

-- =============
-- Audit Logs
-- =============

-- Índice para consultas por data (ordenação mais comum)
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_desc_idx"
ON "audit_logs" ("created_at" DESC);

-- Índice composto para filtro por módulo/ação
CREATE INDEX IF NOT EXISTS "audit_logs_module_action_created_at_idx"
ON "audit_logs" ("module", "action", "created_at" DESC);

-- Índice para consultas por usuário
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_created_at_idx"
ON "audit_logs" ("user_id", "created_at" DESC);

-- Índice para consultas por entidade
CREATE INDEX IF NOT EXISTS "audit_logs_entity_entity_id_idx"
ON "audit_logs" ("entity", "entity_id");

-- =============
-- Products
-- =============

-- Índice para listagem com soft delete
CREATE INDEX IF NOT EXISTS "products_deleted_at_created_at_idx"
ON "products" ("deleted_at", "created_at" DESC)
WHERE "deleted_at" IS NULL;

-- Índice para busca por template
CREATE INDEX IF NOT EXISTS "products_template_id_deleted_at_idx"
ON "products" ("template_id", "deleted_at")
WHERE "deleted_at" IS NULL;

-- =============
-- Variants
-- =============

-- Índice para listagem por produto
CREATE INDEX IF NOT EXISTS "variants_product_id_deleted_at_idx"
ON "variants" ("product_id", "deleted_at")
WHERE "deleted_at" IS NULL;

-- Índice para busca por SKU
CREATE INDEX IF NOT EXISTS "variants_sku_deleted_at_idx"
ON "variants" ("sku", "deleted_at")
WHERE "deleted_at" IS NULL;

-- =============
-- Items
-- =============

-- Índice para listagem por variante
CREATE INDEX IF NOT EXISTS "items_variant_id_status_idx"
ON "items" ("variant_id", "status");

-- Índice para itens disponíveis
CREATE INDEX IF NOT EXISTS "items_status_created_at_idx"
ON "items" ("status", "created_at" DESC)
WHERE "status" = 'AVAILABLE';

-- =============
-- Sales Orders
-- =============

-- Índice para listagem por status
CREATE INDEX IF NOT EXISTS "sales_orders_status_created_at_idx"
ON "sales_orders" ("status", "created_at" DESC);

-- Índice para consultas por cliente
CREATE INDEX IF NOT EXISTS "sales_orders_customer_id_status_idx"
ON "sales_orders" ("customer_id", "status");

-- Índice para consultas por data
CREATE INDEX IF NOT EXISTS "sales_orders_created_at_desc_idx"
ON "sales_orders" ("created_at" DESC);

-- =============
-- Employees
-- =============

-- Índice para listagem por organização
CREATE INDEX IF NOT EXISTS "employees_organization_id_deleted_at_idx"
ON "employees" ("organization_id", "deleted_at")
WHERE "deleted_at" IS NULL;

-- Índice para listagem por departamento
CREATE INDEX IF NOT EXISTS "employees_department_id_deleted_at_idx"
ON "employees" ("department_id", "deleted_at")
WHERE "deleted_at" IS NULL;

-- Índice para busca por CPF
CREATE UNIQUE INDEX IF NOT EXISTS "employees_cpf_unique_idx"
ON "employees" ("cpf")
WHERE "deleted_at" IS NULL;

-- =============
-- Sessions
-- =============

-- Índice para consultas por usuário
CREATE INDEX IF NOT EXISTS "sessions_user_id_expired_at_idx"
ON "sessions" ("user_id", "expired_at" DESC);

-- =============
-- Refresh Tokens
-- =============

-- Índice para busca por token (hash)
CREATE INDEX IF NOT EXISTS "refresh_tokens_token_hash_idx"
ON "refresh_tokens" USING HASH ("token");

-- Índice para limpeza de tokens expirados
CREATE INDEX IF NOT EXISTS "refresh_tokens_expires_at_idx"
ON "refresh_tokens" ("expires_at")
WHERE "revoked_at" IS NULL;

-- =============
-- Permissions
-- =============

-- Índice para busca por código
CREATE INDEX IF NOT EXISTS "permissions_code_idx"
ON "permissions" ("code");

-- Índice para busca por módulo
CREATE INDEX IF NOT EXISTS "permissions_module_idx"
ON "permissions" ("module");

-- =============
-- User Permission Groups
-- =============

-- Índice para consultas por usuário
CREATE INDEX IF NOT EXISTS "user_permission_groups_user_id_idx"
ON "user_permission_groups" ("user_id");

-- =============
-- Notifications
-- =============

-- Índice para listagem por usuário (não lidas primeiro)
CREATE INDEX IF NOT EXISTS "notifications_user_id_read_at_created_at_idx"
ON "notifications" ("user_id", "read_at" NULLS FIRST, "created_at" DESC);

-- Índice para notificações agendadas
CREATE INDEX IF NOT EXISTS "notifications_scheduled_for_sent_at_idx"
ON "notifications" ("scheduled_for")
WHERE "sent_at" IS NULL;
