import { z } from 'zod';

export const formFieldResponseSchema = z.object({
  id: z.string().uuid(),
  formId: z.string().uuid(),
  label: z.string(),
  type: z.string(),
  options: z.any().optional(),
  isRequired: z.boolean(),
  order: z.number(),
  createdAt: z.coerce.date(),
});

export const formResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  submissionCount: z.number(),
  createdBy: z.string(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  fields: z.array(formFieldResponseSchema).optional(),
});

export const formSubmissionResponseSchema = z.object({
  id: z.string().uuid(),
  formId: z.string().uuid(),
  data: z.any(),
  submittedBy: z.string().optional(),
  createdAt: z.coerce.date(),
});

const formFieldInputSchema = z.object({
  label: z.string().min(1).max(255),
  type: z.enum([
    'TEXT',
    'NUMBER',
    'EMAIL',
    'PHONE',
    'SELECT',
    'CHECKBOX',
    'TEXTAREA',
    'DATE',
  ]),
  options: z.any().optional(),
  isRequired: z.boolean().default(false),
  order: z.number().int().min(0),
});

export const createFormSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  fields: z.array(formFieldInputSchema).min(1),
});

export const updateFormSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  fields: z.array(formFieldInputSchema).optional(),
});

export const submitFormSchema = z.object({
  data: z.record(z.unknown()),
  submittedBy: z.string().optional(),
});
