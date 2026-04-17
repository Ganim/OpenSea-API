/**
 * APPLICATION SCHEMAS
 */

import { z } from 'zod';
import { cuidSchema, dateSchema } from '../../common.schema';

const applicationStatusEnum = z.enum([
  'APPLIED',
  'SCREENING',
  'INTERVIEW',
  'ASSESSMENT',
  'OFFER',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
]);

export const createApplicationSchema = z.object({
  jobPostingId: cuidSchema,
  candidateId: cuidSchema,
});

export const updateApplicationStatusSchema = z.object({
  status: applicationStatusEnum,
});

export const rejectApplicationSchema = z.object({
  rejectionReason: z.string().max(2000).optional(),
  /**
   * When `true` the candidate is considered out of the pool and their PII is
   * scrubbed via the LGPD anonymization flow. Defaults to `false` so the
   * recruiter can reject from this role yet keep the candidate available.
   */
  final: z.boolean().optional().default(false),
});

export const listApplicationsQuerySchema = z.object({
  jobPostingId: cuidSchema.optional(),
  candidateId: cuidSchema.optional(),
  status: applicationStatusEnum.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const applicationResponseSchema = z.object({
  id: cuidSchema,
  jobPostingId: z.string(),
  candidateId: z.string(),
  status: z.string(),
  currentStageId: z.string().nullable(),
  appliedAt: dateSchema,
  rejectedAt: dateSchema.nullable(),
  rejectionReason: z.string().nullable(),
  hiredAt: dateSchema.nullable(),
  rating: z.number().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
