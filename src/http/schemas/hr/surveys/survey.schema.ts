import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

const surveyTypeEnum = z.enum([
  'ENGAGEMENT',
  'SATISFACTION',
  'PULSE',
  'EXIT',
  'CUSTOM',
]);

const surveyStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'CLOSED', 'ARCHIVED']);

const questionTypeEnum = z.enum([
  'RATING_1_5',
  'RATING_1_10',
  'YES_NO',
  'TEXT',
  'MULTIPLE_CHOICE',
  'NPS',
]);

const questionCategoryEnum = z.enum([
  'ENGAGEMENT',
  'LEADERSHIP',
  'CULTURE',
  'WORK_LIFE',
  'GROWTH',
  'COMPENSATION',
  'CUSTOM',
]);

// --- Survey Schemas ---

export const createSurveySchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(2000).optional(),
  type: surveyTypeEnum,
  isAnonymous: z.boolean().optional().default(false),
  startDate: dateSchema,
  endDate: dateSchema,
});

export const updateSurveySchema = z.object({
  title: z.string().min(1).max(256).optional(),
  description: z.string().max(2000).optional(),
  type: surveyTypeEnum.optional(),
  isAnonymous: z.boolean().optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
});

export const listSurveysQuerySchema = z.object({
  type: surveyTypeEnum.optional(),
  status: surveyStatusEnum.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const surveyResponseSchema = z.object({
  id: idSchema,
  title: z.string(),
  description: z.string().nullable(),
  type: z.string(),
  status: z.string(),
  isAnonymous: z.boolean(),
  startDate: dateSchema,
  endDate: dateSchema,
  createdBy: idSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// --- Survey Question Schemas ---

export const createSurveyQuestionSchema = z.object({
  text: z.string().min(1).max(1000),
  type: questionTypeEnum,
  options: z.array(z.string()).optional(),
  order: z.number().int().nonnegative(),
  isRequired: z.boolean().optional().default(true),
  category: questionCategoryEnum,
});

export const surveyQuestionResponseSchema = z.object({
  id: idSchema,
  surveyId: idSchema,
  text: z.string(),
  type: z.string(),
  options: z.unknown().nullable(),
  order: z.number(),
  isRequired: z.boolean(),
  category: z.string(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

// --- Survey Response Schemas ---

export const submitSurveyResponseSchema = z.object({
  employeeId: idSchema.optional(),
  answers: z.array(
    z.object({
      questionId: idSchema,
      ratingValue: z.number().int().optional(),
      textValue: z.string().max(2000).optional(),
      selectedOptions: z.array(z.string()).optional(),
    }),
  ),
});

export const surveyResponseItemSchema = z.object({
  id: idSchema,
  surveyId: idSchema,
  employeeId: idSchema.nullable(),
  submittedAt: dateSchema,
  createdAt: dateSchema,
});
