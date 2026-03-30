import { z } from 'zod';

export const registerPaymentSchema = z.object({
  amount: z.number().positive(),
  paidAt: z.coerce.date(),
  bankAccountId: z.string().uuid().optional(),
  method: z.string().max(32).optional(),
  reference: z.string().max(128).optional(),
  notes: z.string().optional(),
  idempotencyKey: z
    .string()
    .uuid()
    .optional()
    .describe('Chave de idempotência para evitar pagamentos duplicados'),
  interest: z.number().min(0).optional(),
  penalty: z.number().min(0).optional(),
});

export const splitPaymentAllocationSchema = z.object({
  entryId: z.string().uuid().describe('ID do lançamento financeiro'),
  amount: z.number().positive().describe('Valor a alocar neste lançamento'),
});

export const splitPaymentBodySchema = z.object({
  paymentAmount: z.number().positive().describe('Valor total do pagamento'),
  paymentDate: z.coerce.date().describe('Data do pagamento'),
  bankAccountId: z.string().uuid().optional().describe('ID da conta bancária'),
  paymentMethod: z
    .string()
    .max(32)
    .optional()
    .describe('Método de pagamento (PIX, BOLETO, TED, etc.)'),
  notes: z.string().optional().describe('Observações do pagamento'),
  allocations: z
    .array(splitPaymentAllocationSchema)
    .min(1, 'Pelo menos uma alocação é necessária')
    .describe('Lista de alocações por lançamento'),
});

export const splitPaymentResponseSchema = z.object({
  payments: z.array(
    z.object({
      id: z.string().uuid(),
      entryId: z.string().uuid(),
      bankAccountId: z.string().uuid().optional().nullable(),
      amount: z.number(),
      paidAt: z.coerce.date(),
      method: z.string().optional().nullable(),
      reference: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      createdBy: z.string().optional().nullable(),
      createdAt: z.coerce.date(),
    }),
  ),
  fullyPaidEntryIds: z.array(z.string().uuid()),
  partialEntryIds: z.array(z.string().uuid()),
});

export const financeEntryPaymentResponseSchema = z.object({
  id: z.string().uuid(),
  entryId: z.string().uuid(),
  bankAccountId: z.string().uuid().optional().nullable(),
  amount: z.number(),
  paidAt: z.coerce.date(),
  method: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  createdBy: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
});
