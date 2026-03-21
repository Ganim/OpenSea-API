import { z } from 'zod';

const costCenterAllocationSchema = z.object({
  costCenterId: z.string().uuid(),
  percentage: z.number().min(0.01).max(100),
});

export const createFinanceEntrySchema = z
  .object({
    type: z
      .enum(['PAYABLE', 'RECEIVABLE'])
      .describe('Tipo do lançamento: a pagar ou a receber'),
    description: z
      .string()
      .min(1)
      .max(500)
      .describe('Descrição do lançamento financeiro'),
    notes: z.string().optional().describe('Observações adicionais'),
    categoryId: z.string().uuid().describe('ID da categoria financeira'),
    costCenterId: z
      .string()
      .uuid()
      .optional()
      .describe('ID do centro de custo (alocação simples, 100%)'),
    costCenterAllocations: z
      .array(costCenterAllocationSchema)
      .optional()
      .describe('Rateio por percentual entre múltiplos centros de custo'),
    bankAccountId: z
      .string()
      .uuid()
      .optional()
      .describe('ID da conta bancária associada'),
    supplierName: z
      .string()
      .max(256)
      .optional()
      .describe('Nome do fornecedor (para contas a pagar)'),
    customerName: z
      .string()
      .max(256)
      .optional()
      .describe('Nome do cliente (para contas a receber)'),
    supplierId: z.string().uuid().optional().describe('ID do fornecedor'),
    customerId: z.string().uuid().optional().describe('ID do cliente'),
    salesOrderId: z
      .string()
      .uuid()
      .optional()
      .describe('ID do pedido de venda vinculado'),
    expectedAmount: z
      .number()
      .positive()
      .describe('Valor esperado em reais (R$)'),
    discount: z
      .number()
      .min(0)
      .optional()
      .describe('Valor de desconto em reais'),
    interest: z.number().min(0).optional().describe('Valor de juros em reais'),
    penalty: z.number().min(0).optional().describe('Valor de multa em reais'),
    issueDate: z.coerce.date().describe('Data de emissão (ISO 8601)'),
    dueDate: z.coerce.date().describe('Data de vencimento (ISO 8601)'),
    competenceDate: z.coerce
      .date()
      .optional()
      .describe('Data de competência contábil (ISO 8601)'),
    recurrenceType: z
      .enum(['SINGLE', 'RECURRING', 'INSTALLMENT'])
      .optional()
      .describe('Tipo de recorrência: único, recorrente ou parcelado'),
    recurrenceInterval: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Intervalo entre recorrências'),
    recurrenceUnit: z
      .enum([
        'DAILY',
        'WEEKLY',
        'BIWEEKLY',
        'MONTHLY',
        'QUARTERLY',
        'SEMIANNUAL',
        'ANNUAL',
      ])
      .optional()
      .describe('Unidade de recorrência'),
    totalInstallments: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Número total de parcelas'),
    currentInstallment: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Número da parcela atual'),
    boletoBarcode: z
      .string()
      .max(64)
      .optional()
      .describe('Código de barras do boleto (criptografado em repouso)'),
    boletoDigitLine: z
      .string()
      .max(64)
      .optional()
      .describe('Linha digitável do boleto (criptografada em repouso)'),
    tags: z.array(z.string()).optional().describe('Tags para categorização'),
  })
  .refine(
    (data) =>
      !data.issueDate ||
      !data.dueDate ||
      new Date(data.dueDate) >= new Date(data.issueDate),
    {
      message:
        'Data de vencimento deve ser igual ou posterior à data de emissão',
      path: ['dueDate'],
    },
  );

export const updateFinanceEntrySchema = z.object({
  description: z.string().min(1).max(500).optional(),
  notes: z.string().nullable().optional(),
  categoryId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid().nullable().optional(),
  supplierName: z.string().max(256).nullable().optional(),
  customerName: z.string().max(256).nullable().optional(),
  expectedAmount: z.number().positive().optional(),
  discount: z.number().min(0).optional(),
  interest: z.number().min(0).optional(),
  penalty: z.number().min(0).optional(),
  dueDate: z.coerce.date().optional(),
  competenceDate: z.coerce.date().nullable().optional(),
  boletoBarcode: z.string().max(64).nullable().optional(),
  boletoDigitLine: z.string().max(64).nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const financeEntryResponseSchema = z.object({
  id: z.string().uuid().describe('ID único do lançamento'),
  tenantId: z.string().uuid().describe('ID do tenant'),
  type: z.string().describe('Tipo: PAYABLE ou RECEIVABLE'),
  code: z.string().describe('Código sequencial do lançamento (ex: FIN-000001)'),
  description: z.string().describe('Descrição do lançamento'),
  notes: z.string().optional().nullable().describe('Observações adicionais'),
  categoryId: z.string().uuid().describe('ID da categoria financeira'),
  costCenterId: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .describe('ID do centro de custo principal'),
  costCenterAllocations: z
    .array(
      z.object({
        costCenterId: z.string().uuid().describe('ID do centro de custo'),
        costCenterName: z
          .string()
          .optional()
          .nullable()
          .describe('Nome do centro de custo'),
        percentage: z.number().describe('Percentual alocado (0-100)'),
        amount: z.number().describe('Valor alocado em reais'),
      }),
    )
    .optional()
    .nullable()
    .describe('Rateio entre centros de custo'),
  bankAccountId: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .describe('ID da conta bancária'),
  supplierName: z.string().optional().nullable().describe('Nome do fornecedor'),
  customerName: z.string().optional().nullable().describe('Nome do cliente'),
  supplierId: z.string().optional().nullable().describe('ID do fornecedor'),
  customerId: z.string().optional().nullable().describe('ID do cliente'),
  salesOrderId: z
    .string()
    .optional()
    .nullable()
    .describe('ID do pedido de venda'),
  expectedAmount: z.number().describe('Valor esperado em reais'),
  actualAmount: z
    .number()
    .optional()
    .nullable()
    .describe('Valor efetivamente pago/recebido'),
  discount: z.number().describe('Valor de desconto aplicado'),
  interest: z.number().describe('Valor de juros'),
  penalty: z.number().describe('Valor de multa'),
  totalDue: z
    .number()
    .describe('Valor total devido (esperado + juros + multa - desconto)'),
  remainingBalance: z.number().describe('Saldo restante a pagar/receber'),
  isOverdue: z.boolean().describe('Indica se o lançamento está vencido'),
  issueDate: z.coerce.date().describe('Data de emissão'),
  dueDate: z.coerce.date().describe('Data de vencimento'),
  competenceDate: z.coerce
    .date()
    .optional()
    .nullable()
    .describe('Data de competência contábil'),
  paymentDate: z.coerce
    .date()
    .optional()
    .nullable()
    .describe('Data do pagamento/recebimento'),
  status: z
    .string()
    .describe(
      'Status: PENDING, OVERDUE, PAID, RECEIVED, PARTIALLY_PAID, CANCELLED, SCHEDULED',
    ),
  recurrenceType: z
    .string()
    .describe('Tipo de recorrência: SINGLE, RECURRING ou INSTALLMENT'),
  recurrenceInterval: z
    .number()
    .optional()
    .nullable()
    .describe('Intervalo entre recorrências'),
  recurrenceUnit: z
    .string()
    .optional()
    .nullable()
    .describe('Unidade de recorrência'),
  totalInstallments: z
    .number()
    .optional()
    .nullable()
    .describe('Número total de parcelas'),
  currentInstallment: z
    .number()
    .optional()
    .nullable()
    .describe('Número da parcela atual'),
  parentEntryId: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .describe('ID do lançamento pai (para parcelas)'),
  boletoBarcode: z
    .string()
    .optional()
    .nullable()
    .describe('Código de barras do boleto'),
  boletoDigitLine: z
    .string()
    .optional()
    .nullable()
    .describe('Linha digitável do boleto'),
  tags: z.array(z.string()).describe('Tags de categorização'),
  createdBy: z
    .string()
    .optional()
    .nullable()
    .describe('ID do usuário que criou'),
  createdAt: z.coerce.date().describe('Data de criação'),
  updatedAt: z.coerce
    .date()
    .optional()
    .nullable()
    .describe('Data da última atualização'),
  deletedAt: z.coerce
    .date()
    .optional()
    .nullable()
    .describe('Data de exclusão (soft delete)'),
});

export const parseBoletoSchema = z.object({
  barcode: z.string().min(44).max(54),
});

export const parseBoletoResponseSchema = z.object({
  bankCode: z.string(),
  bankName: z.string(),
  amount: z.number(),
  dueDate: z.coerce.date(),
  barcode: z.string(),
  digitLine: z.string(),
});

export const listFinanceEntriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z
    .enum(['createdAt', 'dueDate', 'expectedAmount', 'description', 'status'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  type: z.enum(['PAYABLE', 'RECEIVABLE']).optional(),
  status: z
    .enum([
      'PENDING',
      'OVERDUE',
      'PAID',
      'RECEIVED',
      'PARTIALLY_PAID',
      'CANCELLED',
      'SCHEDULED',
    ])
    .optional(),
  categoryId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  bankAccountId: z.string().uuid().optional(),
  dueDateFrom: z.coerce.date().optional(),
  dueDateTo: z.coerce.date().optional(),
  isOverdue: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  customerName: z.string().optional(),
  supplierName: z.string().optional(),
  overdueRange: z.enum(['1-7', '8-30', '31-60', '60+']).optional(),
  search: z.string().optional(),
});
