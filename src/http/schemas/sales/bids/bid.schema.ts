import { z } from 'zod';

const bidModalityEnum = z.enum([
  'PREGAO_ELETRONICO',
  'PREGAO_PRESENCIAL',
  'CONCORRENCIA',
  'TOMADA_PRECOS',
  'CONVITE',
  'LEILAO',
  'DIALOGO_COMPETITIVO',
  'CONCURSO',
  'DISPENSA',
  'INEXIGIBILIDADE',
]);

const bidCriterionEnum = z.enum([
  'MENOR_PRECO',
  'MAIOR_DESCONTO',
  'MELHOR_TECNICA',
  'TECNICA_PRECO',
  'MAIOR_LANCE',
  'MAIOR_RETORNO',
]);

const bidLegalFrameworkEnum = z.enum([
  'LEI_14133_2021',
  'LEI_8666_1993',
  'LEI_10520_2002',
  'LEI_12462_2011',
  'DECRETO_10024_2019',
]);

const bidExecutionRegimeEnum = z.enum([
  'EMPREITADA_PRECO_GLOBAL',
  'EMPREITADA_PRECO_UNITARIO',
  'TAREFA',
  'INTEGRAL',
  'FORNECIMENTO_REGIME_PRECO',
]);

const bidStatusEnum = z.enum([
  'DISCOVERED',
  'ANALYZING',
  'VIABLE',
  'NOT_VIABLE',
  'PREPARING',
  'PROPOSAL_SENT',
  'AWAITING_DISPUTE',
  'IN_DISPUTE',
  'WON',
  'LOST',
  'DESERTED',
  'REVOKED',
  'SUSPENDED',
  'MONITORING',
  'CONTRACTED',
  'COMPLETED',
  'ARCHIVED',
]);

const bidDocumentTypeEnum = z.enum([
  'CERTIDAO_FEDERAL',
  'CERTIDAO_ESTADUAL',
  'CERTIDAO_MUNICIPAL',
  'CERTIDAO_TRABALHISTA',
  'CERTIDAO_FGTS',
  'CERTIDAO_FALENCIA',
  'BALANCO_PATRIMONIAL',
  'CONTRATO_SOCIAL',
  'ALVARA',
  'ATESTADO_CAPACIDADE',
  'PROPOSTA_TECNICA',
  'PROPOSTA_COMERCIAL',
  'EDITAL',
  'ATA_REGISTRO',
  'OUTROS',
]);

const bidContractStatusEnum = z.enum([
  'DRAFT_CONTRACT',
  'ACTIVE_CONTRACT',
  'SUSPENDED_CONTRACT',
  'COMPLETED_CONTRACT',
  'TERMINATED_CONTRACT',
  'RENEWED_CONTRACT',
]);

const bidEmpenhoTypeEnum = z.enum([
  'ORDINARIO',
  'ESTIMATIVO',
  'GLOBAL_EMPENHO',
]);

const bidEmpenhoStatusEnum = z.enum([
  'EMITIDO',
  'PARCIALMENTE_LIQUIDADO',
  'LIQUIDADO',
  'ANULADO',
]);

// ─── Create Bid ────────────────────────────────────────────────────────────
export const createBidSchema = z.object({
  portalName: z.string().min(1).max(64).describe('Portal name'),
  portalEditalId: z.string().max(128).optional().describe('Portal edital ID'),
  editalNumber: z.string().min(1).max(128).describe('Edital number'),
  modality: bidModalityEnum.describe('Bid modality'),
  criterionType: bidCriterionEnum.describe('Criterion type'),
  legalFramework: bidLegalFrameworkEnum.describe('Legal framework'),
  executionRegime: bidExecutionRegimeEnum
    .optional()
    .describe('Execution regime'),
  object: z.string().min(1).describe('Object description'),
  objectSummary: z.string().max(512).optional().describe('Short summary'),
  organName: z.string().min(1).max(256).describe('Organ name'),
  organCnpj: z.string().max(18).optional().describe('Organ CNPJ'),
  organState: z.string().max(2).optional().describe('Organ state (UF)'),
  organCity: z.string().max(128).optional().describe('Organ city'),
  estimatedValue: z.number().positive().optional().describe('Estimated value'),
  publicationDate: z.coerce.date().optional().describe('Publication date'),
  openingDate: z.coerce.date().describe('Opening date'),
  closingDate: z.coerce.date().optional().describe('Closing date'),
  disputeDate: z.coerce.date().optional().describe('Dispute date'),
  customerId: z.string().uuid().optional().describe('Customer (organ) ID'),
  assignedToUserId: z.string().uuid().optional().describe('Assigned user ID'),
  exclusiveMeEpp: z
    .boolean()
    .optional()
    .default(false)
    .describe('Exclusive ME/EPP'),
  deliveryStates: z
    .array(z.string().max(2))
    .optional()
    .describe('Delivery states'),
  tags: z.array(z.string().max(50)).optional().describe('Tags'),
  notes: z.string().optional().describe('Notes'),
  editalUrl: z.string().url().max(1024).optional().describe('Edital URL'),
});

// ─── Update Bid ────────────────────────────────────────────────────────────
export const updateBidSchema = z.object({
  object: z.string().min(1).optional().describe('Object description'),
  objectSummary: z.string().max(512).optional().describe('Short summary'),
  status: bidStatusEnum.optional().describe('Bid status'),
  viabilityScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .optional()
    .describe('Viability score'),
  viabilityReason: z.string().max(512).optional().describe('Viability reason'),
  ourProposalValue: z
    .number()
    .positive()
    .optional()
    .describe('Our proposal value'),
  finalValue: z.number().positive().optional().describe('Final value'),
  margin: z.number().optional().describe('Margin %'),
  customerId: z.string().uuid().nullable().optional().describe('Customer ID'),
  assignedToUserId: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .describe('Assigned user ID'),
  tags: z.array(z.string().max(50)).optional().describe('Tags'),
  notes: z.string().optional().describe('Notes'),
});

// ─── Bid Response ──────────────────────────────────────────────────────────
export const bidResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  portalName: z.string(),
  portalEditalId: z.string().nullable(),
  editalNumber: z.string(),
  modality: z.string(),
  criterionType: z.string(),
  legalFramework: z.string(),
  executionRegime: z.string().nullable(),
  object: z.string(),
  objectSummary: z.string().nullable(),
  organName: z.string(),
  organCnpj: z.string().nullable(),
  organState: z.string().nullable(),
  organCity: z.string().nullable(),
  estimatedValue: z.number().nullable(),
  ourProposalValue: z.number().nullable(),
  finalValue: z.number().nullable(),
  margin: z.number().nullable(),
  publicationDate: z.coerce.date().nullable(),
  openingDate: z.coerce.date(),
  closingDate: z.coerce.date().nullable(),
  disputeDate: z.coerce.date().nullable(),
  status: z.string(),
  viabilityScore: z.number().nullable(),
  viabilityReason: z.string().nullable(),
  customerId: z.string().nullable(),
  assignedToUserId: z.string().nullable(),
  exclusiveMeEpp: z.boolean(),
  deliveryStates: z.array(z.string()),
  tags: z.array(z.string()),
  notes: z.string().nullable(),
  editalUrl: z.string().nullable(),
  editalFileId: z.string().nullable(),
  etpFileId: z.string().nullable(),
  trFileId: z.string().nullable(),
  deletedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});

// ─── List Bids Query ───────────────────────────────────────────────────────
export const listBidsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(200).optional(),
  status: bidStatusEnum.optional(),
  modality: bidModalityEnum.optional(),
  organState: z.string().max(2).optional(),
  assignedToUserId: z.string().uuid().optional(),
  sortBy: z
    .enum(['createdAt', 'openingDate', 'estimatedValue', 'editalNumber'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ─── Bid Item Response ─────────────────────────────────────────────────────
export const bidItemResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  bidId: z.string().uuid(),
  itemNumber: z.number(),
  lotNumber: z.number().nullable(),
  lotDescription: z.string().nullable(),
  description: z.string(),
  quantity: z.number(),
  unit: z.string(),
  estimatedUnitPrice: z.number().nullable(),
  ourUnitPrice: z.number().nullable(),
  finalUnitPrice: z.number().nullable(),
  status: z.string(),
  variantId: z.string().nullable(),
  matchConfidence: z.number().nullable(),
  quotaType: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});

// ─── Bid Document ──────────────────────────────────────────────────────────
export const createBidDocumentSchema = z.object({
  bidId: z.string().uuid().optional(),
  type: bidDocumentTypeEnum,
  name: z.string().min(1).max(256),
  description: z.string().max(512).optional(),
  fileId: z.string().uuid(),
  issueDate: z.coerce.date().optional(),
  expirationDate: z.coerce.date().optional(),
  autoRenewable: z.boolean().optional().default(false),
});

export const bidDocumentResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  bidId: z.string().nullable(),
  type: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  fileId: z.string(),
  issueDate: z.coerce.date().nullable(),
  expirationDate: z.coerce.date().nullable(),
  isValid: z.boolean(),
  autoRenewable: z.boolean(),
  lastRenewAttempt: z.coerce.date().nullable(),
  renewStatus: z.string().nullable(),
  portalUploaded: z.boolean(),
  portalUploadedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});

export const listBidDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  bidId: z.string().uuid().optional(),
  type: bidDocumentTypeEnum.optional(),
});

// ─── Bid Contract ──────────────────────────────────────────────────────────
export const createBidContractSchema = z.object({
  bidId: z.string().uuid(),
  contractNumber: z.string().min(1).max(128),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  totalValue: z.number().positive(),
  customerId: z.string().uuid(),
  signedDate: z.coerce.date().optional(),
  maxRenewals: z.number().int().min(0).optional(),
  renewalDeadline: z.coerce.date().optional(),
  deliveryAddresses: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().optional(),
});

export const bidContractResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  bidId: z.string().uuid(),
  contractNumber: z.string(),
  status: z.string(),
  signedDate: z.coerce.date().nullable(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  totalValue: z.number(),
  remainingValue: z.number(),
  customerId: z.string(),
  renewalCount: z.number(),
  maxRenewals: z.number().nullable(),
  renewalDeadline: z.coerce.date().nullable(),
  deliveryAddresses: z.record(z.string(), z.unknown()).nullable(),
  contractFileId: z.string().nullable(),
  notes: z.string().nullable(),
  deletedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});

export const listBidContractsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: bidContractStatusEnum.optional(),
  bidId: z.string().uuid().optional(),
});

// ─── Bid Empenho ───────────────────────────────────────────────────────────
export const createBidEmpenhoSchema = z.object({
  contractId: z.string().uuid(),
  empenhoNumber: z.string().min(1).max(128),
  type: bidEmpenhoTypeEnum,
  value: z.number().positive(),
  issueDate: z.coerce.date(),
  notes: z.string().optional(),
});

export const bidEmpenhoResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  contractId: z.string().uuid(),
  empenhoNumber: z.string(),
  type: z.string(),
  value: z.number(),
  issueDate: z.coerce.date(),
  status: z.string(),
  orderId: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});

// ─── Bid History ───────────────────────────────────────────────────────────
export const bidHistoryResponseSchema = z.object({
  id: z.string().uuid(),
  bidId: z.string().uuid(),
  tenantId: z.string().uuid(),
  action: z.string(),
  description: z.string(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  performedByUserId: z.string().nullable(),
  performedByAi: z.boolean(),
  isReversible: z.boolean(),
  createdAt: z.coerce.date(),
});

// ─── Common pagination query ───────────────────────────────────────────────
export const bidSubResourceQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ─── Change Bid Status ────────────────────────────────────────────────────
export const changeBidStatusSchema = z.object({
  status: bidStatusEnum.describe('New bid status'),
  reason: z.string().max(512).optional().describe('Reason for status change'),
});

// ─── Upload Bid Document ──────────────────────────────────────────────────
export const uploadBidDocumentSchema = z.object({
  bidId: z.string().uuid().optional().describe('Bid UUID'),
  type: bidDocumentTypeEnum.describe('Document type'),
  name: z.string().min(1).max(256).describe('Document name'),
  description: z.string().max(512).optional().describe('Document description'),
  fileId: z.string().uuid().describe('File UUID from storage'),
  issueDate: z.coerce.date().optional().describe('Issue date'),
  expirationDate: z.coerce.date().optional().describe('Expiration date'),
  autoRenewable: z
    .boolean()
    .optional()
    .default(false)
    .describe('Auto-renewable flag'),
});

// ─── List Bid Empenhos Query ──────────────────────────────────────────────
export const listBidEmpenhosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  contractId: z.string().uuid().optional().describe('Filter by contract'),
  status: bidEmpenhoStatusEnum.optional().describe('Filter by empenho status'),
  bidId: z.string().uuid().optional().describe('Filter by bid'),
});

// ─── Bid AI Config Response ───────────────────────────────────────────────
export const bidAiConfigResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  autonomyLevel: z.number(),
  maxEditalValue: z.number().nullable(),
  minMarginPercent: z.number(),
  allowedModalities: z.array(z.string()),
  allowedCategories: z.array(z.string()),
  blockedOrgans: z.array(z.string()),
  maxSimultaneous: z.number(),
  maxAggregateExposure: z.number().nullable(),
  coolingOffMinutes: z.number(),
  emergencyStop: z.boolean(),
  firstTimeApproval: z.boolean(),
  companySize: z.string().nullable(),
  monitoringTimeoutDays: z.number(),
  autoProspect: z.boolean(),
  autoPropose: z.boolean(),
  autoDispute: z.boolean(),
  autoRespond: z.boolean(),
  autoCreateOrder: z.boolean(),
  notifyOnActions: z.boolean(),
  chatResponseWhitelist: z.array(z.string()),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().nullable(),
});

// ─── Update Bid AI Config ─────────────────────────────────────────────────
export const updateBidAiConfigSchema = z.object({
  enabled: z.boolean().optional().describe('Enable/disable AI'),
  autonomyLevel: z
    .number()
    .int()
    .min(0)
    .max(5)
    .optional()
    .describe('Autonomy level (0-5)'),
  maxEditalValue: z
    .number()
    .positive()
    .nullable()
    .optional()
    .describe('Max edital value'),
  minMarginPercent: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe('Min margin %'),
  allowedModalities: z
    .array(z.string())
    .optional()
    .describe('Allowed modalities'),
  allowedCategories: z
    .array(z.string())
    .optional()
    .describe('Allowed categories'),
  blockedOrgans: z.array(z.string()).optional().describe('Blocked organs'),
  maxSimultaneous: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Max simultaneous bids'),
  maxAggregateExposure: z
    .number()
    .positive()
    .nullable()
    .optional()
    .describe('Max aggregate exposure'),
  coolingOffMinutes: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Cooling-off minutes'),
  emergencyStop: z.boolean().optional().describe('Emergency stop'),
  firstTimeApproval: z
    .boolean()
    .optional()
    .describe('Require first-time approval'),
  companySize: z
    .string()
    .max(16)
    .nullable()
    .optional()
    .describe('Company size'),
  monitoringTimeoutDays: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Monitoring timeout days'),
  autoProspect: z.boolean().optional().describe('Auto prospect'),
  autoPropose: z.boolean().optional().describe('Auto propose'),
  autoDispute: z.boolean().optional().describe('Auto dispute'),
  autoRespond: z.boolean().optional().describe('Auto respond'),
  autoCreateOrder: z.boolean().optional().describe('Auto create order'),
  notifyOnActions: z.boolean().optional().describe('Notify on actions'),
  chatResponseWhitelist: z
    .array(z.string())
    .optional()
    .describe('Chat response whitelist'),
});
