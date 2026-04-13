import { z } from 'zod';

export const createTimeEntrySchema = z.object({
  jobCardId: z.string().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
  breakMinutes: z.number().int().min(0).optional(),
  entryType: z.enum(['PRODUCTION', 'SETUP', 'REWORK', 'IDLE']).optional(),
  notes: z.string().max(500).optional(),
});

export const endTimeEntrySchema = z
  .object({
    endTime: z.coerce.date().optional(),
  })
  .optional();

export const timeEntryResponseSchema = z.object({
  id: z.string(),
  jobCardId: z.string(),
  operatorId: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().nullable(),
  breakMinutes: z.number(),
  entryType: z.string(),
  durationMinutes: z.number().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
});
