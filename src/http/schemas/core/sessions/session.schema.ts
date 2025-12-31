/**
 * Core Sessions Module Zod Schemas
 * Schemas reutilizáveis para sessões de usuário
 */

import z from 'zod';

// ============= SESSION SCHEMAS =============

export const sessionResponseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  token: z.string(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  isActive: z.boolean(),
  expiresAt: z.coerce.date(),
  lastActivityAt: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export const sessionListResponseSchema = z.object({
  sessions: z.array(sessionResponseSchema),
});

export const sessionWithUserSchema = sessionResponseSchema.extend({
  user: z.object({
    id: z.uuid(),
    email: z.email(),
    username: z.string(),
  }),
});

// ============= QUERY PARAMS =============

export const sessionQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  userId: z.uuid().optional(),
  isActive: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const sessionDateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});
