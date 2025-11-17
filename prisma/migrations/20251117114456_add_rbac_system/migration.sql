-- CreateTable
CREATE TABLE "public"."permissions" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(128) NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "module" VARCHAR(64) NOT NULL,
    "resource" VARCHAR(64) NOT NULL,
    "action" VARCHAR(64) NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permission_groups" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "color" VARCHAR(7),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "permission_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permission_group_permissions" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    "effect" VARCHAR(10) NOT NULL DEFAULT 'allow',
    "conditions" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_group_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_permission_groups" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "granted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_permission_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."permission_audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "permission_code" VARCHAR(128) NOT NULL,
    "allowed" BOOLEAN NOT NULL,
    "reason" VARCHAR(512),
    "resource" VARCHAR(64),
    "resource_id" TEXT,
    "action" VARCHAR(64),
    "ip" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "endpoint" VARCHAR(256),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "public"."permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_module_resource_action_idx" ON "public"."permissions"("module", "resource", "action");

-- CreateIndex
CREATE INDEX "permissions_code_idx" ON "public"."permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "public"."permissions"("module");

-- CreateIndex
CREATE UNIQUE INDEX "permission_groups_name_key" ON "public"."permission_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permission_groups_slug_key" ON "public"."permission_groups"("slug");

-- CreateIndex
CREATE INDEX "permission_groups_slug_idx" ON "public"."permission_groups"("slug");

-- CreateIndex
CREATE INDEX "permission_groups_is_active_idx" ON "public"."permission_groups"("is_active");

-- CreateIndex
CREATE INDEX "permission_groups_parent_id_idx" ON "public"."permission_groups"("parent_id");

-- CreateIndex
CREATE INDEX "permission_group_permissions_group_id_idx" ON "public"."permission_group_permissions"("group_id");

-- CreateIndex
CREATE INDEX "permission_group_permissions_permission_id_idx" ON "public"."permission_group_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "permission_group_permissions_group_id_permission_id_key" ON "public"."permission_group_permissions"("group_id", "permission_id");

-- CreateIndex
CREATE INDEX "user_permission_groups_user_id_idx" ON "public"."user_permission_groups"("user_id");

-- CreateIndex
CREATE INDEX "user_permission_groups_group_id_idx" ON "public"."user_permission_groups"("group_id");

-- CreateIndex
CREATE INDEX "user_permission_groups_expires_at_idx" ON "public"."user_permission_groups"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "user_permission_groups_user_id_group_id_key" ON "public"."user_permission_groups"("user_id", "group_id");

-- CreateIndex
CREATE INDEX "permission_audit_logs_user_id_idx" ON "public"."permission_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "permission_audit_logs_permission_code_idx" ON "public"."permission_audit_logs"("permission_code");

-- CreateIndex
CREATE INDEX "permission_audit_logs_allowed_idx" ON "public"."permission_audit_logs"("allowed");

-- CreateIndex
CREATE INDEX "permission_audit_logs_created_at_idx" ON "public"."permission_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "permission_audit_logs_user_id_created_at_idx" ON "public"."permission_audit_logs"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "public"."permission_groups" ADD CONSTRAINT "permission_groups_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."permission_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."permission_group_permissions" ADD CONSTRAINT "permission_group_permissions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."permission_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."permission_group_permissions" ADD CONSTRAINT "permission_group_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_permission_groups" ADD CONSTRAINT "user_permission_groups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_permission_groups" ADD CONSTRAINT "user_permission_groups_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."permission_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_permission_groups" ADD CONSTRAINT "user_permission_groups_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."permission_audit_logs" ADD CONSTRAINT "permission_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
