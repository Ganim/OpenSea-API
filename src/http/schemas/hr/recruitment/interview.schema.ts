/**
 * INTERVIEW SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

const interviewStatusEnum = z.enum([
  'SCHEDULED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]);
const interviewRecommendationEnum = z.enum(['ADVANCE', 'HOLD', 'REJECT']);

export const scheduleInterviewSchema = z.object({
  applicationId: z.string().uuid(),
  interviewStageId: z.string().uuid(),
  interviewerId: z.string().uuid(),
  scheduledAt: z.coerce.date(),
  duration: z.number().int().positive().optional().default(60),
  location: z.string().max(256).optional(),
  meetingUrl: z.string().url().max(500).optional(),
});

export const completeInterviewSchema = z.object({
  feedback: z.string().min(1).max(5000),
  rating: z.number().int().min(1).max(5),
  recommendation: interviewRecommendationEnum,
});

export const listInterviewsQuerySchema = z.object({
  applicationId: z.string().uuid().optional(),
  interviewerId: z.string().uuid().optional(),
  status: interviewStatusEnum.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const interviewResponseSchema = z.object({
  id: idSchema,
  applicationId: z.string(),
  interviewStageId: z.string(),
  interviewerId: z.string(),
  scheduledAt: dateSchema,
  duration: z.number(),
  location: z.string().nullable(),
  meetingUrl: z.string().nullable(),
  status: z.string(),
  feedback: z.string().nullable(),
  rating: z.number().nullable(),
  recommendation: z.string().nullable(),
  completedAt: dateSchema.nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
