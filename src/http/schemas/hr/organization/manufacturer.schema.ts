/**
 * Manufacturer Zod Schemas
 * Schemas for manufacturer validation in HR module
 */

import { z } from 'zod';

// Manufacturer specific data schema
export const manufacturerSpecificDataSchema = z.object({
  productionCapacity: z.number().positive().nullable().optional(),
  leadTime: z.number().int().positive().nullable().optional(),
  certifications: z.array(z.string()).optional(),
  qualityRating: z.number().min(0).max(5).nullable().optional(),
  defectRate: z.number().min(0).max(100).nullable().optional(),
  minimumOrderQuantity: z.number().positive().nullable().optional(),
  paymentTerms: z.string().max(200).nullable().optional(),
  countryOfOrigin: z.string().max(100).nullable().optional(),
  factoryLocation: z.string().max(500).nullable().optional(),
  sequentialCode: z.number().int().positive().optional(),
  externalId: z.string().max(100).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

// Create manufacturer schema
export const createManufacturerSchema = z.object({
  legalName: z.string().min(1).max(255),
  tradeName: z.string().min(1).max(255).optional(),
  cnpj: z
    .string()
    .regex(/^[0-9]{14}$/)
    .optional(),
  cpf: z
    .string()
    .regex(/^[0-9]{11}$/)
    .optional(),
  stateRegistration: z.string().max(50).optional(),
  municipalRegistration: z.string().max(50).optional(),
  taxRegime: z.string().optional(),
  email: z.string().email().max(255).optional(),
  phoneMain: z.string().max(20).optional(),
  website: z.string().url().max(500).optional(),

  // Manufacturer specific fields
  productionCapacity: z.number().positive().optional(),
  leadTime: z.number().int().positive().optional(),
  certifications: z.array(z.string()).optional(),
  qualityRating: z.number().min(0).max(5).optional(),
  defectRate: z.number().min(0).max(100).optional(),
  minimumOrderQuantity: z.number().positive().optional(),
  paymentTerms: z.string().max(200).optional(),
  countryOfOrigin: z.string().max(100).optional(),
  factoryLocation: z.string().max(500).optional(),
  externalId: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),

  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Update manufacturer schema
export const updateManufacturerSchema = createManufacturerSchema.partial();

// List manufacturers query schema
export const listManufacturersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

// Manufacturer response schema
export const manufacturerResponseSchema = z.object({
  id: z.string().uuid(),
  legalName: z.string(),
  tradeName: z.string().nullable().optional(),
  cnpj: z.string().nullable().optional(),
  cpf: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  type: z.literal('MANUFACTURER'),
  typeSpecificData: z
    .object({
      productionCapacity: z.number().nullable().optional(),
      leadTime: z.number().nullable().optional(),
      certifications: z.array(z.string()).optional(),
      qualityRating: z.number().nullable().optional(),
      defectRate: z.number().nullable().optional(),
      minimumOrderQuantity: z.number().nullable().optional(),
      paymentTerms: z.string().nullable().optional(),
      countryOfOrigin: z.string().nullable().optional(),
      factoryLocation: z.string().nullable().optional(),
      sequentialCode: z.number().optional(),
      externalId: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
});
