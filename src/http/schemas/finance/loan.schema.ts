import { z } from 'zod';

export const createLoanSchema = z.object({
  name: z.string().min(1).max(128).describe('Nome identificador do empréstimo'),
  type: z
    .enum([
      'PERSONAL',
      'BUSINESS',
      'WORKING_CAPITAL',
      'EQUIPMENT',
      'REAL_ESTATE',
      'CREDIT_LINE',
      'OTHER',
    ])
    .describe('Tipo do empréstimo'),
  bankAccountId: z.string().uuid().describe('ID da conta bancária vinculada'),
  costCenterId: z.string().uuid().describe('ID do centro de custo'),
  principalAmount: z
    .number()
    .positive()
    .describe('Valor principal do empréstimo em reais'),
  interestRate: z
    .number()
    .min(0)
    .describe(
      'Taxa de juros (percentual mensal ou anual conforme interestType)',
    ),
  interestType: z
    .string()
    .max(16)
    .optional()
    .describe('Tipo de juros: MONTHLY, ANNUAL, etc.'),
  startDate: z.coerce
    .date()
    .describe('Data de início do empréstimo (ISO 8601)'),
  totalInstallments: z
    .number()
    .int()
    .positive()
    .describe('Número total de parcelas'),
  installmentDay: z
    .number()
    .int()
    .min(1)
    .max(31)
    .optional()
    .describe('Dia do mês para vencimento das parcelas (1-31)'),
  contractNumber: z
    .string()
    .max(64)
    .optional()
    .describe('Número do contrato bancário'),
  notes: z.string().optional().describe('Observações adicionais'),
});

export const updateLoanSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  contractNumber: z.string().max(64).nullable().optional(),
  notes: z.string().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
});

export const loanResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  bankAccountId: z.string().uuid(),
  costCenterId: z.string().uuid(),
  name: z.string(),
  type: z.string(),
  contractNumber: z.string().optional().nullable(),
  status: z.string(),
  principalAmount: z.number(),
  outstandingBalance: z.number(),
  interestRate: z.number(),
  interestType: z.string().optional().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  totalInstallments: z.number(),
  paidInstallments: z.number(),
  installmentDay: z.number().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean(),
  isDefaulted: z.boolean(),
  progressPercentage: z.number(),
  remainingInstallments: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional().nullable(),
  deletedAt: z.coerce.date().optional().nullable(),
});

export const loanInstallmentResponseSchema = z.object({
  id: z.string().uuid(),
  loanId: z.string().uuid(),
  bankAccountId: z.string().uuid().optional().nullable(),
  installmentNumber: z.number(),
  dueDate: z.coerce.date(),
  principalAmount: z.number(),
  interestAmount: z.number(),
  totalAmount: z.number(),
  paidAmount: z.number().optional().nullable(),
  paidAt: z.coerce.date().optional().nullable(),
  status: z.string(),
  isPaid: z.boolean(),
  isOverdue: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional().nullable(),
});

export const listLoansQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['createdAt', 'totalAmount', 'institution', 'status'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  type: z
    .enum([
      'PERSONAL',
      'BUSINESS',
      'WORKING_CAPITAL',
      'EQUIPMENT',
      'REAL_ESTATE',
      'CREDIT_LINE',
      'OTHER',
    ])
    .optional()
    .describe('Tipo do empréstimo'),
  status: z
    .enum(['ACTIVE', 'PAID_OFF', 'DEFAULTED', 'RENEGOTIATED', 'CANCELLED'])
    .optional()
    .describe('Status do empréstimo'),
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
    .describe('Busca textual por descrição ou instituição'),
});

export const registerLoanPaymentSchema = z.object({
  installmentId: z.string().uuid(),
  amount: z.number().positive(),
  paidAt: z.coerce.date(),
  bankAccountId: z.string().uuid().optional(),
});
