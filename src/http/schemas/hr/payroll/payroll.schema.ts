/**
 * PAYROLL SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

/**
 * Status da folha de pagamento
 */
export const payrollStatusSchema = z.enum([
  'DRAFT',
  'PROCESSING',
  'CALCULATED',
  'APPROVED',
  'PAID',
  'CANCELLED',
]);

/**
 * Tipo de item da folha
 */
export const payrollItemTypeSchema = z.enum([
  'BASE_SALARY',
  'OVERTIME',
  'NIGHT_SHIFT',
  'HAZARD_PAY',
  'UNHEALTHY_PAY',
  'BONUS',
  'COMMISSION',
  'VACATION_PAY',
  'THIRTEENTH_SALARY',
  'PROFIT_SHARING',
  'TRANSPORTATION_ALLOWANCE',
  'MEAL_ALLOWANCE',
  'HEALTH_PLAN',
  'DENTAL_PLAN',
  'INSS',
  'IRRF',
  'FGTS',
  'UNION_CONTRIBUTION',
  'ADVANCE_DEDUCTION',
  'ABSENCE_DEDUCTION',
  'OTHER_EARNING',
  'OTHER_DEDUCTION',
]);

/**
 * Schema para criação de folha de pagamento
 */
export const createPayrollSchema = z.object({
  referenceMonth: z.coerce.number().int().min(1).max(12),
  referenceYear: z.coerce.number().int().min(2000).max(2100),
});

/**
 * Schema para cálculo de folha de pagamento
 */
export const calculatePayrollSchema = z.object({});

/**
 * Schema para aprovação de folha de pagamento
 */
export const approvePayrollSchema = z.object({});

/**
 * Schema para pagamento de folha de pagamento
 */
export const payPayrollSchema = z.object({});

/**
 * Schema para filtros de listagem de folhas de pagamento
 */
export const listPayrollsQuerySchema = z.object({
  referenceMonth: z.coerce.number().int().min(1).max(12).optional(),
  referenceYear: z.coerce.number().int().min(2000).max(2100).optional(),
  status: payrollStatusSchema.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de folha de pagamento
 */
export const payrollResponseSchema = z.object({
  id: idSchema,
  referenceMonth: z.number(),
  referenceYear: z.number(),
  status: z.string(),
  totalGross: z.number(),
  totalDeductions: z.number(),
  totalNet: z.number(),
  processedBy: idSchema.optional().nullable(),
  processedAt: dateSchema.optional().nullable(),
  approvedBy: idSchema.optional().nullable(),
  approvedAt: dateSchema.optional().nullable(),
  paidBy: idSchema.optional().nullable(),
  paidAt: dateSchema.optional().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

/**
 * Schema para resposta de item da folha de pagamento
 */
export const payrollItemResponseSchema = z.object({
  id: idSchema,
  payrollId: idSchema,
  employeeId: idSchema,
  type: z.string(),
  description: z.string(),
  amount: z.number(),
  isDeduction: z.boolean(),
  referenceId: idSchema.optional().nullable(),
  referenceType: z.string().optional().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// ===============================================
