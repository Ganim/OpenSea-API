/**
 * MANUFACTURER SCHEMAS
 */

import { z } from 'zod';

export const createManufacturerSchema = z.object({
  name: z.string().min(1).max(255),
  country: z.string().min(1).max(100),
  email: z.email().optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
  rating: z.number().min(0).max(5).optional(),
  notes: z.string().max(1000).optional(),
});

export const manufacturerResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  country: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postalCode: z.string().nullable(),
  isActive: z.boolean(),
  rating: z.number().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

export const updateManufacturerSchema = createManufacturerSchema.partial();
