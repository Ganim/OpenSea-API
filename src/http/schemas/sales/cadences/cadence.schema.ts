import { z } from 'zod';

export const cadenceStepSchema = z.object({
  order: z.number().int().positive(),
  type: z.enum(['EMAIL', 'CALL', 'TASK', 'LINKEDIN', 'WHATSAPP', 'WAIT']),
  delayDays: z.number().int().nonnegative().default(0),
  config: z.record(z.unknown()).optional().default({}),
});

export const createCadenceSequenceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  steps: z.array(cadenceStepSchema).min(1),
});

export const updateCadenceSequenceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  steps: z.array(cadenceStepSchema).min(1).optional(),
});

export const enrollContactSchema = z.object({
  contactId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
});

export const cadenceStepResponseSchema = z.object({
  id: z.string().uuid(),
  sequenceId: z.string().uuid(),
  order: z.number(),
  type: z.string(),
  delayDays: z.number(),
  config: z.record(z.unknown()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

export const cadenceSequenceResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  isActive: z.boolean(),
  createdBy: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
  steps: z.array(cadenceStepResponseSchema),
  enrollmentCount: z.number().optional(),
});

export const cadenceEnrollmentResponseSchema = z.object({
  id: z.string().uuid(),
  sequenceId: z.string().uuid(),
  tenantId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  currentStepOrder: z.number(),
  status: z.string(),
  nextActionAt: z.coerce.date().optional(),
  startedAt: z.coerce.date(),
  completedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date(),
});

export const processPendingResponseSchema = z.object({
  processedCount: z.number(),
  completedCount: z.number(),
  advancedCount: z.number(),
});
