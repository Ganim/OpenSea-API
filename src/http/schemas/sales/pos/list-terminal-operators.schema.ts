import { z } from 'zod';

export const listTerminalOperatorsParamsSchema = z.object({
  terminalId: z.string().uuid(),
});

export const listTerminalOperatorsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  /**
   * `'true'` (default) returns only currently-active operator links.
   * `'all'` returns both active and revoked rows (audit / history view).
   */
  isActive: z.enum(['true', 'all']).default('true'),
});

export const terminalOperatorListItemSchema = z.object({
  operatorId: z.string(),
  employeeId: z.string(),
  employeeName: z.string(),
  employeeShortId: z.string(),
  assignedAt: z.string(),
  assignedByUserId: z.string(),
  isActive: z.boolean(),
  revokedAt: z.string().nullable(),
});

export const listTerminalOperatorsResponseSchema = z.object({
  data: z.array(terminalOperatorListItemSchema),
  meta: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    pages: z.number().int().nonnegative(),
  }),
});
