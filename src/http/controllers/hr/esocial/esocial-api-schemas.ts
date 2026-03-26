import z from 'zod';

// Query schemas
export const listEventsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
  status: z
    .enum([
      'DRAFT',
      'REVIEWED',
      'APPROVED',
      'TRANSMITTING',
      'ACCEPTED',
      'REJECTED',
      'ERROR',
    ])
    .optional(),
  eventType: z.string().optional(),
  search: z.string().optional(),
});

export const listBatchesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  perPage: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
});

// Body schemas
export const updateEventStatusBodySchema = z.object({
  action: z.enum(['review', 'approve', 'reject', 'rectify']),
  rejectionReason: z.string().optional(),
});

export const bulkApproveBodySchema = z.object({
  eventIds: z.array(z.string().uuid()).min(1).max(100),
});

export const updateConfigBodySchema = z.object({
  environment: z.enum(['PRODUCAO', 'HOMOLOGACAO']).optional(),
  autoGenerate: z.boolean().optional(),
  requireApproval: z.boolean().optional(),
  employerType: z.string().max(8).optional(),
  employerDocument: z.string().max(18).optional(),
});

// Param schemas
export const eventIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const batchIdParamSchema = z.object({
  id: z.string().uuid(),
});
