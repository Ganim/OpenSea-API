-- CreateTable
CREATE TABLE "public"."label_templates" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "grapes_js_data" TEXT NOT NULL,
    "compiled_html" TEXT,
    "compiled_css" TEXT,
    "thumbnail_url" VARCHAR(500),
    "organization_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "label_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "label_templates_organization_id_idx" ON "public"."label_templates"("organization_id");

-- CreateIndex
CREATE INDEX "label_templates_is_system_idx" ON "public"."label_templates"("is_system");

-- CreateIndex
CREATE INDEX "label_templates_created_by_id_idx" ON "public"."label_templates"("created_by_id");

-- CreateIndex
CREATE INDEX "label_templates_deleted_at_idx" ON "public"."label_templates"("deleted_at");

-- CreateIndex
CREATE INDEX "label_templates_created_at_idx" ON "public"."label_templates"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "label_templates_name_org_unique_active" ON "public"."label_templates"("organization_id", "name", "deleted_at");

-- AddForeignKey
ALTER TABLE "public"."label_templates" ADD CONSTRAINT "label_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."label_templates" ADD CONSTRAINT "label_templates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
