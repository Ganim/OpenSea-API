-- CreateTable
CREATE TABLE "pos_terminal_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "pos_terminal_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pos_terminal_profiles_tenant_id_idx" ON "pos_terminal_profiles"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_terminal_profiles_is_active_idx" ON "pos_terminal_profiles"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "pos_terminal_profiles_name_tenant_unique" ON "pos_terminal_profiles"("name", "tenant_id", "deleted_at");

-- AddForeignKey
ALTER TABLE "pos_terminals" ADD CONSTRAINT "pos_terminals_applied_profile_id_fkey" FOREIGN KEY ("applied_profile_id") REFERENCES "pos_terminal_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminal_profiles" ADD CONSTRAINT "pos_terminal_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
