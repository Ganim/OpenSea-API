import { z } from 'zod';

export const jobCardResponseSchema = z.object({
  id: z.string(),
  productionOrderId: z.string(),
  operationRoutingId: z.string(),
  workstationId: z.string().nullable(),
  status: z.string(),
  quantityPlanned: z.number(),
  quantityCompleted: z.number(),
  quantityScrapped: z.number(),
  scheduledStart: z.coerce.date().nullable(),
  scheduledEnd: z.coerce.date().nullable(),
  actualStart: z.coerce.date().nullable(),
  actualEnd: z.coerce.date().nullable(),
  barcode: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const reportProductionSchema = z.object({
  operatorId: z.string().min(1),
  quantityGood: z.number().nonnegative(),
  quantityScrapped: z.number().nonnegative().optional().default(0),
  quantityRework: z.number().nonnegative().optional().default(0),
  notes: z.string().max(500).optional(),
});

export const recordTimeEntrySchema = z.object({
  operatorId: z.string().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
  breakMinutes: z.number().int().nonnegative().optional().default(0),
  entryType: z
    .enum(['PRODUCTION', 'SETUP', 'REWORK', 'IDLE'])
    .optional()
    .default('PRODUCTION'),
  notes: z.string().max(500).optional(),
});
