/**
 * Pipeline Zod Schemas
 * Validation schemas for CRM Pipeline CRUD endpoints
 */

import { z } from 'zod';

// ─── Pipeline Stage Response (nested in pipeline response) ──────────────────

export const pipelineStageNestedResponseSchema = z.object({
  id: z.string().uuid().describe('Unique stage ID'),
  pipelineId: z.string().uuid().describe('Pipeline ID'),
  name: z.string().describe('Stage name'),
  color: z.string().nullable().describe('Stage color'),
  icon: z.string().nullable().describe('Stage icon'),
  position: z.number().int().describe('Stage position (order)'),
  type: z.string().describe('Stage type (OPEN, WON, LOST, etc.)'),
  probability: z.number().nullable().describe('Win probability percentage'),
  autoActions: z
    .record(z.string(), z.unknown())
    .nullable()
    .describe('Auto-actions config'),
  rottenAfterDays: z
    .number()
    .nullable()
    .describe('Days until deal is considered rotten'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

// ─── Create Pipeline ────────────────────────────────────────────────────────

export const createPipelineSchema = z.object({
  name: z.string().min(1).max(150).describe('Pipeline name'),
  description: z.string().max(500).optional().describe('Pipeline description'),
  icon: z.string().max(50).optional().describe('Pipeline icon identifier'),
  color: z
    .string()
    .max(30)
    .optional()
    .describe('Pipeline color (hex or named)'),
  type: z
    .enum([
      'SALES',
      'ONBOARDING',
      'SUPPORT',
      'CUSTOM',
      'ORDER_B2C',
      'ORDER_B2B',
      'ORDER_BID',
      'ORDER_ECOMMERCE',
    ])
    .optional()
    .default('SALES')
    .describe('Pipeline type'),
  isDefault: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether this is the default pipeline'),
  position: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Display position (order)'),
  nextPipelineId: z
    .string()
    .uuid()
    .optional()
    .describe('UUID of the next pipeline in sequence'),
});

// ─── Update Pipeline ────────────────────────────────────────────────────────

export const updatePipelineSchema = z.object({
  name: z.string().min(1).max(150).optional().describe('Pipeline name'),
  description: z.string().max(500).optional().describe('Pipeline description'),
  icon: z.string().max(50).optional().describe('Pipeline icon identifier'),
  color: z
    .string()
    .max(30)
    .optional()
    .describe('Pipeline color (hex or named)'),
  isDefault: z
    .boolean()
    .optional()
    .describe('Whether this is the default pipeline'),
  position: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Display position (order)'),
  isActive: z.boolean().optional().describe('Whether the pipeline is active'),
  nextPipelineId: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .describe('UUID of the next pipeline in sequence (null to clear)'),
});

// ─── Pipeline Response ──────────────────────────────────────────────────────

export const pipelineResponseSchema = z.object({
  id: z.string().uuid().describe('Unique pipeline ID'),
  tenantId: z.string().uuid().describe('Tenant ID'),
  name: z.string().describe('Pipeline name'),
  description: z.string().nullable().describe('Pipeline description'),
  icon: z.string().nullable().describe('Pipeline icon'),
  color: z.string().nullable().describe('Pipeline color'),
  type: z.string().describe('Pipeline type'),
  isDefault: z.boolean().describe('Is default pipeline'),
  position: z.number().int().describe('Display position'),
  nextPipelineId: z.string().nullable().describe('Next pipeline ID'),
  isActive: z.boolean().describe('Is active'),
  stages: z
    .array(pipelineStageNestedResponseSchema)
    .optional()
    .describe('Pipeline stages'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().nullable().describe('Last update date'),
  deletedAt: z.coerce.date().nullable().describe('Deletion date'),
});

// ─── List Pipelines Query ───────────────────────────────────────────────────

export const listPipelinesQuerySchema = z.object({
  onlyActive: z
    .union([z.string(), z.boolean()])
    .transform((val) => val === true || val === 'true' || val === '1')
    .optional()
    .describe('Filter only active pipelines'),
});
