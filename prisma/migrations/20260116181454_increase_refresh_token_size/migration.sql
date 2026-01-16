-- DropIndex
DROP INDEX "audit_logs_created_at_desc_idx";

-- DropIndex
DROP INDEX "audit_logs_module_action_created_at_idx";

-- DropIndex
DROP INDEX "audit_logs_user_id_created_at_idx";

-- DropIndex
DROP INDEX "items_variant_id_status_idx";

-- DropIndex
DROP INDEX "notifications_user_id_read_at_created_at_idx";

-- DropIndex
DROP INDEX "refresh_tokens_token_hash_idx";

-- DropIndex
DROP INDEX "sales_orders_created_at_desc_idx";

-- DropIndex
DROP INDEX "sales_orders_customer_id_status_idx";

-- DropIndex
DROP INDEX "sales_orders_status_created_at_idx";

-- DropIndex
DROP INDEX "sessions_user_id_expired_at_idx";

-- AlterTable
ALTER TABLE "refresh_tokens" ALTER COLUMN "token" SET DATA TYPE VARCHAR(2048);

-- RenameIndex
ALTER INDEX "label_templates_name_org_unique_active" RENAME TO "label_templates_organization_id_name_deleted_at_key";
