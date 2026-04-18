-- Phase 4 Plan 1: Punch v2.0 foundation
-- Adds PunchDevice, PunchDeviceEmployee, PunchDeviceDepartment, PunchApproval
-- + new enums (PunchDeviceKind, PunchApprovalReason, PunchApprovalStatus)
-- + TimeEntry.request_id for idempotency (D-11)
-- Reuses existing AgentStatus enum for PunchDevice.status (AD-04) — no new PunchDeviceStatus.
-- All changes are additive; no data loss.

-- CreateEnum
CREATE TYPE "PunchDeviceKind" AS ENUM ('PWA_PERSONAL', 'KIOSK_PUBLIC', 'BIOMETRIC_READER', 'WEBAUTHN_PC');

-- CreateEnum
CREATE TYPE "PunchApprovalReason" AS ENUM ('OUT_OF_GEOFENCE');

-- CreateEnum
CREATE TYPE "PunchApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable: add idempotency column to time_entries (nullable; existing rows remain NULL)
ALTER TABLE "time_entries" ADD COLUMN "request_id" VARCHAR(64);

-- CreateTable: punch_devices
CREATE TABLE "punch_devices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "device_kind" "PunchDeviceKind" NOT NULL,
    "pairing_secret" VARCHAR(64) NOT NULL,
    "device_token_hash" VARCHAR(128),
    "device_label" VARCHAR(128),
    "geofence_zone_id" TEXT,
    "paired_at" TIMESTAMP(3),
    "paired_by_user_id" TEXT,
    "revoked_at" TIMESTAMP(3),
    "revoked_by_user_id" TEXT,
    "revoked_reason" TEXT,
    "status" "AgentStatus" NOT NULL DEFAULT 'OFFLINE',
    "last_seen_at" TIMESTAMP(3),
    "ip_address" VARCHAR(45),
    "hostname" VARCHAR(128),
    "os_info" JSONB,
    "version" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "punch_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable: punch_device_employees (allowlist pivot)
CREATE TABLE "punch_device_employees" (
    "device_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "punch_device_employees_pkey" PRIMARY KEY ("device_id","employee_id")
);

-- CreateTable: punch_device_departments (allowlist pivot)
CREATE TABLE "punch_device_departments" (
    "device_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "punch_device_departments_pkey" PRIMARY KEY ("device_id","department_id")
);

-- CreateTable: punch_approvals (1:1 with time_entries)
CREATE TABLE "punch_approvals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "time_entry_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "reason" "PunchApprovalReason" NOT NULL,
    "details" JSONB,
    "status" "PunchApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "resolver_user_id" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolver_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "punch_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: punch_devices
CREATE UNIQUE INDEX "punch_devices_device_token_hash_key" ON "punch_devices"("device_token_hash");
CREATE INDEX "punch_devices_tenant_id_idx" ON "punch_devices"("tenant_id");
CREATE INDEX "punch_devices_device_token_hash_idx" ON "punch_devices"("device_token_hash");
CREATE INDEX "punch_devices_tenant_id_revoked_at_idx" ON "punch_devices"("tenant_id", "revoked_at");

-- CreateIndex: punch_device_employees
CREATE INDEX "punch_device_employees_employee_id_idx" ON "punch_device_employees"("employee_id");

-- CreateIndex: punch_device_departments
CREATE INDEX "punch_device_departments_department_id_idx" ON "punch_device_departments"("department_id");

-- CreateIndex: punch_approvals
CREATE UNIQUE INDEX "punch_approvals_time_entry_id_key" ON "punch_approvals"("time_entry_id");
CREATE INDEX "punch_approvals_tenant_id_status_idx" ON "punch_approvals"("tenant_id", "status");
CREATE INDEX "punch_approvals_employee_id_idx" ON "punch_approvals"("employee_id");

-- CreateIndex: time_entries idempotency (D-11)
-- Postgres treats NULL as distinct in unique indexes by default (Research Pitfall 3).
-- Existing rows with request_id = NULL do not collide. Duplicates are only blocked
-- when request_id is explicitly provided by the client.
CREATE UNIQUE INDEX "time_entries_tenant_id_employee_id_request_id_key" ON "time_entries"("tenant_id", "employee_id", "request_id");

-- AddForeignKey: punch_devices
ALTER TABLE "punch_devices" ADD CONSTRAINT "punch_devices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "punch_devices" ADD CONSTRAINT "punch_devices_geofence_zone_id_fkey" FOREIGN KEY ("geofence_zone_id") REFERENCES "geofence_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: punch_device_employees
ALTER TABLE "punch_device_employees" ADD CONSTRAINT "punch_device_employees_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "punch_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "punch_device_employees" ADD CONSTRAINT "punch_device_employees_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: punch_device_departments
ALTER TABLE "punch_device_departments" ADD CONSTRAINT "punch_device_departments_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "punch_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "punch_device_departments" ADD CONSTRAINT "punch_device_departments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: punch_approvals
ALTER TABLE "punch_approvals" ADD CONSTRAINT "punch_approvals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "punch_approvals" ADD CONSTRAINT "punch_approvals_time_entry_id_fkey" FOREIGN KEY ("time_entry_id") REFERENCES "time_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "punch_approvals" ADD CONSTRAINT "punch_approvals_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
