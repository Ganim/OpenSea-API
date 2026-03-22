import { z } from 'zod';

export const listFavoritesQuerySchema = z.object({
  category: z
    .enum(['SALES', 'STOCK', 'FINANCE', 'HR', 'CRM', 'GENERAL'])
    .optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createFavoriteBodySchema = z.object({
  query: z.string().min(1).max(512),
  shortcut: z.string().max(64).optional(),
  category: z
    .enum(['SALES', 'STOCK', 'FINANCE', 'HR', 'CRM', 'GENERAL'])
    .optional(),
});

export const deleteFavoriteParamsSchema = z.object({
  favoriteId: z.string().uuid(),
});

export const favoriteResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  userId: z.string(),
  query: z.string(),
  shortcut: z.string().nullable(),
  category: z.string(),
  usageCount: z.number(),
  lastUsedAt: z.date().nullable(),
  createdAt: z.date(),
});
