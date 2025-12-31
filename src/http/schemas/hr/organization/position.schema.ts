/**
 * POSITION SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

/**
 * Schema para criação de cargo
 */
export const createPositionSchema = z.object({
  name: z.string().min(2).max(128),
  code: z.string().min(1).max(32),
  description: z.string().max(1000).optional(),
  departmentId: idSchema.optional().nullable(),
  level: z.number().int().positive().optional().default(1),
  minSalary: z.number().positive().optional(),
  maxSalary: z.number().positive().optional(),
  baseSalary: z.number().positive().optional(),
  isActive: z.boolean().optional().default(true),
});

/**
 * Schema para atualização de cargo
 */
export const updatePositionSchema = createPositionSchema.partial();

/**
 * Schema para filtros de listagem de cargos
 */
export const listPositionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  departmentId: idSchema.optional(),
  companyId: idSchema.optional(),
  level: z.coerce.number().int().positive().optional(),
});

/**
 * Schema para resposta de cargo
 */
export const positionResponseSchema = z.object({
  id: idSchema,
  name: z.string(),
  code: z.string(),
  description: z.string().optional().nullable(),
  departmentId: idSchema.optional().nullable(),
  level: z.number(),
  minSalary: z.number().optional().nullable(),
  maxSalary: z.number().optional().nullable(),
  baseSalary: z.number().optional().nullable(),
  isActive: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: dateSchema.optional().nullable(),
});

/**
 * Schema para resumo de funcionário
 */
export const employeeSummarySchema = z.object({
  id: idSchema,
  fullName: z.string(),
  registrationNumber: z.string(),
});

/**
 * Schema para resposta de cargo com detalhes (GET by ID)
 */
export const positionWithDetailsResponseSchema = positionResponseSchema.extend({
  department: z
    .object({
      id: idSchema,
      name: z.string(),
      code: z.string(),
    })
    .nullable()
    .optional(),
  company: z
    .object({
      id: idSchema,
      legalName: z.string(),
      cnpj: z.string(),
    })
    .nullable()
    .optional(),
  employeesCount: z.number(),
  employees: z.array(employeeSummarySchema).optional(),
});

// ===============================================
