-- AlterEnum: add POS_OPERATOR_ASSIGN to AuditAction
-- Used when an admin assigns an Employee as authorized operator of a POS
-- terminal (Emporion Plan A — Task 23, sales.pos.admin permission).
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'POS_OPERATOR_ASSIGN';

-- AlterEnum: add POS_TERMINAL_OPERATOR to AuditEntity
-- Audit entity for the pos_terminal_operators join table.
ALTER TYPE "AuditEntity" ADD VALUE IF NOT EXISTS 'POS_TERMINAL_OPERATOR';
