-- AlterEnum: add POS terminal configuration audit actions (Emporion Plan A — Task 25)
-- Used by the PATCH /v1/pos/terminals/:id/config + PUT/DELETE
-- /v1/pos/terminals/:id/zones/:zoneId endpoints, all guarded by `sales.pos.admin`.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'POS_TERMINAL_SESSION_MODE_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'POS_TERMINAL_ZONE_ASSIGN';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'POS_TERMINAL_ZONE_UNASSIGN';

-- AlterEnum: add POS_TERMINAL_ZONE to AuditEntity
-- Audit entity for the pos_terminal_zones join table (terminal ↔ zone with tier).
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'POS_TERMINAL_ZONE';
