import { z } from 'zod';

export const integrationResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  category: z.string(),
  configSchema: z.record(z.unknown()),
  isAvailable: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

export const tenantIntegrationResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  integrationId: z.string().uuid(),
  config: z.record(z.unknown()),
  status: z.string(),
  lastSyncAt: z.coerce.date().optional(),
  errorMessage: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  integration: integrationResponseSchema.optional(),
});

export const connectIntegrationBodySchema = z.object({
  integrationId: z.string().uuid(),
  config: z.record(z.unknown()).default({}),
});

export const updateIntegrationConfigBodySchema = z.object({
  config: z.record(z.unknown()),
});
