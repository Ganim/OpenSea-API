-- Phase 4 verification gap closure (gap_closures_resolved):
-- The TypeScript AuditEntity enum already declares PUNCH_CONFIGURATION
-- and GEOFENCE_ZONE (audit-entity.enum.ts:183,189) and they are used by
-- audit-messages/hr.messages.ts (PUNCH_CONFIGURATION x1, GEOFENCE_ZONE x3)
-- and the punch-device-offline-scheduler worker. The Postgres enum was
-- missing these two values, causing logAudit to fail silently with a
-- Prisma validation error and the audit row never persisting.
--
-- This migration adds the two missing values so audit rows for punch
-- configuration changes and geofence zone management persist correctly.
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'PUNCH_CONFIGURATION';
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'GEOFENCE_ZONE';
