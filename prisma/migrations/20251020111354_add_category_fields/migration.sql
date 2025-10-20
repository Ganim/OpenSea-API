-- AlterTable
ALTER TABLE "categories" 
ADD COLUMN "slug" VARCHAR(128),
ADD COLUMN "description" VARCHAR(500),
ADD COLUMN "display_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- Update existing rows with slug from name (lowercase, replace spaces with hyphens)
UPDATE "categories" 
SET "slug" = lower(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g'))
WHERE "slug" IS NULL;

-- Make slug NOT NULL and UNIQUE after populating
ALTER TABLE "categories" 
ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_slug_deleted_at_idx" ON "categories"("slug", "deleted_at");

-- CreateIndex
CREATE INDEX "categories_parent_id_deleted_at_idx" ON "categories"("parent_id", "deleted_at");
