import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const fiscalProviderEnum = z.enum([
  'NUVEM_FISCAL',
  'FOCUS_NFE',
  'WEBMANIABR',
  'NFEWIZARD',
]);

export const fiscalEnvironmentEnum = z.enum(['HOMOLOGATION', 'PRODUCTION']);

export const taxRegimeEnum = z.enum([
  'SIMPLES_NACIONAL',
  'SIMPLES_NACIONAL_EXCESSO',
  'LUCRO_PRESUMIDO',
  'LUCRO_REAL',
  'MEI',
]);

export const fiscalDocumentTypeEnum = z.enum(['NFE', 'NFCE', 'NFSE']);

export const fiscalDocumentStatusEnum = z.enum([
  'DRAFT',
  'PENDING',
  'AUTHORIZED',
  'CANCELLED',
  'DENIED',
  'CORRECTED',
  'INUTILIZED',
]);

// ============================================================================
// Configure Fiscal — PUT /v1/fiscal/config
// ============================================================================

export const configureFiscalBodySchema = z.object({
  provider: fiscalProviderEnum.describe('Fiscal provider'),
  environment: fiscalEnvironmentEnum.describe('Emission environment'),
  apiKey: z.string().min(1).describe('Provider API key'),
  apiSecret: z.string().optional().describe('Provider API secret'),
  defaultSeries: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Default NF-e series number'),
  defaultCfop: z.string().min(4).max(4).describe('Default CFOP code'),
  defaultNaturezaOperacao: z
    .string()
    .min(1)
    .max(200)
    .describe('Default operation nature'),
  taxRegime: taxRegimeEnum.describe('Company tax regime'),
  nfceEnabled: z
    .boolean()
    .optional()
    .describe('Whether NFC-e emission is enabled'),
  nfceCscId: z.string().optional().describe('NFC-e CSC ID'),
  nfceCscToken: z.string().optional().describe('NFC-e CSC Token'),
  contingencyMode: z
    .boolean()
    .optional()
    .describe('Whether contingency mode is enabled'),
  contingencyReason: z
    .string()
    .optional()
    .describe('Reason for contingency mode'),
  settings: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Additional provider settings'),
});

export const fiscalConfigResponseSchema = z.object({
  id: z.string().uuid().describe('Configuration ID'),
  tenantId: z.string().uuid().describe('Tenant ID'),
  provider: z.string().describe('Fiscal provider'),
  environment: z.string().describe('Emission environment'),
  defaultSeries: z.number().describe('Default series number'),
  lastNfeNumber: z.number().describe('Last emitted NF-e number'),
  lastNfceNumber: z.number().describe('Last emitted NFC-e number'),
  defaultCfop: z.string().describe('Default CFOP'),
  defaultNaturezaOperacao: z.string().describe('Default operation nature'),
  taxRegime: z.string().describe('Tax regime'),
  nfceEnabled: z.boolean().describe('NFC-e enabled'),
  contingencyMode: z.boolean().describe('Contingency mode'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().nullable().optional().describe('Last update date'),
});

// ============================================================================
// Upload Certificate — POST /v1/fiscal/certificates
// ============================================================================

export const uploadCertificateBodySchema = z.object({
  pfxPassword: z.string().min(1).describe('PFX certificate password'),
  serialNumber: z.string().min(1).describe('Certificate serial number'),
  issuer: z.string().min(1).describe('Certificate issuer'),
  subject: z.string().min(1).describe('Certificate subject'),
  validFrom: z.coerce.date().describe('Certificate validity start'),
  validUntil: z.coerce.date().describe('Certificate validity end'),
});

export const certificateResponseSchema = z.object({
  id: z.string().uuid().describe('Certificate ID'),
  serialNumber: z.string().describe('Serial number'),
  issuer: z.string().describe('Issuer'),
  subject: z.string().describe('Subject'),
  validFrom: z.coerce.date().describe('Valid from'),
  validUntil: z.coerce.date().describe('Valid until'),
  status: z.string().describe('Certificate status'),
  daysUntilExpiry: z.number().describe('Days until expiry'),
  createdAt: z.coerce.date().describe('Creation date'),
});

// ============================================================================
// Emit NF-e / NFC-e — POST /v1/fiscal/nfe, POST /v1/fiscal/nfce
// ============================================================================

export const fiscalDocumentItemSchema = z.object({
  productId: z.string().uuid().optional().describe('Product ID from stock'),
  productName: z.string().min(1).max(120).describe('Product name'),
  productCode: z.string().min(1).max(60).describe('Product code'),
  ncm: z.string().min(8).max(8).describe('NCM code (8 digits)'),
  cest: z.string().optional().describe('CEST code'),
  cfop: z.string().optional().describe('CFOP override for this item'),
  quantity: z.number().positive().describe('Quantity'),
  unitPrice: z.number().nonnegative().describe('Unit price'),
  discount: z.number().nonnegative().optional().describe('Discount amount'),
  cst: z.string().min(1).max(3).describe('CST/CSOSN code'),
  icmsBase: z
    .number()
    .nonnegative()
    .optional()
    .describe('ICMS calculation base'),
  icmsRate: z.number().nonnegative().optional().describe('ICMS rate (%)'),
  ipiRate: z.number().nonnegative().optional().describe('IPI rate (%)'),
  pisRate: z.number().nonnegative().optional().describe('PIS rate (%)'),
  cofinsRate: z.number().nonnegative().optional().describe('COFINS rate (%)'),
});

export const emitNFeBodySchema = z.object({
  recipientCnpjCpf: z
    .string()
    .min(11)
    .max(14)
    .describe('Recipient CNPJ or CPF'),
  recipientName: z.string().min(1).max(200).describe('Recipient name'),
  recipientIe: z
    .string()
    .optional()
    .describe('Recipient IE (State Registration)'),
  naturezaOperacao: z.string().optional().describe('Operation nature override'),
  cfop: z.string().optional().describe('CFOP override'),
  items: z.array(fiscalDocumentItemSchema).min(1).describe('Document items'),
  totalShipping: z
    .number()
    .nonnegative()
    .optional()
    .describe('Total shipping cost'),
  additionalInfo: z
    .string()
    .max(5000)
    .optional()
    .describe('Additional information'),
  orderId: z.string().uuid().optional().describe('Related order ID'),
});

export const emitNFCeBodySchema = z.object({
  recipientCnpjCpf: z
    .string()
    .min(11)
    .max(14)
    .describe('Recipient CNPJ or CPF'),
  recipientName: z.string().min(1).max(200).describe('Recipient name'),
  items: z.array(fiscalDocumentItemSchema).min(1).describe('Document items'),
  totalShipping: z
    .number()
    .nonnegative()
    .optional()
    .describe('Total shipping cost'),
  additionalInfo: z
    .string()
    .max(5000)
    .optional()
    .describe('Additional information'),
  orderId: z.string().uuid().optional().describe('Related order ID'),
});

export const fiscalDocumentResponseSchema = z.object({
  id: z.string().uuid().describe('Document ID'),
  tenantId: z.string().uuid().describe('Tenant ID'),
  type: z.string().describe('Document type (NFE, NFCE, NFSE)'),
  series: z.number().describe('Document series'),
  number: z.number().describe('Document number'),
  accessKey: z.string().nullable().optional().describe('SEFAZ access key'),
  status: z.string().describe('Document status'),
  emissionType: z.string().describe('Emission type'),
  recipientCnpjCpf: z.string().describe('Recipient CNPJ/CPF'),
  recipientName: z.string().describe('Recipient name'),
  naturezaOperacao: z.string().describe('Operation nature'),
  cfop: z.string().describe('CFOP'),
  totalProducts: z.number().describe('Total products'),
  totalDiscount: z.number().describe('Total discount'),
  totalShipping: z.number().describe('Total shipping'),
  totalTax: z.number().describe('Total tax'),
  totalValue: z.number().describe('Total document value'),
  danfePdfUrl: z.string().nullable().optional().describe('DANFE PDF URL'),
  protocolNumber: z
    .string()
    .nullable()
    .optional()
    .describe('SEFAZ protocol number'),
  protocolDate: z.coerce
    .date()
    .nullable()
    .optional()
    .describe('SEFAZ protocol date'),
  cancelledAt: z.coerce
    .date()
    .nullable()
    .optional()
    .describe('Cancellation date'),
  cancelReason: z
    .string()
    .nullable()
    .optional()
    .describe('Cancellation reason'),
  correctionText: z
    .string()
    .nullable()
    .optional()
    .describe('Correction letter text'),
  additionalInfo: z
    .string()
    .nullable()
    .optional()
    .describe('Additional information'),
  createdAt: z.coerce.date().describe('Creation date'),
  updatedAt: z.coerce.date().nullable().optional().describe('Last update date'),
});

// ============================================================================
// Cancel Document — POST /v1/fiscal/documents/:id/cancel
// ============================================================================

export const cancelDocumentBodySchema = z.object({
  reason: z
    .string()
    .min(
      15,
      'Cancellation reason must be at least 15 characters (SEFAZ requirement)',
    )
    .max(255)
    .describe('Cancellation reason'),
});

// ============================================================================
// Correction Letter — POST /v1/fiscal/documents/:id/correction
// ============================================================================

export const correctionLetterBodySchema = z.object({
  correctionText: z
    .string()
    .min(
      15,
      'Correction text must be at least 15 characters (SEFAZ requirement)',
    )
    .max(1000)
    .describe('Correction letter text'),
});

// ============================================================================
// List Documents — GET /v1/fiscal/documents
// ============================================================================

export const listFiscalDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('Page number'),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20)
    .describe('Items per page'),
  type: fiscalDocumentTypeEnum.optional().describe('Filter by document type'),
  status: fiscalDocumentStatusEnum.optional().describe('Filter by status'),
  startDate: z.coerce.date().optional().describe('Filter from date'),
  endDate: z.coerce.date().optional().describe('Filter until date'),
});

// ============================================================================
// Get Document — GET /v1/fiscal/documents/:id
// ============================================================================

export const fiscalDocumentParamsSchema = z.object({
  id: z.string().uuid().describe('Fiscal document ID'),
});

export const fiscalDocumentDetailResponseSchema =
  fiscalDocumentResponseSchema.extend({
    items: z.array(
      z.object({
        id: z.string().uuid(),
        itemNumber: z.number(),
        productName: z.string(),
        productCode: z.string(),
        ncm: z.string(),
        cfop: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        totalPrice: z.number(),
        discount: z.number(),
        cst: z.string(),
        icmsValue: z.number(),
        ipiValue: z.number(),
        pisValue: z.number(),
        cofinsValue: z.number(),
      }),
    ),
    events: z.array(
      z.object({
        id: z.string().uuid(),
        type: z.string(),
        protocol: z.string().nullable().optional(),
        description: z.string(),
        success: z.boolean(),
        errorCode: z.string().nullable().optional(),
        errorMessage: z.string().nullable().optional(),
        createdAt: z.coerce.date(),
      }),
    ),
  });

// ============================================================================
// Webhook — POST /v1/webhooks/fiscal
// ============================================================================

export const fiscalWebhookBodySchema = z.object({
  event: z.string().describe('Webhook event type'),
  accessKey: z.string().optional().describe('Document access key'),
  externalId: z.string().optional().describe('Provider external ID'),
  status: z.string().optional().describe('New document status'),
  protocol: z.string().optional().describe('SEFAZ protocol'),
  xml: z.string().optional().describe('Response XML'),
  errorCode: z.string().optional().describe('Error code if failed'),
  errorMessage: z.string().optional().describe('Error message if failed'),
});
