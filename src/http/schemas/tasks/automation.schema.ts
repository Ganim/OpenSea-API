import { z } from 'zod';

export const automationTriggerEnum = z.enum([
  'CARD_MOVED',
  'CARD_CREATED',
  'DUE_DATE_REACHED',
  'ALL_SUBTASKS_DONE',
  'FIELD_CHANGED',
]);

export const automationActionEnum = z.enum([
  'SET_FIELD',
  'MOVE_CARD',
  'ASSIGN_USER',
  'ADD_LABEL',
  'SEND_NOTIFICATION',
  'COMPLETE_CARD',
]);

export const createAutomationSchema = z.object({
  name: z.string().min(1).max(256),
  trigger: automationTriggerEnum,
  triggerConfig: z.record(z.string(), z.unknown()).optional().default({}),
  action: automationActionEnum,
  actionConfig: z.record(z.string(), z.unknown()).optional().default({}),
});

export const updateAutomationSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  trigger: automationTriggerEnum.optional(),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  action: automationActionEnum.optional(),
  actionConfig: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const automationResponseSchema = z.object({
  id: z.string().uuid(),
  boardId: z.string().uuid(),
  name: z.string(),
  trigger: z.string(),
  triggerConfig: z.record(z.string(), z.unknown()).optional().nullable(),
  action: z.string(),
  actionConfig: z.record(z.string(), z.unknown()).optional().nullable(),
  isActive: z.boolean(),
  createdBy: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
