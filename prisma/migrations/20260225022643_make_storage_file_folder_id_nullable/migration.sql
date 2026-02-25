-- DropForeignKey
ALTER TABLE "storage_files" DROP CONSTRAINT "storage_files_folder_id_fkey";

-- AlterTable
ALTER TABLE "storage_files" ALTER COLUMN "folder_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "storage_files" ADD CONSTRAINT "storage_files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "storage_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
