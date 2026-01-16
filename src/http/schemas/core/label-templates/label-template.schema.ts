import { z } from 'zod';

export const createLabelTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional(),
  width: z.number().int().min(10).max(300),
  height: z.number().int().min(10).max(300),
  grapesJsData: z.string().min(1, 'GrapesJS data is required'),
  compiledHtml: z.string().optional(),
  compiledCss: z.string().optional(),
});

export const updateLabelTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  width: z.number().int().min(10).max(300).optional(),
  height: z.number().int().min(10).max(300).optional(),
  grapesJsData: z.string().min(1).optional(),
  compiledHtml: z.string().optional(),
  compiledCss: z.string().optional(),
});

export const duplicateLabelTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

export const listLabelTemplatesQuerySchema = z.object({
  includeSystem: z
    .string()
    .optional()
    .transform((val) => val !== 'false'),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const labelTemplateResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  width: z.number(),
  height: z.number(),
  grapesJsData: z.string(),
  compiledHtml: z.string().nullable(),
  compiledCss: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  organizationId: z.uuid(),
  createdBy: z.uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});

export const labelTemplatesListResponseSchema = z.object({
  templates: z.array(labelTemplateResponseSchema),
  total: z.number(),
});

export const thumbnailResponseSchema = z.object({
  thumbnailUrl: z.string(),
});

export type CreateLabelTemplateInput = z.infer<typeof createLabelTemplateSchema>;
export type UpdateLabelTemplateInput = z.infer<typeof updateLabelTemplateSchema>;
export type DuplicateLabelTemplateInput = z.infer<typeof duplicateLabelTemplateSchema>;
export type ListLabelTemplatesQuery = z.infer<typeof listLabelTemplatesQuerySchema>;
export type LabelTemplateResponse = z.infer<typeof labelTemplateResponseSchema>;
export type LabelTemplatesListResponse = z.infer<typeof labelTemplatesListResponseSchema>;
