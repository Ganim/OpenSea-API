-- AlterEnum: add POS_OPERATOR_REVOKE to AuditAction
-- Used when an admin revokes an Employee link as operator of a POS terminal
-- (Emporion Plan A — Task 24, sales.pos.admin permission). The POS_TERMINAL_OPERATOR
-- AuditEntity was already added by migration 20260424233005_pos_operator_assign_audit.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'POS_OPERATOR_REVOKE';
