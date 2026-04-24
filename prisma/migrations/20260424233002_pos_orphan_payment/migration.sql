-- CreateTable
CREATE TABLE "pos_orphan_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_code" VARCHAR(4) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_by_terminal_id" TEXT NOT NULL,
    "received_by_operator_id" TEXT,
    "matched_order_id" TEXT,
    "matched_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pos_orphan_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pos_orphan_payments_tenant_id_matched_order_id_idx" ON "pos_orphan_payments"("tenant_id", "matched_order_id");

-- CreateIndex
CREATE INDEX "pos_orphan_payments_order_code_idx" ON "pos_orphan_payments"("order_code");

-- CreateIndex
CREATE UNIQUE INDEX "pos_orphan_payments_code_tenant_unique" ON "pos_orphan_payments"("order_code", "tenant_id", "received_at");

-- AddForeignKey
ALTER TABLE "pos_orphan_payments" ADD CONSTRAINT "pos_orphan_payments_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_orphan_payments" ADD CONSTRAINT "pos_orphan_payments_received_by_terminal_id_fkey" FOREIGN KEY ("received_by_terminal_id") REFERENCES "pos_terminals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_orphan_payments" ADD CONSTRAINT "pos_orphan_payments_matched_order_id_fkey" FOREIGN KEY ("matched_order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
