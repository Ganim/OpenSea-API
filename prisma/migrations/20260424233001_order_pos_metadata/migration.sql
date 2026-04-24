-- CreateEnum
CREATE TYPE "OrderOriginSource" AS ENUM ('WEB', 'POS_DESKTOP', 'API', 'MOBILE');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "ack_received_at" TIMESTAMP(3),
ADD COLUMN     "fiscal_access_key" VARCHAR(44),
ADD COLUMN     "fiscal_authorization_protocol" VARCHAR(64),
ADD COLUMN     "fiscal_document_number" INTEGER,
ADD COLUMN     "fiscal_document_type" "PosFiscalDocumentType",
ADD COLUMN     "fiscal_emission_status" VARCHAR(32),
ADD COLUMN     "fiscal_emitted_at" TIMESTAMP(3),
ADD COLUMN     "origin_source" "OrderOriginSource" NOT NULL DEFAULT 'WEB',
ADD COLUMN     "pos_operator_employee_id" TEXT,
ADD COLUMN     "pos_terminal_id" TEXT,
ADD COLUMN     "sale_local_uuid" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "orders_sale_local_uuid_key" ON "orders"("sale_local_uuid");

-- CreateIndex
CREATE INDEX "orders_pos_terminal_id_idx" ON "orders"("pos_terminal_id");

-- CreateIndex
CREATE INDEX "orders_origin_source_idx" ON "orders"("origin_source");

-- CreateIndex
CREATE INDEX "orders_sale_local_uuid_idx" ON "orders"("sale_local_uuid");

-- CreateIndex
CREATE INDEX "orders_fiscal_access_key_idx" ON "orders"("fiscal_access_key");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_pos_terminal_id_fkey" FOREIGN KEY ("pos_terminal_id") REFERENCES "pos_terminals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_pos_operator_employee_id_fkey" FOREIGN KEY ("pos_operator_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
