-- AlterTable
ALTER TABLE "variants" ADD COLUMN     "out_of_line" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reference" VARCHAR(128),
ADD COLUMN     "similars" JSONB DEFAULT '[]';
