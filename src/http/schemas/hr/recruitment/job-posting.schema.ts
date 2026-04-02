/**
 * JOB POSTING SCHEMAS
 */

import { z } from 'zod';
import { cuidSchema, dateSchema } from '../../common.schema';

const jobPostingStatusEnum = z.enum(['DRAFT', 'OPEN', 'CLOSED', 'FILLED']);
const jobPostingTypeEnum = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'INTERN',
  'TEMPORARY',
]);

export const createJobPostingSchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(5000).optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  type: jobPostingTypeEnum.optional().default('FULL_TIME'),
  location: z.string().max(256).optional(),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  requirements: z.unknown().optional(),
  benefits: z.string().max(5000).optional(),
  maxApplicants: z.number().int().positive().optional(),
});

export const updateJobPostingSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  description: z.string().max(5000).optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  type: jobPostingTypeEnum.optional(),
  location: z.string().max(256).optional(),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  requirements: z.unknown().optional(),
  benefits: z.string().max(5000).optional(),
  maxApplicants: z.number().int().positive().optional(),
});

export const listJobPostingsQuerySchema = z.object({
  status: jobPostingStatusEnum.optional(),
  type: jobPostingTypeEnum.optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const jobPostingResponseSchema = z.object({
  id: cuidSchema,
  title: z.string(),
  description: z.string().nullable(),
  departmentId: z.string().nullable(),
  positionId: z.string().nullable(),
  status: z.string(),
  type: z.string(),
  location: z.string().nullable(),
  salaryMin: z.number().nullable(),
  salaryMax: z.number().nullable(),
  requirements: z.unknown().nullable(),
  benefits: z.string().nullable(),
  maxApplicants: z.number().nullable(),
  publishedAt: dateSchema.nullable(),
  closedAt: dateSchema.nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
