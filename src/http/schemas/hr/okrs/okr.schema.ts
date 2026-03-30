import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

const objectiveLevelEnum = z.enum([
  'COMPANY',
  'DEPARTMENT',
  'TEAM',
  'INDIVIDUAL',
]);

const objectiveStatusEnum = z.enum([
  'DRAFT',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
]);

const keyResultTypeEnum = z.enum([
  'NUMERIC',
  'PERCENTAGE',
  'CURRENCY',
  'BINARY',
]);

const keyResultStatusEnum = z.enum([
  'ON_TRACK',
  'AT_RISK',
  'BEHIND',
  'COMPLETED',
]);

const confidenceEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

// --- Objective Schemas ---

export const createObjectiveSchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(2000).optional(),
  ownerId: idSchema,
  parentId: idSchema.optional(),
  level: objectiveLevelEnum,
  period: z.string().min(1).max(16),
  startDate: dateSchema,
  endDate: dateSchema,
});

export const updateObjectiveSchema = z.object({
  title: z.string().min(1).max(256).optional(),
  description: z.string().max(2000).optional(),
  ownerId: idSchema.optional(),
  level: objectiveLevelEnum.optional(),
  period: z.string().min(1).max(16).optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  status: objectiveStatusEnum.optional(),
});

export const listObjectivesQuerySchema = z.object({
  ownerId: idSchema.optional(),
  parentId: idSchema.optional(),
  level: objectiveLevelEnum.optional(),
  status: objectiveStatusEnum.optional(),
  period: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const objectiveResponseSchema = z.object({
  id: idSchema,
  title: z.string(),
  description: z.string().nullable(),
  ownerId: idSchema,
  parentId: idSchema.nullable(),
  level: z.string(),
  status: z.string(),
  period: z.string(),
  startDate: dateSchema,
  endDate: dateSchema,
  progress: z.number(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// --- Key Result Schemas ---

export const createKeyResultSchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(2000).optional(),
  type: keyResultTypeEnum,
  startValue: z.number().optional().default(0),
  targetValue: z.number(),
  unit: z.string().max(32).optional(),
  weight: z.number().positive().optional().default(1),
});

export const keyResultResponseSchema = z.object({
  id: idSchema,
  objectiveId: idSchema,
  title: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  startValue: z.number(),
  targetValue: z.number(),
  currentValue: z.number(),
  unit: z.string().nullable(),
  status: z.string(),
  weight: z.number(),
  progressPercentage: z.number(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// --- Check-in Schemas ---

export const checkInKeyResultSchema = z.object({
  newValue: z.number(),
  note: z.string().max(2000).optional(),
  confidence: confidenceEnum,
});

export const okrCheckInResponseSchema = z.object({
  id: idSchema,
  keyResultId: idSchema,
  employeeId: idSchema,
  previousValue: z.number(),
  newValue: z.number(),
  note: z.string().nullable(),
  confidence: z.string(),
  createdAt: dateSchema,
});
