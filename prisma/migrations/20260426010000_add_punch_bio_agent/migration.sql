-- Phase 10 / Plan 10-01 — Punch-Agent Biométrico
-- Manual migration (drift-bypass workaround — same pattern as 04-01, 06-01, 07-01, 09-01)
-- Applied via: npx prisma db execute --file ... && npx prisma migrate resolve --applied ...
-- DO NOT run via `prisma migrate dev` — unrelated drift in production/finance/items would
-- pull in pending migrations unrelated to this phase.

-- Add 4 AuditAction enum values (Phase 10 biometric agent events)
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'AGENT_PAIRED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'BIO_ENROLLED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'BIO_MATCH';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'AGENT_REVOKED';

-- Add AuditEntity enum value for biometric punch agent
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'PUNCH_BIO_AGENT';

-- Create webauthn_credentials table (Plan 10-07 WebAuthn fallback — D-G1)
CREATE TABLE IF NOT EXISTS "webauthn_credentials" (
  "id"            TEXT        NOT NULL,
  "tenant_id"     TEXT        NOT NULL,
  "employee_id"   TEXT        NOT NULL,
  "credential_id" BYTEA       NOT NULL,
  "public_key"    BYTEA       NOT NULL,
  "counter"       BIGINT      NOT NULL DEFAULT 0,
  "transports"    TEXT[]      NOT NULL DEFAULT '{}',
  "device_type"   TEXT        NOT NULL,
  "backed_up"     BOOLEAN     NOT NULL DEFAULT false,
  "last_used_at"  TIMESTAMP(3),
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "webauthn_credentials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "webauthn_credentials_credential_id_key"
  ON "webauthn_credentials"("credential_id");

CREATE INDEX IF NOT EXISTS "webauthn_credentials_tenant_id_employee_id_idx"
  ON "webauthn_credentials"("tenant_id", "employee_id");

ALTER TABLE "webauthn_credentials"
  ADD CONSTRAINT "webauthn_credentials_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id")
  ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "webauthn_credentials"
  ADD CONSTRAINT "webauthn_credentials_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "employees"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Rollback notes (commented — Postgres ALTER TYPE ADD VALUE is non-reversible without rebuild):
-- DROP TABLE IF EXISTS "webauthn_credentials" CASCADE;
-- Dropping individual enum values requires: CREATE TYPE ... AS ENUM (...) + ALTER COLUMN ... USING + DROP TYPE old
-- This is documented as known limitation; rollback path is a follow-up migration if needed.
