-- AlterTable
ALTER TABLE "storage_folders" ADD COLUMN     "created_by" TEXT;

-- CreateIndex
CREATE INDEX "storage_folders_created_by_idx" ON "storage_folders"("created_by");

-- AddForeignKey
ALTER TABLE "storage_folders" ADD CONSTRAINT "storage_folders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
