import { z } from 'zod';

export const customFieldTypeEnum = z.enum([
  'TEXT',
  'NUMBER',
  'DATE',
  'CHECKBOX',
  'SELECT',
  'MULTI_SELECT',
]);

export const createCustomFieldSchema = z.object({
  name: z.string().min(1).max(256),
  type: customFieldTypeEnum,
  options: z.record(z.string(), z.unknown()).optional().nullable(),
  isRequired: z.boolean().optional().default(false),
});

export const updateCustomFieldSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  type: customFieldTypeEnum.optional(),
  options: z.record(z.string(), z.unknown()).optional().nullable(),
  isRequired: z.boolean().optional(),
});

export const setCardCustomFieldValuesSchema = z.object({
  values: z
    .array(
      z.object({
        fieldId: z.string().uuid(),
        value: z.unknown(),
      }),
    )
    .min(1),
});

export const customFieldResponseSchema = z.object({
  id: z.string().uuid(),
  boardId: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  options: z.record(z.string(), z.unknown()).optional().nullable(),
  isRequired: z.boolean(),
  position: z.number(),
  createdAt: z.coerce.date(),
});

export const cardCustomFieldValueResponseSchema = z.object({
  id: z.string().uuid(),
  cardId: z.string().uuid(),
  fieldId: z.string().uuid(),
  value: z.unknown(),
});
