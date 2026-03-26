/**
 * DEPENDANT SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

export const dependantRelationshipEnum = z.enum([
  'SPOUSE',
  'CHILD',
  'STEPCHILD',
  'PARENT',
  'OTHER',
]);

/**
 * Schema para criação de dependente
 */
export const createDependantSchema = z.object({
  name: z.string().min(1).max(256),
  cpf: z.string().max(256).optional(),
  cpfHash: z.string().max(64).optional(),
  birthDate: z.coerce.date(),
  relationship: dependantRelationshipEnum,
  isIrrfDependant: z.boolean().optional().default(false),
  isSalarioFamilia: z.boolean().optional().default(false),
  hasDisability: z.boolean().optional().default(false),
});

/**
 * Schema para atualização de dependente
 */
export const updateDependantSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  cpf: z.string().max(256).optional(),
  cpfHash: z.string().max(64).optional(),
  birthDate: z.coerce.date().optional(),
  relationship: dependantRelationshipEnum.optional(),
  isIrrfDependant: z.boolean().optional(),
  isSalarioFamilia: z.boolean().optional(),
  hasDisability: z.boolean().optional(),
});

/**
 * Schema para parâmetros de dependente
 */
export const dependantParamsSchema = z.object({
  employeeId: idSchema,
  dependantId: idSchema,
});

/**
 * Schema para query de listagem de dependentes
 */
export const listDependantsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema de resposta de dependente
 */
export const dependantResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  name: z.string(),
  cpf: z.string().nullable(),
  birthDate: dateSchema,
  relationship: z.string(),
  isIrrfDependant: z.boolean(),
  isSalarioFamilia: z.boolean(),
  hasDisability: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
