-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('QUOTE', 'ORDER');

-- CreateEnum
CREATE TYPE "OrderChannel" AS ENUM ('PDV', 'WEB', 'WHATSAPP', 'MARKETPLACE', 'BID', 'MANUAL', 'API');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('PICKUP', 'OWN_FLEET', 'CARRIER', 'PARTIAL');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO', 'BANK_TRANSFER', 'CHECK', 'STORE_CREDIT', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentConditionType" AS ENUM ('CASH', 'INSTALLMENT', 'CUSTOM', 'CREDIT_LIMIT');

-- CreateEnum
CREATE TYPE "PaymentConditionApplicable" AS ENUM ('ALL', 'RETAIL', 'WHOLESALE', 'BID');

-- CreateEnum
CREATE TYPE "InterestType" AS ENUM ('SIMPLE', 'COMPOUND');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PREPARING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReturnType" AS ENUM ('FULL_RETURN', 'PARTIAL_RETURN', 'EXCHANGE');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'RECEIVING', 'RECEIVED', 'CREDIT_ISSUED', 'EXCHANGE_COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReturnReason" AS ENUM ('DEFECTIVE', 'WRONG_ITEM', 'CHANGED_MIND', 'DAMAGED', 'NOT_AS_DESCRIBED', 'OTHER');

-- CreateEnum
CREATE TYPE "ReturnItemCondition" AS ENUM ('NEW', 'USED', 'DAMAGED', 'DEFECTIVE');

-- CreateEnum
CREATE TYPE "RefundMethod" AS ENUM ('SAME_METHOD', 'STORE_CREDIT', 'BANK_TRANSFER', 'PIX');

-- CreateEnum
CREATE TYPE "StoreCreditSource" AS ENUM ('RETURN', 'MANUAL', 'CAMPAIGN', 'LOYALTY');

-- CreateEnum
CREATE TYPE "ApprovalRuleType" AS ENUM ('ORDER_VALUE', 'DISCOUNT_PERCENT', 'CREDIT_EXCEEDED', 'NEW_CUSTOMER', 'MANUAL_PRICE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FIXED_PER_ORDER', 'FIXED_PER_ITEM', 'TIERED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CommissionAppliesTo" AS ENUM ('ALL', 'SPECIFIC_USERS', 'SPECIFIC_CATEGORIES', 'SPECIFIC_PRODUCTS');

-- CreateEnum
CREATE TYPE "OrderHistoryAction" AS ENUM ('CREATED', 'STAGE_CHANGED', 'ITEM_ADDED', 'ITEM_REMOVED', 'ITEM_MODIFIED', 'PAYMENT_ADDED', 'PAYMENT_RECEIVED', 'APPROVAL_REQUESTED', 'APPROVED', 'REJECTED', 'DELIVERY_CREATED', 'DELIVERY_SHIPPED', 'DELIVERY_COMPLETED', 'RETURN_REQUESTED', 'RETURN_APPROVED', 'RETURN_COMPLETED', 'CANCELLED', 'NOTE_ADDED', 'ASSIGNED', 'COUPON_APPLIED');

-- CreateEnum
CREATE TYPE "PriceSourceType" AS ENUM ('CUSTOMER', 'CAMPAIGN', 'COUPON', 'QUANTITY_TIER', 'TABLE', 'DEFAULT', 'MANUAL');

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_number" VARCHAR(64) NOT NULL,
    "type" "OrderType" NOT NULL,
    "customer_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "pipeline_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "channel" "OrderChannel" NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shipping_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "price_table_id" TEXT,
    "payment_condition_id" TEXT,
    "credit_used" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "remaining_amount" DECIMAL(12,2) NOT NULL,
    "delivery_method" "DeliveryMethod",
    "delivery_address" JSONB,
    "tracking_code" TEXT,
    "carrier_name" TEXT,
    "estimated_delivery" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "needs_approval" BOOLEAN NOT NULL DEFAULT false,
    "approved_by_user_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "approval_notes" TEXT,
    "rejected_reason" TEXT,
    "deal_id" TEXT,
    "quote_id" TEXT,
    "return_origin_id" TEXT,
    "coupon_id" TEXT,
    "source_warehouse_id" TEXT,
    "assigned_to_user_id" TEXT,
    "notes" TEXT,
    "internal_notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "custom_fields" JSONB,
    "stage_entered_at" TIMESTAMP(3) NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "expires_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "variant_id" TEXT,
    "combo_id" TEXT,
    "name" VARCHAR(256) NOT NULL,
    "sku" VARCHAR(64),
    "description" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discount_value" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "tax_icms" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_ipi" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_pis" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_cofins" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "ncm" VARCHAR(10),
    "cfop" VARCHAR(8),
    "quantity_delivered" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "quantity_returned" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "price_source" "PriceSourceType" NOT NULL DEFAULT 'DEFAULT',
    "price_source_id" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_conditions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "type" "PaymentConditionType" NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "first_due_days" INTEGER NOT NULL DEFAULT 0,
    "interval_days" INTEGER NOT NULL DEFAULT 30,
    "down_payment_percent" DECIMAL(5,2),
    "interest_rate" DECIMAL(5,2),
    "interest_type" "InterestType" NOT NULL DEFAULT 'SIMPLE',
    "penalty_rate" DECIMAL(5,2),
    "discount_cash" DECIMAL(5,2),
    "applicable_to" "PaymentConditionApplicable" NOT NULL DEFAULT 'ALL',
    "min_order_value" DECIMAL(10,2),
    "max_order_value" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "installment_number" INTEGER,
    "due_date" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "external_id" VARCHAR(128),
    "finance_entry_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_deliveries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "delivery_number" INTEGER NOT NULL,
    "method" "DeliveryMethod",
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PREPARING',
    "carrier_name" TEXT,
    "tracking_code" TEXT,
    "tracking_url" TEXT,
    "shipping_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "weight" DECIMAL(10,3),
    "address" JSONB,
    "estimated_date" TIMESTAMP(3),
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "received_by_name" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_delivery_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "delivery_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "warehouse_id" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_delivery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_returns" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "return_number" VARCHAR(64) NOT NULL,
    "type" "ReturnType" NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" "ReturnReason" NOT NULL,
    "reason_details" TEXT,
    "refund_method" "RefundMethod",
    "refund_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "credit_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "exchange_order_id" TEXT,
    "requested_by_user_id" TEXT NOT NULL,
    "approved_by_user_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "received_at" TIMESTAMP(3),
    "notes" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_return_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "return_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "condition" "ReturnItemCondition" NOT NULL DEFAULT 'NEW',
    "restockable" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_credits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL,
    "source" "StoreCreditSource" NOT NULL,
    "source_id" TEXT,
    "reserved_for_order_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_credit_usages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "credit_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_credit_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_credit_limits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "credit_limit" DECIMAL(12,2) NOT NULL,
    "current_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "last_review_date" TIMESTAMP(3),
    "reviewed_by_user_id" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_credit_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "rule_type" "ApprovalRuleType" NOT NULL,
    "operator" "RuleOperator" NOT NULL,
    "value" VARCHAR(256) NOT NULL,
    "value2" VARCHAR(256),
    "approver_role" TEXT,
    "approver_user_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_commissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "base_value" DECIMAL(12,2) NOT NULL,
    "commission_type" "CommissionType" NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL,
    "commission_value" DECIMAL(10,2) NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "finance_entry_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "type" "CommissionType" NOT NULL,
    "value" DECIMAL(10,2),
    "tiers" JSONB,
    "applies_to" "CommissionAppliesTo" NOT NULL DEFAULT 'ALL',
    "target_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "min_order_value" DECIMAL(10,2),
    "exclude_discounted" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commission_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_history" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "action" "OrderHistoryAction" NOT NULL,
    "description" VARCHAR(512) NOT NULL,
    "metadata" JSONB,
    "performed_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orders_tenant_id_idx" ON "orders"("tenant_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_type_idx" ON "orders"("tenant_id", "type");

-- CreateIndex
CREATE INDEX "orders_tenant_id_customer_id_idx" ON "orders"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_assigned_to_user_id_idx" ON "orders"("tenant_id", "assigned_to_user_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_stage_id_idx" ON "orders"("tenant_id", "stage_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_pipeline_id_idx" ON "orders"("tenant_id", "pipeline_id");

-- CreateIndex
CREATE INDEX "orders_tenant_id_channel_idx" ON "orders"("tenant_id", "channel");

-- CreateIndex
CREATE INDEX "orders_tenant_id_created_at_idx" ON "orders"("tenant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_tenant_id_order_number_key" ON "orders"("tenant_id", "order_number");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_tenant_id_idx" ON "order_items"("tenant_id");

-- CreateIndex
CREATE INDEX "order_items_order_id_variant_id_idx" ON "order_items"("order_id", "variant_id");

-- CreateIndex
CREATE INDEX "payment_conditions_tenant_id_idx" ON "payment_conditions"("tenant_id");

-- CreateIndex
CREATE INDEX "payment_conditions_tenant_id_is_active_idx" ON "payment_conditions"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "order_payments_order_id_idx" ON "order_payments"("order_id");

-- CreateIndex
CREATE INDEX "order_payments_tenant_id_idx" ON "order_payments"("tenant_id");

-- CreateIndex
CREATE INDEX "order_payments_tenant_id_status_idx" ON "order_payments"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "order_payments_tenant_id_due_date_idx" ON "order_payments"("tenant_id", "due_date");

-- CreateIndex
CREATE INDEX "order_payments_finance_entry_id_idx" ON "order_payments"("finance_entry_id");

-- CreateIndex
CREATE INDEX "order_deliveries_order_id_idx" ON "order_deliveries"("order_id");

-- CreateIndex
CREATE INDEX "order_deliveries_tenant_id_idx" ON "order_deliveries"("tenant_id");

-- CreateIndex
CREATE INDEX "order_deliveries_tracking_code_idx" ON "order_deliveries"("tracking_code");

-- CreateIndex
CREATE INDEX "order_delivery_items_delivery_id_idx" ON "order_delivery_items"("delivery_id");

-- CreateIndex
CREATE INDEX "order_delivery_items_tenant_id_idx" ON "order_delivery_items"("tenant_id");

-- CreateIndex
CREATE INDEX "order_returns_tenant_id_idx" ON "order_returns"("tenant_id");

-- CreateIndex
CREATE INDEX "order_returns_order_id_idx" ON "order_returns"("order_id");

-- CreateIndex
CREATE INDEX "order_returns_tenant_id_status_idx" ON "order_returns"("tenant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "order_returns_tenant_id_return_number_key" ON "order_returns"("tenant_id", "return_number");

-- CreateIndex
CREATE INDEX "order_return_items_return_id_idx" ON "order_return_items"("return_id");

-- CreateIndex
CREATE INDEX "order_return_items_tenant_id_idx" ON "order_return_items"("tenant_id");

-- CreateIndex
CREATE INDEX "store_credits_tenant_id_idx" ON "store_credits"("tenant_id");

-- CreateIndex
CREATE INDEX "store_credits_tenant_id_customer_id_idx" ON "store_credits"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "store_credits_tenant_id_customer_id_is_active_idx" ON "store_credits"("tenant_id", "customer_id", "is_active");

-- CreateIndex
CREATE INDEX "store_credit_usages_credit_id_idx" ON "store_credit_usages"("credit_id");

-- CreateIndex
CREATE INDEX "store_credit_usages_order_id_idx" ON "store_credit_usages"("order_id");

-- CreateIndex
CREATE INDEX "store_credit_usages_tenant_id_idx" ON "store_credit_usages"("tenant_id");

-- CreateIndex
CREATE INDEX "customer_credit_limits_tenant_id_idx" ON "customer_credit_limits"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_credit_limits_tenant_id_customer_id_key" ON "customer_credit_limits"("tenant_id", "customer_id");

-- CreateIndex
CREATE INDEX "approval_rules_tenant_id_idx" ON "approval_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "approval_rules_tenant_id_is_active_idx" ON "approval_rules"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "order_commissions_order_id_idx" ON "order_commissions"("order_id");

-- CreateIndex
CREATE INDEX "order_commissions_tenant_id_idx" ON "order_commissions"("tenant_id");

-- CreateIndex
CREATE INDEX "order_commissions_tenant_id_user_id_idx" ON "order_commissions"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "order_commissions_tenant_id_status_idx" ON "order_commissions"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "commission_rules_tenant_id_idx" ON "commission_rules"("tenant_id");

-- CreateIndex
CREATE INDEX "commission_rules_tenant_id_is_active_idx" ON "commission_rules"("tenant_id", "is_active");

-- CreateIndex
CREATE INDEX "order_history_order_id_idx" ON "order_history"("order_id");

-- CreateIndex
CREATE INDEX "order_history_tenant_id_idx" ON "order_history"("tenant_id");

-- CreateIndex
CREATE INDEX "order_history_order_id_created_at_idx" ON "order_history"("order_id", "created_at");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "crm_contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "crm_pipelines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "crm_pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_price_table_id_fkey" FOREIGN KEY ("price_table_id") REFERENCES "price_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_condition_id_fkey" FOREIGN KEY ("payment_condition_id") REFERENCES "payment_conditions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_return_origin_id_fkey" FOREIGN KEY ("return_origin_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_source_warehouse_id_fkey" FOREIGN KEY ("source_warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "combos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_conditions" ADD CONSTRAINT "payment_conditions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_deliveries" ADD CONSTRAINT "order_deliveries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_delivery_items" ADD CONSTRAINT "order_delivery_items_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "order_deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_delivery_items" ADD CONSTRAINT "order_delivery_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_delivery_items" ADD CONSTRAINT "order_delivery_items_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_returns" ADD CONSTRAINT "order_returns_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_return_items" ADD CONSTRAINT "order_return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "order_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_return_items" ADD CONSTRAINT "order_return_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_credits" ADD CONSTRAINT "store_credits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_credits" ADD CONSTRAINT "store_credits_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_credits" ADD CONSTRAINT "store_credits_reserved_for_order_id_fkey" FOREIGN KEY ("reserved_for_order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_credit_usages" ADD CONSTRAINT "store_credit_usages_credit_id_fkey" FOREIGN KEY ("credit_id") REFERENCES "store_credits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_credit_usages" ADD CONSTRAINT "store_credit_usages_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credit_limits" ADD CONSTRAINT "customer_credit_limits_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credit_limits" ADD CONSTRAINT "customer_credit_limits_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credit_limits" ADD CONSTRAINT "customer_credit_limits_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_rules" ADD CONSTRAINT "approval_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_commissions" ADD CONSTRAINT "order_commissions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_commissions" ADD CONSTRAINT "order_commissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_history" ADD CONSTRAINT "order_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_history" ADD CONSTRAINT "order_history_performed_by_user_id_fkey" FOREIGN KEY ("performed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
