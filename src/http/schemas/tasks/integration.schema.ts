import { z } from 'zod';

export const integrationTypeEnum = z.enum([
  'CUSTOMER',
  'PRODUCT',
  'FINANCE_ENTRY',
  'EMAIL',
  'DEPARTMENT',
  'CALENDAR_EVENT',
]);

export const createIntegrationSchema = z.object({
  type: integrationTypeEnum,
  entityId: z.string().uuid(),
  entityLabel: z.string().min(1).max(256),
});

export const integrationResponseSchema = z.object({
  id: z.string().uuid(),
  cardId: z.string().uuid(),
  type: z.string(),
  entityId: z.string().uuid(),
  entityLabel: z.string(),
  createdAt: z.coerce.date(),
  createdBy: z.string().uuid(),
});
