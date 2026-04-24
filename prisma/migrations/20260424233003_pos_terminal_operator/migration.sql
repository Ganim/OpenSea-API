-- CreateTable
CREATE TABLE "pos_terminal_operators" (
    "id" TEXT NOT NULL,
    "terminal_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by_user_id" TEXT NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "revoked_by_user_id" TEXT,

    CONSTRAINT "pos_terminal_operators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pos_terminal_operators_tenant_id_idx" ON "pos_terminal_operators"("tenant_id");

-- CreateIndex
CREATE INDEX "pos_terminal_operators_employee_id_idx" ON "pos_terminal_operators"("employee_id");

-- CreateIndex
CREATE INDEX "pos_terminal_operators_terminal_id_is_active_idx" ON "pos_terminal_operators"("terminal_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "pos_terminal_operators_unique" ON "pos_terminal_operators"("terminal_id", "employee_id");

-- AddForeignKey
ALTER TABLE "pos_terminal_operators" ADD CONSTRAINT "pos_terminal_operators_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminal_operators" ADD CONSTRAINT "pos_terminal_operators_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "pos_terminals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminal_operators" ADD CONSTRAINT "pos_terminal_operators_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminal_operators" ADD CONSTRAINT "pos_terminal_operators_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_terminal_operators" ADD CONSTRAINT "pos_terminal_operators_revoked_by_user_id_fkey" FOREIGN KEY ("revoked_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
