-- AlterTable
ALTER TABLE "users" ADD COLUMN     "force_password_reset" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "force_password_reset_reason" VARCHAR(255),
ADD COLUMN     "force_password_reset_requested_at" TIMESTAMP(3),
ADD COLUMN     "force_password_reset_requested_by" TEXT;

-- CreateIndex
CREATE INDEX "users_force_password_reset_idx" ON "users"("force_password_reset");
