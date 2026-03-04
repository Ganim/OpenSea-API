-- CreateTable
CREATE TABLE "team_email_accounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "owner_can_read" BOOLEAN NOT NULL DEFAULT true,
    "owner_can_send" BOOLEAN NOT NULL DEFAULT true,
    "owner_can_manage" BOOLEAN NOT NULL DEFAULT true,
    "admin_can_read" BOOLEAN NOT NULL DEFAULT true,
    "admin_can_send" BOOLEAN NOT NULL DEFAULT true,
    "admin_can_manage" BOOLEAN NOT NULL DEFAULT false,
    "member_can_read" BOOLEAN NOT NULL DEFAULT true,
    "member_can_send" BOOLEAN NOT NULL DEFAULT false,
    "member_can_manage" BOOLEAN NOT NULL DEFAULT false,
    "linked_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_email_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_email_accounts_tenant_id_idx" ON "team_email_accounts"("tenant_id");

-- CreateIndex
CREATE INDEX "team_email_accounts_team_id_idx" ON "team_email_accounts"("team_id");

-- CreateIndex
CREATE INDEX "team_email_accounts_account_id_idx" ON "team_email_accounts"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_email_accounts_team_id_account_id_key" ON "team_email_accounts"("team_id", "account_id");

-- AddForeignKey
ALTER TABLE "team_email_accounts" ADD CONSTRAINT "team_email_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_email_accounts" ADD CONSTRAINT "team_email_accounts_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_email_accounts" ADD CONSTRAINT "team_email_accounts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "email_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_email_accounts" ADD CONSTRAINT "team_email_accounts_linked_by_fkey" FOREIGN KEY ("linked_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
