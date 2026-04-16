import { z } from 'zod';

export const salaryChangeReasonSchema = z.enum([
  'ADMISSION',
  'ADJUSTMENT',
  'PROMOTION',
  'MERIT',
  'ROLE_CHANGE',
  'CORRECTION',
]);

export const registerSalaryChangeBodySchema = z.object({
  newSalary: z.number().positive(),
  reason: salaryChangeReasonSchema,
  notes: z.string().max(2048).optional(),
  effectiveDate: z.coerce.date(),
  pin: z
    .string()
    .length(4, 'O PIN de ação deve ter exatamente 4 dígitos')
    .regex(/^\d+$/, 'O PIN deve conter apenas números'),
});

export const salaryHistoryParamsSchema = z.object({
  id: z.string().uuid(),
});

export const salaryHistoryResponseSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  previousSalary: z.number().nullable(),
  newSalary: z.number(),
  reason: salaryChangeReasonSchema,
  notes: z.string().nullable(),
  effectiveDate: z.date(),
  changedBy: z.string(),
  createdAt: z.date(),
});

export const listSalaryHistoryResponseSchema = z.object({
  history: z.array(salaryHistoryResponseSchema),
});

export const registerSalaryChangeResponseSchema = z.object({
  salaryHistory: salaryHistoryResponseSchema,
  appliedToEmployee: z.boolean(),
  previousSalary: z.number().nullable(),
});
