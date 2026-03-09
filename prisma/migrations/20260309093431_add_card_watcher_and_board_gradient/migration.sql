-- AlterTable
ALTER TABLE "boards" ADD COLUMN     "gradient_id" VARCHAR(32);

-- CreateTable
CREATE TABLE "card_watchers" (
    "id" TEXT NOT NULL,
    "card_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_watchers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "card_watchers_card_id_idx" ON "card_watchers"("card_id");

-- CreateIndex
CREATE INDEX "card_watchers_user_id_idx" ON "card_watchers"("user_id");

-- CreateIndex
CREATE INDEX "card_watchers_board_id_idx" ON "card_watchers"("board_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_watchers_card_id_user_id_key" ON "card_watchers"("card_id", "user_id");

-- AddForeignKey
ALTER TABLE "card_watchers" ADD CONSTRAINT "card_watchers_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_watchers" ADD CONSTRAINT "card_watchers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_watchers" ADD CONSTRAINT "card_watchers_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
