/**
 * CANDIDATE SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

const candidateSourceEnum = z.enum([
  'WEBSITE',
  'LINKEDIN',
  'REFERRAL',
  'AGENCY',
  'OTHER',
]);

export const createCandidateSchema = z.object({
  fullName: z.string().min(1).max(256),
  email: z.string().email().max(254),
  phone: z.string().max(20).optional(),
  cpf: z.string().max(14).optional(),
  resumeUrl: z.string().url().max(500).optional(),
  linkedinUrl: z.string().url().max(500).optional(),
  source: candidateSourceEnum.optional().default('OTHER'),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string()).optional(),
});

export const updateCandidateSchema = z.object({
  fullName: z.string().min(1).max(256).optional(),
  email: z.string().email().max(254).optional(),
  phone: z.string().max(20).optional(),
  cpf: z.string().max(14).optional(),
  resumeUrl: z.string().url().max(500).optional(),
  linkedinUrl: z.string().url().max(500).optional(),
  source: candidateSourceEnum.optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string()).optional(),
});

export const listCandidatesQuerySchema = z.object({
  source: candidateSourceEnum.optional(),
  search: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const candidateResponseSchema = z.object({
  id: idSchema,
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  cpf: z.string().nullable(),
  resumeUrl: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  source: z.string(),
  notes: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
