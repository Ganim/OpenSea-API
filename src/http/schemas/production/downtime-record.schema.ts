import { z } from 'zod';

export const createDowntimeRecordSchema = z.object({
  workstationId: z.string().min(1),
  downtimeReasonId: z.string().min(1),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
});

export const downtimeRecordResponseSchema = z.object({
  id: z.string(),
  workstationId: z.string(),
  downtimeReasonId: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().nullable(),
  durationMinutes: z.number().nullable(),
  reportedById: z.string(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
});
