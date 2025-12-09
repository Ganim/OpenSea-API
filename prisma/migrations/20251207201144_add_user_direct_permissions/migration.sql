-- CreateTable
CREATE TABLE "user_direct_permissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "effect" VARCHAR(10) NOT NULL DEFAULT 'allow',
    "conditions" JSONB DEFAULT '{}',
    "expires_at" TIMESTAMP(3),
    "granted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_direct_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_direct_permissions_user_id_idx" ON "user_direct_permissions"("user_id");

-- CreateIndex
CREATE INDEX "user_direct_permissions_permission_id_idx" ON "user_direct_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "user_direct_permissions_expires_at_idx" ON "user_direct_permissions"("expires_at");

-- CreateIndex
CREATE INDEX "user_direct_permissions_effect_idx" ON "user_direct_permissions"("effect");

-- CreateIndex
CREATE UNIQUE INDEX "user_direct_permissions_user_id_permission_id_key" ON "user_direct_permissions"("user_id", "permission_id");

-- AddForeignKey
ALTER TABLE "user_direct_permissions" ADD CONSTRAINT "user_direct_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_direct_permissions" ADD CONSTRAINT "user_direct_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_direct_permissions" ADD CONSTRAINT "user_direct_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
