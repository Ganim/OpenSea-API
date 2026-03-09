-- DropForeignKey
ALTER TABLE "card_attachments" DROP CONSTRAINT "card_attachments_file_id_fkey";

-- AddForeignKey
ALTER TABLE "card_attachments" ADD CONSTRAINT "card_attachments_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "storage_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
