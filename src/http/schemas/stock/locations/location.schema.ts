/**
 * LOCATION SCHEMAS
 */

import { z } from 'zod';

export const createLocationSchema = z.object({
  code: z.string().max(5).optional(),
  titulo: z.string().min(1).max(255),
  label: z.string().max(128).optional(),
  type: z.enum(['WAREHOUSE', 'ZONE', 'AISLE', 'SHELF', 'BIN', 'OTHER']),
  parentId: z.uuid().optional(),
  capacity: z.number().int().nonnegative().optional(),
  currentOccupancy: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const locationResponseSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  titulo: z.string(),
  label: z.string().optional(),
  type: z.string(),
  parentId: z.uuid().optional(),
  totalChilds: z.number(),
  capacity: z.number().optional(),
  currentOccupancy: z.number().optional(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional(),
  subLocationCount: z.number().optional(),
  directItemCount: z.number().optional(),
  totalItemCount: z.number().optional(),
});

export const updateLocationSchema = createLocationSchema.partial();
