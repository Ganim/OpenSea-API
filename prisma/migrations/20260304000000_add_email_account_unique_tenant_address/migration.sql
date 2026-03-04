-- CreateIndex
CREATE UNIQUE INDEX "email_accounts_tenant_id_address_key" ON "email_accounts"("tenant_id", "address");
