/**
 * TERMINATION SCHEMAS
 */

import { z } from 'zod';
import { dateSchema, idSchema } from '../../common.schema';

const terminationTypeEnum = z.enum([
  'SEM_JUSTA_CAUSA',
  'JUSTA_CAUSA',
  'PEDIDO_DEMISSAO',
  'ACORDO_MUTUO',
  'CONTRATO_TEMPORARIO',
  'RESCISAO_INDIRETA',
  'FALECIMENTO',
]);

const noticeTypeEnum = z.enum(['TRABALHADO', 'INDENIZADO', 'DISPENSADO']);

const terminationStatusEnum = z.enum(['PENDING', 'CALCULATED', 'PAID']);

/**
 * Schema para criação de rescisão
 */
export const createTerminationSchema = z.object({
  employeeId: idSchema,
  type: terminationTypeEnum,
  terminationDate: z.coerce.date(),
  lastWorkDay: z.coerce.date(),
  noticeType: noticeTypeEnum,
  notes: z.string().max(2000).optional(),
});

/**
 * Schema para cálculo de verbas rescisórias
 */
export const calculateTerminationSchema = z.object({
  totalFgtsBalance: z.number().nonnegative().optional().default(0),
});

/**
 * Schema para atualização de rescisão (marcar como paga)
 */
export const updateTerminationSchema = z.object({
  markAsPaid: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});

/**
 * Schema para filtros de listagem de rescisões
 */
export const listTerminationsQuerySchema = z.object({
  employeeId: idSchema.optional(),
  status: terminationStatusEnum.optional(),
  type: terminationTypeEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  perPage: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Schema para resposta de rescisão
 */
export const terminationResponseSchema = z.object({
  id: idSchema,
  employeeId: idSchema,
  type: terminationTypeEnum,
  terminationDate: dateSchema,
  lastWorkDay: dateSchema,
  noticeType: noticeTypeEnum,
  noticeDays: z.number().int(),
  saldoSalario: z.number().nullable(),
  avisoIndenizado: z.number().nullable(),
  decimoTerceiroProp: z.number().nullable(),
  feriasVencidas: z.number().nullable(),
  feriasVencidasTerco: z.number().nullable(),
  feriasProporcional: z.number().nullable(),
  feriasProporcionalTerco: z.number().nullable(),
  multaFgts: z.number().nullable(),
  inssRescisao: z.number().nullable(),
  irrfRescisao: z.number().nullable(),
  outrosDescontos: z.number().nullable(),
  totalBruto: z.number().nullable(),
  totalDescontos: z.number().nullable(),
  totalLiquido: z.number().nullable(),
  paymentDeadline: dateSchema,
  paidAt: dateSchema.nullable(),
  status: terminationStatusEnum,
  notes: z.string().nullable(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

/**
 * Schema para resposta de cálculo (inclui breakdown)
 */
export const terminationCalculationResponseSchema = z.object({
  termination: terminationResponseSchema,
  breakdown: z.object({
    saldoSalario: z.number(),
    avisoIndenizado: z.number(),
    decimoTerceiroProp: z.number(),
    feriasVencidas: z.number(),
    feriasVencidasTerco: z.number(),
    feriasProporcional: z.number(),
    feriasProporcionalTerco: z.number(),
    multaFgts: z.number(),
    inssRescisao: z.number(),
    irrfRescisao: z.number(),
    outrosDescontos: z.number(),
    totalBruto: z.number(),
    totalDescontos: z.number(),
    totalLiquido: z.number(),
  }),
});
