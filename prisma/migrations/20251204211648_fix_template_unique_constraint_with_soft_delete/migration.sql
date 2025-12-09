/*
  Warnings:

  - A unique constraint covering the columns `[name,deleted_at]` on the table `templates` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."templates_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "templates_name_deleted_at_key" ON "public"."templates"("name", "deleted_at");
