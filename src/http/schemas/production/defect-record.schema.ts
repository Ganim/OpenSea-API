import { z } from 'zod';

// ============================================================================
// Defect Records
// ============================================================================

export const createDefectRecordSchema = z.object({
  inspectionResultId: z.string().cuid().optional(),
  defectTypeId: z.string().cuid(),
  operatorId: z.string().cuid().optional(),
  quantity: z.number().int().min(1).optional(),
  severity: z.enum(['CRITICAL', 'MAJOR', 'MINOR']),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().max(512).optional(),
});

export const defectRecordResponseSchema = z.object({
  id: z.string(),
  inspectionResultId: z.string().nullable(),
  defectTypeId: z.string(),
  operatorId: z.string().nullable(),
  quantity: z.number(),
  severity: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  createdAt: z.coerce.date(),
});
