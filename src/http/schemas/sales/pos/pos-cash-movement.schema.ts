import { z } from 'zod';

export const posCashMovementTypeEnum = z.enum([
  'WITHDRAWAL',
  'SUPPLY',
]);

export const createPosCashMovementSchema = z.object({
  sessionId: z.string().uuid(),
  type: posCashMovementTypeEnum,
  amount: z.number().positive(),
  reason: z.string().max(256).optional(),
  authorizedByUserId: z.string().uuid().optional(),
});

export const posCashMovementResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  sessionId: z.string(),
  type: z.string(),
  amount: z.number(),
  reason: z.string().nullable(),
  performedByUserId: z.string(),
  authorizedByUserId: z.string().nullable(),
  createdAt: z.date(),
});
