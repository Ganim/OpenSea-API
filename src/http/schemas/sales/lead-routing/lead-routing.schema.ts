/**
 * Lead Routing Zod Schemas
 * Validation schemas for Lead Routing CRUD endpoints
 */

import { z } from 'zod';

// ─── Strategy Enum ──────────────────────────────────────────────────────────

const leadRoutingStrategyEnum = z.enum([
  'ROUND_ROBIN',
  'TERRITORY',
  'SEGMENT',
  'LOAD_BALANCE',
]);

// ─── Create Routing Rule ────────────────────────────────────────────────────

export const createLeadRoutingRuleSchema = z.object({
  name: z.string().min(1).max(255).describe('Rule name'),
  strategy: leadRoutingStrategyEnum.describe('Routing strategy'),
  config: z
    .record(z.string(), z.unknown())
    .optional()
    .default({})
    .describe('Strategy configuration (territories, segments, etc.)'),
  assignToUsers: z
    .array(z.string().uuid())
    .optional()
    .default([])
    .describe('User IDs to assign leads to'),
  maxLeadsPerUser: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Maximum leads per user (for LOAD_BALANCE)'),
  isActive: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether the rule is active'),
});

// ─── Update Routing Rule ────────────────────────────────────────────────────

export const updateLeadRoutingRuleSchema = createLeadRoutingRuleSchema
  .partial()
  .describe('Update routing rule fields (all optional)');

// ─── Routing Rule Response ──────────────────────────────────────────────────

export const leadRoutingRuleResponseSchema = z.object({
  id: z.string().uuid().describe('Unique rule ID'),
  tenantId: z.string().uuid().describe('Tenant ID'),
  name: z.string().describe('Rule name'),
  strategy: z.string().describe('Routing strategy'),
  config: z.record(z.string(), z.unknown()).describe('Strategy configuration'),
  assignToUsers: z.array(z.string()).describe('User IDs in rotation'),
  maxLeadsPerUser: z.number().nullable().describe('Max leads per user'),
  lastAssignedIndex: z.number().describe('Last assigned index'),
  isActive: z.boolean().describe('Whether rule is active'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().describe('Last update date'),
});

// ─── List Routing Rules Query ───────────────────────────────────────────────

export const listLeadRoutingRulesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('Page number'),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .describe('Items per page'),
  search: z.string().max(200).optional().describe('Search by name'),
  strategy: leadRoutingStrategyEnum.optional().describe('Filter by strategy'),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional()
    .describe('Filter by active status'),
  sortBy: z
    .enum(['name', 'strategy', 'createdAt', 'updatedAt'])
    .optional()
    .default('createdAt')
    .describe('Field to sort by'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc')
    .describe('Sort order'),
});

// ─── Route Lead Response ────────────────────────────────────────────────────

export const routeLeadResponseSchema = z.object({
  assignedToUserId: z.string().uuid().describe('Assigned user ID'),
  routingRuleName: z.string().describe('Matched rule name'),
  strategy: z.string().describe('Strategy used'),
});
