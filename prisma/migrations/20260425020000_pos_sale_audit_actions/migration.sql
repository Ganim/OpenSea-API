-- AlterEnum: add POS_SALE_CREATE / POS_SALE_CONFLICT to AuditAction (Emporion Plan A — Task 28)
-- Used by `POST /v1/pos/sales` (idempotent sale creation from terminals).
-- POS_SALE_CREATE  → emitted on the success path when an Order is persisted.
-- POS_SALE_CONFLICT → emitted when a PosOrderConflict is recorded due to
--                      stock or fractional rule violations detected at sync time.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'POS_SALE_CREATE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'POS_SALE_CONFLICT';

-- AlterEnum: add POS_ORDER_CONFLICT to AuditEntity
-- Audit entity for the pos_order_conflicts table (sale conflicts surfaced
-- during the synchronization of offline-collected sales from POS terminals).
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'POS_ORDER_CONFLICT';
