-- CreateEnum
CREATE TYPE "PosOrderConflictStatus" AS ENUM ('PENDING_RESOLUTION', 'AUTO_SUBSTITUTED', 'AUTO_ADJUSTED', 'CANCELED_REFUNDED', 'FORCED_ADJUSTMENT', 'ITEM_SUBSTITUTED_MANUAL', 'EXPIRED');

-- CreateTable
CREATE TABLE "pos_order_conflicts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "sale_local_uuid" VARCHAR(64) NOT NULL,
    "order_id" TEXT,
    "pos_terminal_id" TEXT NOT NULL,
    "pos_session_id" TEXT,
    "pos_operator_employee_id" TEXT,
    "status" "PosOrderConflictStatus" NOT NULL DEFAULT 'PENDING_RESOLUTION',
    "conflict_details" JSONB NOT NULL,
    "resolution_details" JSONB,
    "resolved_by_user_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_order_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pos_order_conflicts_tenant_id_status_idx" ON "pos_order_conflicts"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "pos_order_conflicts_pos_terminal_id_idx" ON "pos_order_conflicts"("pos_terminal_id");

-- CreateIndex
CREATE INDEX "pos_order_conflicts_created_at_idx" ON "pos_order_conflicts"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "pos_order_conflicts_sale_unique" ON "pos_order_conflicts"("sale_local_uuid", "tenant_id");

-- AddForeignKey
ALTER TABLE "pos_order_conflicts" ADD CONSTRAINT "pos_order_conflicts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_order_conflicts" ADD CONSTRAINT "pos_order_conflicts_pos_terminal_id_fkey" FOREIGN KEY ("pos_terminal_id") REFERENCES "pos_terminals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_order_conflicts" ADD CONSTRAINT "pos_order_conflicts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_order_conflicts" ADD CONSTRAINT "pos_order_conflicts_resolved_by_user_id_fkey" FOREIGN KEY ("resolved_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
