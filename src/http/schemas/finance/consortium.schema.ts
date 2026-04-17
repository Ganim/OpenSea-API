import { z } from 'zod';

export const createConsortiumSchema = z.object({
  name: z.string().min(1).max(128).describe('Nome identificador do consórcio'),
  administrator: z
    .string()
    .min(1)
    .max(128)
    .describe('Nome da administradora do consórcio'),
  bankAccountId: z.string().uuid().describe('ID da conta bancária vinculada'),
  costCenterId: z.string().uuid().describe('ID do centro de custo'),
  creditValue: z
    .number()
    .positive()
    .describe('Valor da carta de crédito em reais'),
  monthlyPayment: z
    .number()
    .positive()
    .describe('Valor da parcela mensal em reais'),
  totalInstallments: z
    .number()
    .int()
    .positive()
    .describe('Número total de parcelas'),
  startDate: z.coerce.date().describe('Data de início do consórcio (ISO 8601)'),
  paymentDay: z
    .number()
    .int()
    .min(1)
    .max(31)
    .optional()
    .describe('Dia do mês para vencimento (1-31)'),
  groupNumber: z
    .string()
    .max(32)
    .optional()
    .describe('Número do grupo do consórcio'),
  quotaNumber: z.string().max(32).optional().describe('Número da cota'),
  contractNumber: z.string().max(64).optional().describe('Número do contrato'),
  notes: z.string().optional().describe('Observações adicionais'),
});

// P1-39: update schema previously accepted only 5 fields but the edit form
// sends the full create payload (monthlyPayment, totalInstallments, startDate,
// bankAccountId, etc.). Mirror the create schema so every editable field
// round-trips. `creditValue` remains immutable since changing it after
// installments exist would break calculated balances.
export const updateConsortiumSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  administrator: z.string().min(1).max(128).optional(),
  bankAccountId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  monthlyPayment: z.number().positive().optional(),
  totalInstallments: z.number().int().positive().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
  paymentDay: z.number().int().min(1).max(31).nullable().optional(),
  groupNumber: z.string().max(32).nullable().optional(),
  quotaNumber: z.string().max(32).nullable().optional(),
  contractNumber: z.string().max(64).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const consortiumResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  costCenterId: z.string().uuid(),
  name: z.string(),
  administrator: z.string(),
  groupNumber: z.string().optional().nullable(),
  quotaNumber: z.string().optional().nullable(),
  contractNumber: z.string().optional().nullable(),
  status: z.string(),
  creditValue: z.number(),
  monthlyPayment: z.number(),
  totalInstallments: z.number(),
  paidInstallments: z.number(),
  isContemplated: z.boolean(),
  contemplatedAt: z.coerce.date().optional().nullable(),
  contemplationType: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  paymentDay: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  progressPercentage: z.number(),
  remainingInstallments: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional().nullable(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const consortiumPaymentResponseSchema = z.object({
  id: z.string().uuid(),
  consortiumId: z.string().uuid(),
  bankAccountId: z.string().uuid().optional().nullable(),
  installmentNumber: z.number(),
  dueDate: z.coerce.date(),
  expectedAmount: z.number(),
  paidAmount: z.number().optional().nullable(),
  paidAt: z.coerce.date().optional().nullable(),
  status: z.string(),
  isPaid: z.boolean(),
  isOverdue: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional().nullable(),
});

export const listConsortiaQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['createdAt', 'monthlyPayment', 'administrator', 'status'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z
    .enum(['ACTIVE', 'CONTEMPLATED', 'WITHDRAWN', 'COMPLETED', 'CANCELLED'])
    .optional()
    .describe('Status do consórcio'),
  isContemplated: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional()
    .describe('Filtrar apenas contemplados'),
  bankAccountId: z
    .string()
    .uuid()
    .optional()
    .describe('Filtrar por conta bancária'),
  costCenterId: z
    .string()
    .uuid()
    .optional()
    .describe('Filtrar por centro de custo'),
  search: z
    .string()
    .optional()
    .describe('Busca textual por descrição ou administradora'),
});

export const registerConsortiumPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  amount: z.number().positive(),
  paidAt: z.coerce.date(),
  bankAccountId: z.string().uuid().optional(),
});

export const markContemplatedSchema = z.object({
  contemplationType: z.enum(['BID', 'DRAW']),
  contemplatedAt: z.coerce.date(),
});
