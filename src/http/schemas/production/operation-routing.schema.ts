import { z } from 'zod';

export const createOperationRoutingSchema = z.object({
  workstationId: z.string().optional(),
  sequence: z.number().int().positive(),
  operationName: z.string().min(1).max(128),
  description: z.string().max(500).optional(),
  setupTime: z.number().int().nonnegative().optional().default(0),
  executionTime: z.number().positive(),
  waitTime: z.number().int().nonnegative().optional().default(0),
  moveTime: z.number().int().nonnegative().optional().default(0),
  isQualityCheck: z.boolean().optional(),
  isOptional: z.boolean().optional(),
  skillRequired: z.string().max(128).optional(),
  instructions: z.string().optional(),
  imageUrl: z.string().max(512).optional(),
});

export const updateOperationRoutingSchema =
  createOperationRoutingSchema.partial();

export const operationRoutingResponseSchema = z.object({
  id: z.string(),
  bomId: z.string(),
  workstationId: z.string().nullable(),
  sequence: z.number(),
  operationName: z.string(),
  description: z.string().nullable(),
  setupTime: z.number(),
  executionTime: z.number(),
  waitTime: z.number(),
  moveTime: z.number(),
  isQualityCheck: z.boolean(),
  isOptional: z.boolean(),
  skillRequired: z.string().nullable(),
  instructions: z.string().nullable(),
  imageUrl: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
