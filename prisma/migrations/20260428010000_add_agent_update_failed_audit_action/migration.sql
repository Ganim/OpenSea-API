-- Phase 10 / Plan 10-06 — Punch-Agent auto-update failure audit action
-- Manual migration (drift-bypass workaround — same pattern as 04-01, 06-01, 07-01, 09-01, 10-01)
-- Applied via: npx prisma db execute --file ... && npx prisma migrate resolve --applied ...
-- DO NOT run via `prisma migrate dev` — unrelated drift would pull in pending migrations.

-- Add AGENT_UPDATE_FAILED AuditAction enum value (Plan 10-06 notify-update-failed endpoint)
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'AGENT_UPDATE_FAILED';

-- Rollback notes (commented — Postgres ALTER TYPE ADD VALUE is non-reversible without rebuild):
-- Dropping individual enum values requires: CREATE TYPE ... AS ENUM (...) + ALTER COLUMN ... USING + DROP TYPE old
-- This is documented as known limitation; rollback path is a follow-up migration if needed.
