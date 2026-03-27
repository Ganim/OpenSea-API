/**
 * Blueprint Zod Schemas
 * Validation schemas for Process Blueprint CRUD endpoints
 */

import { z } from 'zod';

// ─── Stage Validation Schema ───────────────────────────────────────────────

export const stageValidationSchema = z.object({
  field: z.string().min(1).describe('Field name to validate'),
  condition: z
    .enum([
      'greater_than',
      'less_than',
      'equals',
      'not_equals',
      'not_empty',
      'min_length',
    ])
    .describe('Validation condition'),
  value: z.string().describe('Expected value for the condition'),
});

// ─── Stage Rule Input Schema ───────────────────────────────────────────────

export const stageRuleInputSchema = z.object({
  stageId: z.string().uuid().describe('Pipeline stage ID'),
  requiredFields: z
    .array(z.string())
    .optional()
    .default([])
    .describe('List of required deal fields'),
  validations: z
    .array(stageValidationSchema)
    .optional()
    .default([])
    .describe('List of field validations'),
  blocksAdvance: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether failing this rule blocks stage advancement'),
});

// ─── Create Blueprint ──────────────────────────────────────────────────────

export const createBlueprintSchema = z.object({
  name: z.string().min(1).max(255).describe('Blueprint name'),
  pipelineId: z
    .string()
    .uuid()
    .describe('Pipeline ID this blueprint applies to'),
  isActive: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether the blueprint is active'),
  stageRules: z
    .array(stageRuleInputSchema)
    .optional()
    .default([])
    .describe('Stage validation rules'),
});

// ─── Update Blueprint ──────────────────────────────────────────────────────

export const updateBlueprintSchema = z.object({
  name: z.string().min(1).max(255).optional().describe('Blueprint name'),
  isActive: z.boolean().optional().describe('Whether the blueprint is active'),
  stageRules: z
    .array(stageRuleInputSchema)
    .optional()
    .describe('Stage validation rules (replaces all existing rules)'),
});

// ─── Validate Stage Transition ─────────────────────────────────────────────

export const validateStageTransitionSchema = z.object({
  dealId: z.string().uuid().describe('Deal ID to validate'),
  targetStageId: z
    .string()
    .uuid()
    .describe('Target stage ID for the transition'),
});

// ─── Blueprint Stage Rule Response ─────────────────────────────────────────

const stageValidationResponseSchema = z.object({
  field: z.string().describe('Field name'),
  condition: z.string().describe('Validation condition'),
  value: z.string().describe('Expected value'),
});

export const blueprintStageRuleResponseSchema = z.object({
  id: z.string().uuid().describe('Stage rule ID'),
  blueprintId: z.string().uuid().describe('Blueprint ID'),
  stageId: z.string().uuid().describe('Pipeline stage ID'),
  requiredFields: z.array(z.string()).describe('Required deal fields'),
  validations: z
    .array(stageValidationResponseSchema)
    .describe('Field validations'),
  blocksAdvance: z.boolean().describe('Whether failing blocks advancement'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

// ─── Blueprint Response ────────────────────────────────────────────────────

export const blueprintResponseSchema = z.object({
  id: z.string().uuid().describe('Unique blueprint ID'),
  tenantId: z.string().uuid().describe('Tenant ID'),
  name: z.string().describe('Blueprint name'),
  pipelineId: z.string().uuid().describe('Pipeline ID'),
  isActive: z.boolean().describe('Is active'),
  stageRules: z
    .array(blueprintStageRuleResponseSchema)
    .describe('Stage validation rules'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().nullable().describe('Last update date'),
  deletedAt: z.coerce.date().nullable().describe('Deletion date'),
});

// ─── Validate Stage Transition Response ────────────────────────────────────

export const validateStageTransitionResponseSchema = z.object({
  valid: z.boolean().describe('Whether the transition is valid'),
  errors: z.array(z.string()).describe('Validation error messages'),
});

// ─── List Blueprints Query ─────────────────────────────────────────────────

export const listBlueprintsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .optional()
    .default(1)
    .describe('Page number'),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .describe('Items per page'),
  pipelineId: z.string().uuid().optional().describe('Filter by pipeline ID'),
  search: z.string().optional().describe('Search by name'),
});
