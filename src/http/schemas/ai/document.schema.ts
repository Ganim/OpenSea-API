import { z } from 'zod';

export const analyzeDocumentBodySchema = z.object({
  content: z
    .string()
    .min(10, 'O conteúdo do documento deve ter pelo menos 10 caracteres')
    .max(
      100_000,
      'O conteúdo do documento excede o limite de 100.000 caracteres',
    ),
  documentType: z
    .enum(['EDITAL', 'LICITACAO', 'PREGAO', 'COTACAO', 'OTHER'])
    .optional(),
});

const extractedItemSchema = z.object({
  itemNumber: z.number(),
  description: z.string(),
  quantity: z.number(),
  unit: z.string(),
  specifications: z.string().optional(),
  estimatedUnitPrice: z.number().optional(),
});

const itemMatchSchema = z.object({
  extractedItem: extractedItemSchema,
  product: z.object({
    id: z.string(),
    name: z.string(),
    currentStock: z.number(),
    price: z.number(),
  }),
  matchConfidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  stockSufficient: z.boolean(),
  deficit: z.number().optional(),
});

const suggestedActionSchema = z.object({
  type: z.enum([
    'CREATE_PURCHASE_ORDER',
    'SCHEDULE_REMINDER',
    'GENERATE_PROPOSAL',
    'ALERT_LOW_STOCK',
  ]),
  description: z.string(),
  tool: z.string().optional(),
  args: z.record(z.string(), z.unknown()).optional(),
});

export const analyzeDocumentResponseSchema = z.object({
  documentInfo: z.object({
    type: z.string(),
    title: z.string(),
    organization: z.string(),
    openingDate: z.string().optional(),
    deliveryDeadline: z.string().optional(),
    estimatedValue: z.number().optional(),
    requirements: z.array(z.string()),
  }),
  items: z.array(extractedItemSchema),
  stockMatch: z.object({
    totalItems: z.number(),
    matchedItems: z.number(),
    matchPercentage: z.number(),
    matches: z.array(itemMatchSchema),
    missing: z.array(extractedItemSchema),
  }),
  suggestedActions: z.array(suggestedActionSchema),
  summary: z.string(),
});
