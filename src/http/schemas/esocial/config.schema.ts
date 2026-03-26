import { z } from 'zod';
import { dateSchema, idSchema } from '../common.schema';

/**
 * Schema para resposta da configuração eSocial
 */
export const esocialConfigResponseSchema = z.object({
  id: idSchema,
  tenantId: idSchema,
  environment: z.string(),
  version: z.string(),
  tpInsc: z.number(),
  nrInsc: z.string().nullable(),
  autoGenerateOnAdmission: z.boolean(),
  autoGenerateOnTermination: z.boolean(),
  autoGenerateOnLeave: z.boolean(),
  autoGenerateOnPayroll: z.boolean(),
  requireApproval: z.boolean(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

/**
 * Schema para atualização da configuração eSocial
 */
export const updateEsocialConfigSchema = z.object({
  environment: z.enum(['PRODUCAO', 'HOMOLOGACAO']).optional(),
  version: z.string().max(16).optional(),
  tpInsc: z.number().int().min(1).max(2).optional(),
  nrInsc: z
    .string()
    .max(14)
    .regex(/^\d*$/, 'Must contain only digits')
    .optional()
    .nullable(),
  autoGenerateOnAdmission: z.boolean().optional(),
  autoGenerateOnTermination: z.boolean().optional(),
  autoGenerateOnLeave: z.boolean().optional(),
  autoGenerateOnPayroll: z.boolean().optional(),
  requireApproval: z.boolean().optional(),
});
