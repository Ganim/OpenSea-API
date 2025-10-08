-- AlterTable
ALTER TABLE "public"."comments" ADD COLUMN     "parent_comment_id" TEXT;

-- AlterTable
ALTER TABLE "public"."notification_preferences" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."variant_promotions" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "comments_parent_comment_id_idx" ON "public"."comments"("parent_comment_id");

-- AddForeignKey
ALTER TABLE "public"."comments" ADD CONSTRAINT "comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
