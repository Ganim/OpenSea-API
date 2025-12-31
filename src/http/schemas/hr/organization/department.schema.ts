/**
 * DEPARTMENT SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

/**
 * Schema para criação de departamento
 */
export const createDepartmentSchema = z.object({
  name: z.string().min(2).max(128),
  code: z.string().min(1).max(32),
  description: z.string().max(1000).optional(),
  parentId: idSchema.optional().nullable(),
  managerId: idSchema.optional().nullable(),
  companyId: idSchema,
  isActive: z.boolean().optional().default(true),
});

/**
 * Schema para atualização de departamento (companyId não pode ser alterado)
 */
export const updateDepartmentSchema = createDepartmentSchema
  .omit({ companyId: true })
  .partial();

/**
 * Schema para filtros de listagem de departamentos
 */
export const listDepartmentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  parentId: idSchema.optional(),
  companyId: idSchema.optional(),
});

/**
 * Schema para resposta de departamento
 */
export const departmentResponseSchema = z.object({
  id: idSchema,
  name: z.string(),
  code: z.string(),
  description: z.string().optional().nullable(),
  parentId: idSchema.optional().nullable(),
  managerId: idSchema.optional().nullable(),
  companyId: idSchema,
  isActive: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: dateSchema.optional().nullable(),
});

/**
 * Schema para resposta de cargo resumida
 */
export const positionSummarySchema = z.object({
  id: idSchema,
  name: z.string(),
  code: z.string(),
  level: z.number(),
  baseSalary: z.number().optional().nullable(),
  isActive: z.boolean(),
});

/**
 * Schema para resposta de departamento com detalhes (GET by ID)
 */
export const departmentWithDetailsResponseSchema = departmentResponseSchema.extend({
  company: z
    .object({
      id: idSchema,
      legalName: z.string(),
      cnpj: z.string(),
    })
    .nullable()
    .optional(),
  positions: z.array(positionSummarySchema).optional(),
  positionsCount: z.number(),
});

// ===============================================
