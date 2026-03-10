import { z } from 'zod';

export const ocrExtractTextSchema = z.object({
  text: z.string().min(1).max(50000),
});

export const ocrExtractedDataSchema = z.object({
  valor: z.number().optional(),
  vencimento: z.string().optional(),
  beneficiario: z.string().optional(),
  codigoBarras: z.string().optional(),
  linhaDigitavel: z.string().optional(),
});

export const ocrExtractResponseSchema = z.object({
  rawText: z.string(),
  extractedData: ocrExtractedDataSchema,
  confidence: z.number(),
});

export const lastSupplierEntryQuerySchema = z.object({
  supplierName: z.string().min(1).max(256),
});

export const lastSupplierEntryResponseSchema = z
  .object({
    categoryId: z.string(),
    costCenterId: z.string().optional(),
  })
  .nullable();
