/*
  Warnings:

  - You are about to drop the column `pairing_window_expires_at` on the `pos_terminals` table. All the data in the column will be lost.
  - You are about to drop the column `pairing_window_opened_at` on the `pos_terminals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "pos_terminals" DROP COLUMN "pairing_window_expires_at",
DROP COLUMN "pairing_window_opened_at",
ADD COLUMN     "pairing_secret" VARCHAR(64);
