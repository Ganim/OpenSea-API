import { z } from 'zod';

const MAX_PAST_DAYS = 365;
const MAX_FUTURE_DAYS = 730;
const MS_PER_DAY = 86_400_000;

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
    issueDate: z.coerce
      .date()
      .refine(
        (d) => d >= new Date(Date.now() - MAX_PAST_DAYS * MS_PER_DAY),
        'Data de emissão não pode ser anterior a 1 ano',
      )
      .refine(
        (d) => d <= new Date(Date.now() + MAX_FUTURE_DAYS * MS_PER_DAY),
        'Data de emissão não pode ser superior a 2 anos',
      )
      .describe('Data de emissão (ISO 8601)'),
    dueDate: z.coerce
      .date()
      .refine(
        (d) => d <= new Date(Date.now() + MAX_FUTURE_DAYS * MS_PER_DAY),
        'Data de vencimento não pode ser superior a 2 anos',
      )
      .describe('Data de vencimento (ISO 8601)'),
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
    beneficiaryName: z
      .string()
      .max(512)
      .optional()
      .describe('Nome do beneficiário'),
    beneficiaryCpfCnpj: z
      .string()
      .max(20)
      .optional()
      .describe('CPF/CNPJ do beneficiário'),
    pixKey: z.string().max(256).optional().describe('Chave Pix'),
    pixKeyType: z
      .enum(['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'EVP'])
      .optional()
      .describe('Tipo da chave Pix'),
    tags: z
      .array(z.string())
      .optional()
      .describe('Tags para categorização')
      .transform((tags) =>
        tags
          ? [
              ...new Set(
                tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
              ),
            ]
          : undefined,
      ),
    applyRetentions: z
      .boolean()
      .optional()
      .default(false)
      .describe('Aplicar retenções tributárias automaticamente ao criar'),
    retentionConfig: z
      .object({
        applyIRRF: z.boolean().optional().describe('Reter IRRF'),
        applyISS: z.boolean().optional().describe('Reter ISS'),
        applyINSS: z.boolean().optional().describe('Reter INSS'),
        applyPIS: z.boolean().optional().describe('Reter PIS'),
        applyCOFINS: z.boolean().optional().describe('Reter COFINS'),
        applyCSLL: z.boolean().optional().describe('Reter CSLL'),
        issRate: z
          .number()
          .min(0)
          .max(0.05)
          .optional()
          .describe('Alíquota ISS customizada'),
        taxRegime: z
          .enum(['CUMULATIVO', 'NAO_CUMULATIVO'])
          .optional()
          .describe('Regime tributário para PIS/COFINS'),
      })
      .optional()
      .describe(
        'Configuração das retenções tributárias (requer applyRetentions=true)',
      ),
  })
  .refine(
    (data) =>
      !data.issueDate ||
      !data.dueDate ||
      new Date(data.dueDate) >= new Date(data.issueDate),
    {
      message: 'Due date must be on or after the issue date',
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
  beneficiaryName: z.string().max(512).nullable().optional(),
  beneficiaryCpfCnpj: z.string().max(20).nullable().optional(),
  pixKey: z.string().max(256).nullable().optional(),
  pixKeyType: z
    .enum(['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'EVP'])
    .nullable()
    .optional(),
  tags: z
    .array(z.string())
    .optional()
    .transform((tags) =>
      tags
        ? [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))]
        : undefined,
    ),
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
    .describe('Código de barras do boleto (manual)'),
  boletoDigitLine: z
    .string()
    .optional()
    .nullable()
    .describe('Linha digitável do boleto (manual)'),
  boletoChargeId: z
    .number()
    .optional()
    .nullable()
    .describe('ID da cobrança Efi (boleto registrado)'),
  boletoBarcodeNumber: z
    .string()
    .optional()
    .nullable()
    .describe('Código de barras do boleto registrado (44 dígitos)'),
  boletoDigitableLine: z
    .string()
    .optional()
    .nullable()
    .describe('Linha digitável do boleto registrado (47 dígitos)'),
  boletoPdfUrl: z
    .string()
    .optional()
    .nullable()
    .describe('URL do PDF do boleto registrado'),
  beneficiaryName: z
    .string()
    .optional()
    .nullable()
    .describe('Nome do beneficiário'),
  beneficiaryCpfCnpj: z
    .string()
    .optional()
    .nullable()
    .describe('CPF/CNPJ do beneficiário'),
  pixKey: z.string().optional().nullable().describe('Chave Pix'),
  pixKeyType: z.string().optional().nullable().describe('Tipo da chave Pix'),
  pixChargeId: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .describe('ID da cobrança PIX vinculada'),
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

export const parsePixSchema = z.object({
  code: z.string().min(1).max(1000),
});

export const parsePixResponseSchema = z.object({
  type: z.enum(['COPIA_COLA', 'CHAVE']),
  pixKey: z.string(),
  pixKeyType: z.enum(['CPF', 'CNPJ', 'EMAIL', 'PHONE', 'EVP']),
  merchantName: z.string().optional(),
  merchantCity: z.string().optional(),
  amount: z.number().optional(),
});

export const createFinanceEntriesBatchSchema = z.object({
  entries: z
    .array(createFinanceEntrySchema)
    .min(1)
    .max(20)
    .describe('Array de lançamentos para criação em lote'),
});

export const batchCreateResponseSchema = z.object({
  created: z.number(),
  entries: z.array(financeEntryResponseSchema),
});

// ============================================================================
// BULK OPERATIONS
// ============================================================================

const MAX_BULK_ENTRIES = 50;

export const bulkEntryIdsSchema = z
  .array(z.string().uuid())
  .min(1, 'At least one entry ID is required')
  .max(
    MAX_BULK_ENTRIES,
    `Maximum of ${MAX_BULK_ENTRIES} entries per bulk operation`,
  );

export const bulkPayEntriesSchema = z.object({
  entryIds: bulkEntryIdsSchema,
  bankAccountId: z
    .string()
    .uuid()
    .describe('ID da conta bancária para o pagamento'),
  method: z
    .string()
    .max(32)
    .describe('Método de pagamento (PIX, BOLETO, TED, etc.)'),
  reference: z.string().max(128).optional().describe('Referência do pagamento'),
  paidAt: z.coerce
    .date()
    .optional()
    .describe('Data do pagamento (padrão: agora)'),
});

export const bulkCancelEntriesSchema = z.object({
  entryIds: bulkEntryIdsSchema,
  reason: z
    .string()
    .max(500)
    .optional()
    .describe('Motivo do cancelamento em lote'),
});

export const bulkDeleteEntriesSchema = z.object({
  entryIds: bulkEntryIdsSchema,
});

export const bulkCategorizeEntriesSchema = z.object({
  entryIds: bulkEntryIdsSchema,
  categoryId: z.string().uuid().describe('ID da nova categoria'),
});

export const bulkOperationResultSchema = z.object({
  succeeded: z.number().describe('Quantidade de operações bem-sucedidas'),
  failed: z.number().describe('Quantidade de operações que falharam'),
  errors: z.array(
    z.object({
      entryId: z.string().uuid(),
      error: z.string(),
    }),
  ),
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
    .string()
    .optional()
    .describe(
      'Status do lançamento (pode ser um valor ou comma-separated: PENDING,OVERDUE)'
    ),
  categoryId: z.string().uuid().optional().describe('Filtrar por categoria'),
  costCenterId: z
    .string()
    .uuid()
    .optional()
    .describe('Filtrar por centro de custo'),
  bankAccountId: z
    .string()
    .uuid()
    .optional()
    .describe('Filtrar por conta bancária'),
  dueDateFrom: z.coerce
    .date()
    .optional()
    .describe('Vencimento a partir de (YYYY-MM-DD)'),
  dueDateTo: z.coerce.date().optional().describe('Vencimento até (YYYY-MM-DD)'),
  isOverdue: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional()
    .describe('Apenas lançamentos vencidos'),
  customerName: z.string().optional().describe('Filtrar por nome do cliente'),
  supplierName: z
    .string()
    .optional()
    .describe('Filtrar por nome do fornecedor'),
  overdueRange: z
    .enum(['1-7', '8-30', '31-60', '60+'])
    .optional()
    .describe('Faixa de atraso em dias'),
  search: z
    .string()
    .optional()
    .describe('Busca textual por descrição, código, fornecedor ou cliente'),
});
