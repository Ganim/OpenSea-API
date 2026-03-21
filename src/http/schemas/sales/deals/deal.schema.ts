/**
 * DEAL SCHEMAS
 */

import { z } from 'zod';

export const createDealSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(256)
    .describe('Title of the deal'),
  customerId: z
    .string()
    .uuid()
    .describe('Customer ID associated with this deal'),
  pipelineId: z
    .string()
    .uuid()
    .describe('Pipeline ID where the deal lives'),
  stageId: z
    .string()
    .uuid()
    .describe('Current stage ID within the pipeline'),
  value: z
    .number()
    .nonnegative()
    .optional()
    .describe('Monetary value of the deal'),
  currency: z
    .string()
    .max(3)
    .optional()
    .describe('Currency code (e.g. BRL, USD)'),
  expectedCloseDate: z.coerce
    .date()
    .optional()
    .describe('Expected close date for the deal'),
  probability: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe('Win probability (0-100)'),
  assignedToUserId: z
    .string()
    .uuid()
    .optional()
    .describe('User ID assigned to the deal'),
  tags: z
    .array(z.string())
    .optional()
    .describe('Tags associated with the deal'),
  customFields: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Custom fields as key-value pairs'),
  previousDealId: z
    .string()
    .uuid()
    .optional()
    .describe('ID of the previous/parent deal'),
});

export const updateDealSchema = createDealSchema
  .omit({ customerId: true, pipelineId: true, stageId: true })
  .partial();

export const changeDealStageSchema = z.object({
  stageId: z
    .string()
    .uuid()
    .describe('New stage ID to move the deal to'),
  lostReason: z
    .string()
    .max(512)
    .optional()
    .describe('Reason for losing the deal (if moving to LOST stage)'),
});

export const dealResponseSchema = z.object({
  id: z.string().uuid().describe('Deal unique identifier'),
  tenantId: z.string().uuid().describe('Tenant ID'),
  title: z.string().describe('Deal title'),
  customerId: z.string().uuid().describe('Customer ID'),
  pipelineId: z.string().uuid().describe('Pipeline ID'),
  stageId: z.string().uuid().describe('Current stage ID'),
  value: z.number().nullable().optional().describe('Deal monetary value'),
  currency: z.string().describe('Currency code'),
  expectedCloseDate: z.coerce.date().nullable().optional().describe('Expected close date'),
  probability: z.number().nullable().optional().describe('Win probability'),
  status: z.string().describe('Deal status (OPEN, WON, LOST)'),
  lostReason: z.string().nullable().optional().describe('Reason for loss'),
  wonAt: z.coerce.date().nullable().optional().describe('Date deal was won'),
  lostAt: z.coerce.date().nullable().optional().describe('Date deal was lost'),
  closedAt: z.coerce.date().nullable().optional().describe('Date deal was closed'),
  assignedToUserId: z.string().uuid().nullable().optional().describe('Assigned user ID'),
  tags: z.array(z.string()).describe('Tags'),
  customFields: z.record(z.string(), z.unknown()).nullable().optional().describe('Custom fields'),
  stageEnteredAt: z.coerce.date().describe('Date current stage was entered'),
  previousDealId: z.string().uuid().nullable().optional().describe('Previous deal ID'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().nullable().optional().describe('Last update date'),
  deletedAt: z.coerce.date().nullable().optional().describe('Soft delete date'),
});

export const listDealsQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1)
    .describe('Page number (starts at 1)'),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .describe('Items per page (max 100)'),
  search: z
    .string()
    .max(200)
    .optional()
    .describe('Search by deal title'),
  customerId: z
    .string()
    .uuid()
    .optional()
    .describe('Filter by customer ID'),
  pipelineId: z
    .string()
    .uuid()
    .optional()
    .describe('Filter by pipeline ID'),
  stageId: z
    .string()
    .uuid()
    .optional()
    .describe('Filter by stage ID'),
  status: z
    .enum(['OPEN', 'WON', 'LOST'])
    .optional()
    .describe('Filter by deal status'),
  assignedToUserId: z
    .string()
    .uuid()
    .optional()
    .describe('Filter by assigned user ID'),
  sortBy: z
    .enum(['title', 'value', 'createdAt', 'updatedAt', 'expectedCloseDate'])
    .optional()
    .default('createdAt')
    .describe('Sort field'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc')
    .describe('Sort order'),
});
