-- AlterTable
ALTER TABLE "folder_access_rules" ADD COLUMN     "team_id" TEXT;

-- AlterTable
ALTER TABLE "permission_groups" ADD COLUMN     "storage_settings" JSONB;

-- CreateIndex
CREATE INDEX "folder_access_rules_team_id_idx" ON "folder_access_rules"("team_id");

-- CreateIndex
CREATE INDEX "folder_access_rules_folder_id_team_id_idx" ON "folder_access_rules"("folder_id", "team_id");

-- CreateIndex
CREATE UNIQUE INDEX "folder_access_rules_folder_id_team_id_key" ON "folder_access_rules"("folder_id", "team_id");

-- AddForeignKey
ALTER TABLE "folder_access_rules" ADD CONSTRAINT "folder_access_rules_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
