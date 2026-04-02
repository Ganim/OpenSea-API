import { z } from 'zod';

// ============================================================================
// CONFIG SCHEMAS
// ============================================================================

export const upsertEmailToEntryConfigSchema = z.object({
  emailAccountId: z
    .string()
    .uuid()
    .describe('ID da conta de e-mail a monitorar'),
  monitoredFolder: z
    .string()
    .min(1)
    .max(256)
    .default('INBOX/Financeiro')
    .describe('Pasta IMAP monitorada'),
  isActive: z.boolean().default(true).describe('Se o monitoramento está ativo'),
  autoCreate: z
    .boolean()
    .default(false)
    .describe(
      'true = cria lançamento automaticamente, false = cria como rascunho',
    ),
  defaultType: z
    .enum(['PAYABLE', 'RECEIVABLE'])
    .default('PAYABLE')
    .describe('Tipo padrão dos lançamentos criados'),
  defaultCategoryId: z
    .string()
    .uuid()
    .optional()
    .nullable()
    .describe('ID da categoria financeira padrão'),
});

export const emailToEntryConfigResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  emailAccountId: z.string().uuid(),
  monitoredFolder: z.string(),
  isActive: z.boolean(),
  autoCreate: z.boolean(),
  defaultType: z.string(),
  defaultCategoryId: z.string().uuid().nullable(),
  processedCount: z.number(),
  lastProcessedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ============================================================================
// PROCESS RESPONSE SCHEMA
// ============================================================================

export const processEmailToEntryResponseSchema = z.object({
  processed: z.number().describe('Total de e-mails processados'),
  created: z.number().describe('Lançamentos criados'),
  failed: z.number().describe('Processamentos que falharam'),
  skipped: z
    .number()
    .describe('E-mails ignorados (sem anexo ou dados insuficientes)'),
  entries: z.array(
    z.object({
      messageId: z.string(),
      subject: z.string(),
      status: z.enum(['created', 'draft', 'skipped', 'failed']),
      error: z.string().optional(),
      entryId: z.string().uuid().optional(),
    }),
  ),
});
