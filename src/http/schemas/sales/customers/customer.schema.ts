/**
 * CUSTOMER SCHEMAS
 */

import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(128),
  type: z.enum(['INDIVIDUAL', 'BUSINESS']),
  document: z.string().optional(),
  email: z.string().email().max(254).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().max(256).optional(),
  city: z.string().max(128).optional(),
  state: z.string().length(2).optional(),
  zipCode: z.string().max(10).optional(),
  country: z.string().max(64).optional(),
  notes: z.string().optional(),
});

export const customerResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  document: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().nullable().optional(),
});

export const updateCustomerSchema = createCustomerSchema
  .partial()
  .omit({ type: true });

// SalesOrderItem schema
