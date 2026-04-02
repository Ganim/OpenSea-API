import { z } from 'zod';

export const createPixChargeSchema = z.object({
  expirationSeconds: z
    .number()
    .int()
    .positive()
    .max(86400)
    .optional()
    .describe('Tempo de expiração da cobrança em segundos (padrão: 3600)'),
  payerCpfCnpj: z
    .string()
    .max(14)
    .optional()
    .describe('CPF ou CNPJ do pagador'),
  payerName: z.string().max(256).optional().describe('Nome do pagador'),
});

export const createPixChargeResponseSchema = z.object({
  entry: z.object({
    id: z.string().uuid(),
    code: z.string(),
    description: z.string(),
    pixChargeId: z.string().uuid().optional().nullable(),
  }),
  txId: z.string().describe('Identificador da transação PIX'),
  pixCopiaECola: z.string().describe('Código PIX Copia e Cola'),
  qrCodeUrl: z.string().describe('URL do QR Code para pagamento'),
  expiresAt: z.coerce.date().describe('Data de expiração da cobrança'),
  amount: z.number().describe('Valor da cobrança em reais'),
});

export const payViaPixSchema = z.object({
  bankAccountId: z
    .string()
    .uuid()
    .optional()
    .describe('ID da conta bancária para o débito'),
  reference: z.string().max(128).optional().describe('Referência do pagamento'),
  notes: z
    .string()
    .max(500)
    .optional()
    .describe('Observações sobre o pagamento'),
});

export const payViaPixResponseSchema = z.object({
  entry: z.object({
    id: z.string().uuid(),
    code: z.string(),
    description: z.string(),
    status: z.string(),
  }),
  payment: z.object({
    id: z.string().uuid(),
    amount: z.number(),
    paidAt: z.coerce.date(),
    method: z.string().nullable().optional(),
    reference: z.string().nullable().optional(),
  }),
});
