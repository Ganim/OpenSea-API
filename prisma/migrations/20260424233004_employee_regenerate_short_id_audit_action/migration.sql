-- AlterEnum: add EMPLOYEE_REGENERATE_SHORT_ID to AuditAction
-- Used by the Emporion POS operator login flow when an admin rotates
-- the public shortId of an Employee (hr.employees.admin permission).
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'EMPLOYEE_REGENERATE_SHORT_ID';
