-- AlterTable: Migrate LabelTemplate from Organization to Tenant

-- Drop the existing foreign key constraint
ALTER TABLE "label_templates" DROP CONSTRAINT IF EXISTS "label_templates_organization_id_fkey";

-- Drop the existing unique constraint
ALTER TABLE "label_templates" DROP CONSTRAINT IF EXISTS "label_templates_name_org_unique_active";

-- Drop the existing index on organization_id
DROP INDEX IF EXISTS "label_templates_organization_id_idx";

-- Rename the column
ALTER TABLE "label_templates" RENAME COLUMN "organization_id" TO "tenant_id";

-- Add the new foreign key constraint
ALTER TABLE "label_templates" ADD CONSTRAINT "label_templates_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add the new unique constraint
ALTER TABLE "label_templates" ADD CONSTRAINT "label_templates_name_tenant_unique_active" UNIQUE ("tenant_id", "name", "deleted_at");

-- Add the new index
CREATE INDEX "label_templates_tenant_id_idx" ON "label_templates"("tenant_id");
