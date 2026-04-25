-- AlterEnum: add POS_CONFLICT_RESOLVE_* actions (Emporion Plan A — Task 31)
-- Used by `POST /v1/admin/pos/conflicts/:id/resolve` to differentiate the
-- three manual resolution paths in the audit trail:
--   POS_CONFLICT_RESOLVE_CANCEL_AND_REFUND → admin canceled the sale and
--     issued a refund (no stock adjustment, Order status = CANCELLED).
--   POS_CONFLICT_RESOLVE_FORCE_ADJUSTMENT → admin acknowledged that the
--     physical stock matches the cart and forced inventory adjustments
--     before re-creating the Order.
--   POS_CONFLICT_RESOLVE_SUBSTITUTE_ITEM → admin selected substitute items
--     for the conflicting cart lines and re-created the Order with them.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'POS_CONFLICT_RESOLVE_CANCEL_AND_REFUND';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'POS_CONFLICT_RESOLVE_FORCE_ADJUSTMENT';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'POS_CONFLICT_RESOLVE_SUBSTITUTE_ITEM';

-- AlterTable: persist the original sale snapshot on PosOrderConflict so the
-- manual-resolution endpoint can re-create the Order on FORCE_ADJUSTMENT and
-- SUBSTITUTE_ITEM without asking the terminal to replay the sale. All three
-- columns are nullable to remain backward-compatible with conflicts created
-- before this migration (legacy rows simply cannot use FORCE_ADJUSTMENT or
-- SUBSTITUTE_ITEM and the resolution endpoint enforces that explicitly).
ALTER TABLE "pos_order_conflicts"
  ADD COLUMN "original_cart" JSONB,
  ADD COLUMN "original_payments" JSONB,
  ADD COLUMN "original_customer_data" JSONB;
