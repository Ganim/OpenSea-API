/**
 * SUPPLIER SCHEMAS
 */

import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1).max(255),
  cnpj: z.string().optional(),
  taxId: z.string().max(50).optional(),
  contact: z.string().max(255).optional(),
  email: z.email().optional(),
  phone: z.string().max(20).optional(),
  website: z.string().url().optional(),
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  paymentTerms: z.string().max(255).optional(),
  rating: z.number().min(0).max(5).optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

export const supplierResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  sequentialCode: z.number().optional(),
  cnpj: z.string().optional(),
  taxId: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  paymentTerms: z.string().optional(),
  rating: z.number().optional(),
  isActive: z.boolean(),
  notes: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const updateSupplierSchema = createSupplierSchema.partial();
