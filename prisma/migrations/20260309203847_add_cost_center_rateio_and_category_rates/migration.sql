-- DropForeignKey
ALTER TABLE "finance_entries" DROP CONSTRAINT "finance_entries_cost_center_id_fkey";

-- AlterTable
ALTER TABLE "finance_categories" ADD COLUMN     "interest_rate" DECIMAL(5,4),
ADD COLUMN     "penalty_rate" DECIMAL(5,4);

-- AlterTable
ALTER TABLE "finance_entries" ALTER COLUMN "cost_center_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "finance_entry_cost_centers" (
    "id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "cost_center_id" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_entry_cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "finance_entry_cost_centers_entry_id_idx" ON "finance_entry_cost_centers"("entry_id");

-- CreateIndex
CREATE INDEX "finance_entry_cost_centers_cost_center_id_idx" ON "finance_entry_cost_centers"("cost_center_id");

-- CreateIndex
CREATE UNIQUE INDEX "finance_entry_cost_centers_entry_id_cost_center_id_key" ON "finance_entry_cost_centers"("entry_id", "cost_center_id");

-- AddForeignKey
ALTER TABLE "finance_entries" ADD CONSTRAINT "finance_entries_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entry_cost_centers" ADD CONSTRAINT "finance_entry_cost_centers_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "finance_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance_entry_cost_centers" ADD CONSTRAINT "finance_entry_cost_centers_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "cost_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
