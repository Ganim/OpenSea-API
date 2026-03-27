/**
 * FLEX BENEFIT ALLOCATION SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

/**
 * Schema para alocação de benefícios flexíveis
 */
export const allocateFlexBenefitsSchema = z.object({
  employeeId: idSchema,
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  totalBudget: z.number().positive(),
  allocations: z.record(z.number().nonnegative()),
  confirm: z.boolean().optional().default(false),
});

/**
 * Schema para filtros de histórico de alocações
 */
export const listAllocationHistoryQuerySchema = z.object({
  employeeId: idSchema.optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'LOCKED']).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para query da minha alocação
 */
export const getMyAllocationQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

/**
 * Schema para resposta de alocação flexível
 */
export const flexBenefitAllocationResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  month: z.number(),
  year: z.number(),
  totalBudget: z.number(),
  allocations: z.record(z.number()),
  allocatedTotal: z.number(),
  remainingBudget: z.number(),
  status: z.string(),
  confirmedAt: dateSchema.nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

/**
 * Schema para cálculo de deduções de benefícios
 */
export const calculateBenefitDeductionsSchema = z.object({
  employeeId: idSchema,
});

/**
 * Schema para resposta de item de dedução de benefício
 */
export const benefitDeductionItemSchema = z.object({
  benefitPlanId: idSchema,
  benefitPlanName: z.string(),
  benefitType: z.string(),
  employeeContribution: z.number(),
  employerContribution: z.number(),
  deductionAmount: z.number(),
  description: z.string(),
});

/**
 * Schema para resposta de cálculo de deduções
 */
export const benefitDeductionsResponseSchema = z.object({
  employeeId: idSchema,
  baseSalary: z.number(),
  deductions: z.array(benefitDeductionItemSchema),
  totalEmployeeDeductions: z.number(),
  totalEmployerContributions: z.number(),
});
