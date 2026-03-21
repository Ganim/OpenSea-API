-- CreateEnum
CREATE TYPE "PosTerminalMode" AS ENUM ('FAST_CHECKOUT', 'CONSULTIVE', 'SELF_SERVICE', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "PosCashierMode" AS ENUM ('INTEGRATED', 'SEPARATED');

-- CreateEnum
CREATE TYPE "PosSessionStatus" AS ENUM ('OPEN', 'CLOSED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "PosTransactionStatus" AS ENUM ('COMPLETED', 'CANCELLED', 'SUSPENDED', 'PENDING_SYNC');

-- CreateEnum
CREATE TYPE "PosPaymentMethod" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'BOLETO', 'STORE_CREDIT', 'VOUCHER', 'PAYMENT_LINK', 'NFC', 'CHECK', 'OTHER');

-- CreateEnum
CREATE TYPE "PosPaymentLinkStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PosCashMovementType" AS ENUM ('OPENING', 'WITHDRAWAL', 'SUPPLY', 'CLOSING');

-- CreateEnum
CREATE TYPE "PosOfflineOperationType" AS ENUM ('TRANSACTION', 'CASH_MOVEMENT', 'CUSTOMER_CREATE', 'SESSION_CLOSE');

-- CreateEnum
CREATE TYPE "PosOfflineStatus" AS ENUM ('PENDING', 'SYNCING', 'SYNCED', 'FAILED');

-- CreateEnum
CREATE TYPE "PosVisitOutcome" AS ENUM ('SALE', 'QUOTE', 'NO_SALE', 'FOLLOW_UP');

-- CreateTable
CREATE TABLE "pos_terminals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "device_id" VARCHAR(256) NOT NULL,
    "mode" "PosTerminalMode" NOT NULL,
    "cashier_mode" "PosCashierMode" NOT NULL DEFAULT 'INTEGRATED',
    "accepts_pending_orders" BOOLEAN NOT NULL DEFAULT false,
    "warehouse_id" TEXT NOT NULL,
    "default_price_table_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "last_online_at" TIMESTAMP(3),
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_terminals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_sessions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "terminal_id" TEXT NOT NULL,
    "operator_user_id" TEXT NOT NULL,
    "status" "PosSessionStatus" NOT NULL DEFAULT 'OPEN',
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "opening_balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "closing_balance" DECIMAL(10,2),
    "expected_balance" DECIMAL(10,2),
    "difference" DECIMAL(10,2),
    "closing_breakdown" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "order_id" TEXT,
    "transaction_number" INTEGER NOT NULL,
    "status" "PosTransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discount_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(12,2) NOT NULL,
    "change_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "customer_id" TEXT,
    "customer_name" VARCHAR(256),
    "customer_document" VARCHAR(20),
    "override_by_user_id" TEXT,
    "override_reason" TEXT,
    "synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_transaction_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "method" "PosPaymentMethod" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "received_amount" DECIMAL(10,2),
    "change_amount" DECIMAL(10,2),
    "installments" INTEGER NOT NULL DEFAULT 1,
    "auth_code" VARCHAR(64),
    "nsu" VARCHAR(64),
    "pix_tx_id" VARCHAR(128),
    "payment_link_url" VARCHAR(512),
    "payment_link_status" "PosPaymentLinkStatus",
    "tef_transaction_id" VARCHAR(128),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_transaction_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_cash_movements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "type" "PosCashMovementType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "performed_by_user_id" TEXT NOT NULL,
    "authorized_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_cash_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_offline_queue" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "terminal_id" TEXT NOT NULL,
    "operation_type" "PosOfflineOperationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "PosOfflineStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "pos_offline_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_visit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "latitude" DECIMAL(8,6),
    "longitude" DECIMAL(8,6),
    "address" VARCHAR(512),
    "check_in_at" TIMESTAMP(3) NOT NULL,
    "check_out_at" TIMESTAMP(3),
    "duration" INTEGER,
    "outcome" "PosVisitOutcome" NOT NULL,
    "order_id" TEXT,
    "notes" TEXT,
    "signature_file_id" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_visit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pos_terminals_tenant_id_idx" ON "pos_terminals"("tenant_id");
CREATE INDEX "pos_terminals_tenant_id_is_active_idx" ON "pos_terminals"("tenant_id", "is_active");
CREATE UNIQUE INDEX "pos_terminals_tenant_id_device_id_key" ON "pos_terminals"("tenant_id", "device_id");

-- CreateIndex
CREATE INDEX "pos_sessions_tenant_id_idx" ON "pos_sessions"("tenant_id");
CREATE INDEX "pos_sessions_tenant_id_status_idx" ON "pos_sessions"("tenant_id", "status");
CREATE INDEX "pos_sessions_terminal_id_idx" ON "pos_sessions"("terminal_id");
CREATE INDEX "pos_sessions_operator_user_id_idx" ON "pos_sessions"("operator_user_id");

-- CreateIndex
CREATE INDEX "pos_transactions_tenant_id_idx" ON "pos_transactions"("tenant_id");
CREATE INDEX "pos_transactions_tenant_id_created_at_idx" ON "pos_transactions"("tenant_id", "created_at");
CREATE INDEX "pos_transactions_session_id_idx" ON "pos_transactions"("session_id");
CREATE UNIQUE INDEX "pos_transactions_session_id_transaction_number_key" ON "pos_transactions"("session_id", "transaction_number");

-- CreateIndex
CREATE INDEX "pos_transaction_payments_tenant_id_idx" ON "pos_transaction_payments"("tenant_id");
CREATE INDEX "pos_transaction_payments_transaction_id_idx" ON "pos_transaction_payments"("transaction_id");

-- CreateIndex
CREATE INDEX "pos_cash_movements_tenant_id_idx" ON "pos_cash_movements"("tenant_id");
CREATE INDEX "pos_cash_movements_session_id_idx" ON "pos_cash_movements"("session_id");

-- CreateIndex
CREATE INDEX "pos_offline_queue_tenant_id_idx" ON "pos_offline_queue"("tenant_id");
CREATE INDEX "pos_offline_queue_terminal_id_status_idx" ON "pos_offline_queue"("terminal_id", "status");

-- CreateIndex
CREATE INDEX "pos_visit_logs_tenant_id_idx" ON "pos_visit_logs"("tenant_id");
CREATE INDEX "pos_visit_logs_tenant_id_user_id_idx" ON "pos_visit_logs"("tenant_id", "user_id");
CREATE INDEX "pos_visit_logs_tenant_id_customer_id_idx" ON "pos_visit_logs"("tenant_id", "customer_id");
CREATE INDEX "pos_visit_logs_tenant_id_check_in_at_idx" ON "pos_visit_logs"("tenant_id", "check_in_at");

-- AddForeignKey
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_default_price_table_id_fkey" FOREIGN KEY ("default_price_table_id") REFERENCES "price_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "pos_terminals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_operator_user_id_fkey" FOREIGN KEY ("operator_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "pos_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_override_by_user_id_fkey" FOREIGN KEY ("override_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transaction_payments" ADD CONSTRAINT "pos_transaction_payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_transaction_payments" ADD CONSTRAINT "pos_transaction_payments_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "pos_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_cash_movements" ADD CONSTRAINT "pos_cash_movements_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_cash_movements" ADD CONSTRAINT "pos_cash_movements_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "pos_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pos_cash_movements" ADD CONSTRAINT "pos_cash_movements_performed_by_user_id_fkey" FOREIGN KEY ("performed_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pos_cash_movements" ADD CONSTRAINT "pos_cash_movements_authorized_by_user_id_fkey" FOREIGN KEY ("authorized_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_offline_queue" ADD CONSTRAINT "pos_offline_queue_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_offline_queue" ADD CONSTRAINT "pos_offline_queue_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "pos_terminals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_visit_logs" ADD CONSTRAINT "pos_visit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pos_visit_logs" ADD CONSTRAINT "pos_visit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pos_visit_logs" ADD CONSTRAINT "pos_visit_logs_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pos_visit_logs" ADD CONSTRAINT "pos_visit_logs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
