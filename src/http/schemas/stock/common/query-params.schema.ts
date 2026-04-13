/**
 * QUERY PARAMS
 */

import { z } from 'zod';

export const stockQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().max(255).optional(),
  status: z.string().max(128).optional(),
  sortBy: z.string().max(128).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
