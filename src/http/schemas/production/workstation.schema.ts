import { z } from 'zod';

export const createWorkstationSchema = z.object({
  workstationTypeId: z.string().min(1),
  workCenterId: z.string().optional(),
  code: z.string().min(1).max(32),
  name: z.string().min(1).max(128),
  description: z.string().max(500).optional(),
  capacityPerDay: z.number().positive().optional().default(8),
  costPerHour: z.number().nonnegative().optional(),
  setupTimeDefault: z.number().int().nonnegative().optional().default(0),
  isActive: z.boolean().optional(),
});

export const updateWorkstationSchema = createWorkstationSchema.partial();

export const workstationResponseSchema = z.object({
  id: z.string(),
  workstationTypeId: z.string(),
  workCenterId: z.string().nullable(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  capacityPerDay: z.number(),
  costPerHour: z.number().nullable(),
  setupTimeDefault: z.number(),
  isActive: z.boolean(),
  metadata: z.unknown().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
