import { z } from 'zod';

export const financeQueryBodySchema = z.object({
  query: z
    .string()
    .min(2, 'A consulta deve ter no mínimo 2 caracteres')
    .max(500, 'A consulta deve ter no máximo 500 caracteres')
    .describe('Pergunta em linguagem natural sobre finanças'),
});

export const financeQueryResponseSchema = z.object({
  answer: z.string().describe('Resposta em linguagem natural em português'),
  data: z
    .record(z.unknown())
    .optional()
    .describe('Dados estruturados da resposta'),
  intent: z
    .enum([
      'EXPENSES_TOTAL',
      'INCOME_TOTAL',
      'OVERDUE_ENTRIES',
      'BALANCE',
      'FORECAST',
      'SUPPLIER_SUMMARY',
      'CUSTOMER_SUMMARY',
      'UPCOMING_PAYMENTS',
      'MONTHLY_SUMMARY',
      'UNKNOWN',
    ])
    .describe('Intenção detectada na consulta'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Nível de confiança na detecção de intenção (0 a 1)'),
});
