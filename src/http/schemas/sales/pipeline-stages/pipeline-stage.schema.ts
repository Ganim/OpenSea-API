/**
 * Pipeline Stage Zod Schemas
 * Validation schemas for CRM Pipeline Stage CRUD endpoints
 */

import { z } from 'zod';

// ─── Create Pipeline Stage ──────────────────────────────────────────────────

export const createPipelineStageSchema = z.object({
  name: z.string().min(1).max(150).describe('Stage name'),
  color: z.string().max(30).optional().describe('Stage color (hex or named)'),
  icon: z.string().max(50).optional().describe('Stage icon identifier'),
  position: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Display position (order)'),
  type: z
    .enum([
      'OPEN',
      'WON',
      'LOST',
      'DRAFT',
      'PENDING_APPROVAL',
      'APPROVED',
      'PROCESSING',
      'INVOICED',
      'SHIPPED',
      'DELIVERED',
      'COMPLETED',
      'CANCELLED',
    ])
    .optional()
    .default('OPEN')
    .describe('Stage type'),
  probability: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe('Win probability percentage (0-100)'),
  autoActions: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Auto-actions configuration (JSON object)'),
  rottenAfterDays: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Days until deal is considered rotten in this stage'),
});

// ─── Update Pipeline Stage ──────────────────────────────────────────────────

export const updatePipelineStageSchema = createPipelineStageSchema
  .partial()
  .describe('Update pipeline stage fields (all optional)');

// ─── Pipeline Stage Response ────────────────────────────────────────────────

export const pipelineStageResponseSchema = z.object({
  id: z.string().uuid().describe('Unique stage ID'),
  pipelineId: z.string().uuid().describe('Pipeline ID'),
  name: z.string().describe('Stage name'),
  color: z.string().nullable().describe('Stage color'),
  icon: z.string().nullable().describe('Stage icon'),
  position: z.number().int().describe('Stage position (order)'),
  type: z.string().describe('Stage type'),
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

// ─── Reorder Stages ─────────────────────────────────────────────────────────

export const reorderStagesSchema = z.object({
  stageIds: z
    .array(z.string().uuid())
    .min(1)
    .describe('Ordered array of stage IDs representing the new order'),
});
