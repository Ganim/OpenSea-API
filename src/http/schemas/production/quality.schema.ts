import { z } from 'zod';

// ============================================================================
// Inspection Plans
// ============================================================================

export const createInspectionPlanSchema = z.object({
  operationRoutingId: z.string().cuid(),
  inspectionType: z.string().min(1).max(64),
  description: z.string().max(500).optional(),
  sampleSize: z.number().int().min(0),
  aqlLevel: z.string().max(16).optional(),
  instructions: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateInspectionPlanSchema = z.object({
  inspectionType: z.string().min(1).max(64).optional(),
  description: z.string().max(500).optional().nullable(),
  sampleSize: z.number().int().min(0).optional(),
  aqlLevel: z.string().max(16).optional().nullable(),
  instructions: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const inspectionPlanResponseSchema = z.object({
  id: z.string(),
  operationRoutingId: z.string(),
  inspectionType: z.string(),
  description: z.string().nullable(),
  sampleSize: z.number(),
  aqlLevel: z.string().nullable(),
  instructions: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ============================================================================
// Quality Holds
// ============================================================================

export const createQualityHoldSchema = z.object({
  productionOrderId: z.string().cuid(),
  reason: z.string().min(1).max(500),
});

export const releaseQualityHoldSchema = z.object({
  resolution: z.string().min(1).max(500),
});

export const qualityHoldResponseSchema = z.object({
  id: z.string(),
  productionOrderId: z.string(),
  reason: z.string(),
  status: z.string(),
  holdById: z.string(),
  holdAt: z.coerce.date(),
  releasedById: z.string().nullable(),
  releasedAt: z.coerce.date().nullable(),
  resolution: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
