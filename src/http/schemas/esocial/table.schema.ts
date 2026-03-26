import { z } from 'zod';

/**
 * Schema para resposta de lista de tabelas
 */
export const esocialTableSummarySchema = z.object({
  tableCode: z.string(),
  description: z.string(),
  itemCount: z.number(),
});

/**
 * Schema para item de tabela
 */
export const esocialTableItemSchema = z.object({
  id: z.string(),
  tableCode: z.string(),
  itemCode: z.string(),
  description: z.string(),
  isActive: z.boolean(),
});

/**
 * Schema para parâmetros da tabela
 */
export const getTableItemsParamsSchema = z.object({
  code: z.string().min(1).max(8),
});

/**
 * Schema para query de busca em tabela
 */
export const getTableItemsQuerySchema = z.object({
  search: z.string().optional(),
});
