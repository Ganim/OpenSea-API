/**
 * INTERVIEW STAGE SCHEMAS
 */

import { z } from 'zod';
import { cuidSchema, dateSchema } from '../../common.schema';

const interviewStageTypeEnum = z.enum([
  'SCREENING',
  'TECHNICAL',
  'BEHAVIORAL',
  'CULTURE_FIT',
  'FINAL',
]);

export const createInterviewStageSchema = z.object({
  jobPostingId: cuidSchema,
  name: z.string().min(1).max(128),
  type: interviewStageTypeEnum.optional().default('SCREENING'),
  description: z.string().max(2000).optional(),
});

export const reorderInterviewStagesSchema = z.object({
  stageIds: z.array(cuidSchema).min(1),
});

export const interviewStageResponseSchema = z.object({
  id: cuidSchema,
  jobPostingId: z.string(),
  name: z.string(),
  order: z.number(),
  type: z.string(),
  description: z.string().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
