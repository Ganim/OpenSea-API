import { z } from 'zod';

export const workflowStepResponseSchema = z.object({
  id: z.string().uuid(),
  order: z.number(),
  type: z.string(),
  config: z.record(z.unknown()),
});

export const workflowResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  trigger: z.string(),
  isActive: z.boolean(),
  executionCount: z.number(),
  lastExecutedAt: z.coerce.date().optional(),
  steps: z.array(workflowStepResponseSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

export const workflowStepInputSchema = z.object({
  order: z.number().int().min(1),
  type: z.enum(['SEND_EMAIL', 'SEND_NOTIFICATION', 'UPDATE_STATUS', 'CREATE_TASK']),
  config: z.record(z.unknown()),
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  trigger: z.enum([
    'ORDER_CREATED', 'ORDER_CONFIRMED', 'DEAL_WON', 'DEAL_LOST',
    'CUSTOMER_CREATED', 'QUOTE_SENT', 'QUOTE_ACCEPTED',
  ]),
  isActive: z.boolean().optional(),
  steps: z.array(workflowStepInputSchema).optional(),
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  trigger: z.enum([
    'ORDER_CREATED', 'ORDER_CONFIRMED', 'DEAL_WON', 'DEAL_LOST',
    'CUSTOMER_CREATED', 'QUOTE_SENT', 'QUOTE_ACCEPTED',
  ]).optional(),
  steps: z.array(workflowStepInputSchema).optional(),
});

export const executeWorkflowSchema = z.object({
  trigger: z.enum([
    'ORDER_CREATED', 'ORDER_CONFIRMED', 'DEAL_WON', 'DEAL_LOST',
    'CUSTOMER_CREATED', 'QUOTE_SENT', 'QUOTE_ACCEPTED',
  ]),
  context: z.record(z.unknown()).optional(),
});

export const executionStepLogSchema = z.object({
  stepOrder: z.number(),
  stepType: z.string(),
  status: z.string(),
  message: z.string(),
});

export const workflowExecutionLogSchema = z.object({
  workflowId: z.string().uuid(),
  workflowName: z.string(),
  trigger: z.string(),
  stepsExecuted: z.array(executionStepLogSchema),
});
