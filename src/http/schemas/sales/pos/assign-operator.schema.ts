import { z } from 'zod';

export const assignOperatorParamsSchema = z.object({
  terminalId: z.string().uuid(),
});

export const assignOperatorBodySchema = z.object({
  employeeId: z.string().uuid(),
});

export const posTerminalOperatorResponseSchema = z.object({
  id: z.string(),
  terminalId: z.string(),
  employeeId: z.string(),
  tenantId: z.string(),
  isActive: z.boolean(),
  assignedAt: z.string(),
  assignedByUserId: z.string(),
  revokedAt: z.string().nullable(),
  revokedByUserId: z.string().nullable(),
});

export const assignOperatorResponseSchema = z.object({
  operator: posTerminalOperatorResponseSchema,
});
