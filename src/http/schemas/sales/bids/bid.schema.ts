/**
 * Bid (Licitacao) Zod Schemas
 * Validation schemas for Bids CRUD endpoints
 */

import { z } from 'zod';

// ─── Enums ──────────────────────────────────────────────────────────────────

export const bidStatusEnum = z.enum([
  'DRAFT',
  'OPEN',
  'IN_PROGRESS',
  'AWARDED',
  'LOST',
  'CANCELLED',
  'SUSPENDED',
  'COMPLETED',
]);

export const bidModalityEnum = z.enum([
  'PREGAO_ELETRONICO',
  'PREGAO_PRESENCIAL',
  'CONCORRENCIA',
  'TOMADA_PRECOS',
  'CONVITE',
  'CONCURSO',
  'LEILAO',
  'DIALOGO_COMPETITIVO',
  'RDC',
  'DISPENSA',
  'INEXIGIBILIDADE',
  'OTHER',
]);

// ─── Create Bid ─────────────────────────────────────────────────────────────

export const createBidSchema = z.object({
  title: z.string().min(1).max(255).describe('Title of the bid'),
  description: z.string().max(5000).optional().describe('Detailed description'),
  modality: bidModalityEnum.describe('Bid modality'),
  bidNumber: z.string().max(100).optional().describe('Official bid number (e.g. Pregao 001/2026)'),
  agency: z.string().min(1).max(255).describe('Government agency or entity'),
  agencyCnpj: z.string().max(20).optional().describe('Agency CNPJ'),
  portalUrl: z.string().url().max(500).optional().describe('URL of the bid portal'),
  editalUrl: z.string().url().max(500).optional().describe('URL of the edital document'),
  estimatedValue: z.number().positive().optional().describe('Estimated total value'),
  openingDate: z.coerce.date().optional().describe('Date/time the bid opens'),
  closingDate: z.coerce.date().optional().describe('Date/time the bid closes'),
  disputeDate: z.coerce.date().optional().describe('Date/time of dispute session'),
  notes: z.string().max(5000).optional().describe('Internal notes'),
  customerId: z.string().uuid().optional().describe('Related customer UUID'),
  assignedToUserId: z.string().uuid().optional().describe('User assigned to this bid'),
  tags: z.array(z.string().max(50)).max(20).optional().describe('Tags for categorization'),
});

// ─── Update Bid ─────────────────────────────────────────────────────────────

export const updateBidSchema = createBidSchema.partial();

// ─── Change Bid Status ──────────────────────────────────────────────────────

export const changeBidStatusSchema = z.object({
  status: bidStatusEnum.describe('New bid status'),
  reason: z.string().max(500).optional().describe('Reason for status change'),
});

// ─── List Bids Query ────────────────────────────────────────────────────────

export const listBidsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().max(200).optional(),
  status: bidStatusEnum.optional(),
  modality: bidModalityEnum.optional(),
  assignedToUserId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  sortBy: z.enum(['title', 'openingDate', 'closingDate', 'estimatedValue', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── Bid Response ───────────────────────────────────────────────────────────

export const bidResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  modality: z.string(),
  bidNumber: z.string().nullable(),
  status: z.string(),
  agency: z.string(),
  agencyCnpj: z.string().nullable(),
  portalUrl: z.string().nullable(),
  editalUrl: z.string().nullable(),
  estimatedValue: z.number().nullable(),
  openingDate: z.coerce.date().nullable(),
  closingDate: z.coerce.date().nullable(),
  disputeDate: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  customerId: z.string().uuid().nullable(),
  assignedToUserId: z.string().uuid().nullable(),
  tags: z.array(z.string()).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ─── Bid Document Schemas ───────────────────────────────────────────────────

export const uploadBidDocumentSchema = z.object({
  bidId: z.string().uuid().describe('Bid UUID'),
  name: z.string().min(1).max(255).describe('Document name'),
  type: z.string().max(100).optional().describe('Document type/category'),
  fileUrl: z.string().url().max(500).describe('URL of the uploaded file'),
  fileSize: z.number().int().positive().optional().describe('File size in bytes'),
  mimeType: z.string().max(100).optional().describe('MIME type'),
  notes: z.string().max(2000).optional(),
});

export const listBidDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  bidId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
});

export const bidDocumentResponseSchema = z.object({
  id: z.string().uuid(),
  bidId: z.string().uuid(),
  tenantId: z.string().uuid(),
  name: z.string(),
  type: z.string().nullable(),
  fileUrl: z.string(),
  fileSize: z.number().nullable(),
  mimeType: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ─── Bid Contract Schemas ───────────────────────────────────────────────────

export const createBidContractSchema = z.object({
  bidId: z.string().uuid().describe('Bid UUID'),
  contractNumber: z.string().min(1).max(100).describe('Official contract number'),
  description: z.string().max(5000).optional(),
  value: z.number().positive().describe('Contract value'),
  startDate: z.coerce.date().describe('Contract start date'),
  endDate: z.coerce.date().describe('Contract end date'),
  signedAt: z.coerce.date().optional().describe('Date contract was signed'),
  notes: z.string().max(5000).optional(),
});

export const listBidContractsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  bidId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
});

export const bidContractResponseSchema = z.object({
  id: z.string().uuid(),
  bidId: z.string().uuid(),
  tenantId: z.string().uuid(),
  contractNumber: z.string(),
  description: z.string().nullable(),
  value: z.number(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  signedAt: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ─── Bid Empenho Schemas ────────────────────────────────────────────────────

export const createBidEmpenhoSchema = z.object({
  bidId: z.string().uuid().describe('Bid UUID'),
  contractId: z.string().uuid().optional().describe('Related contract UUID'),
  empenhoNumber: z.string().min(1).max(100).describe('Empenho number'),
  description: z.string().max(5000).optional(),
  value: z.number().positive().describe('Empenho value'),
  empenhoDate: z.coerce.date().describe('Empenho date'),
  notes: z.string().max(5000).optional(),
});

export const listBidEmpenhosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  bidId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
});

export const bidEmpenhoResponseSchema = z.object({
  id: z.string().uuid(),
  bidId: z.string().uuid(),
  contractId: z.string().uuid().nullable(),
  tenantId: z.string().uuid(),
  empenhoNumber: z.string(),
  description: z.string().nullable(),
  value: z.number(),
  empenhoDate: z.coerce.date(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ─── AI Config Schemas ──────────────────────────────────────────────────────

export const updateBidAiConfigSchema = z.object({
  enabled: z.boolean().describe('Whether AI assistant is enabled for bids'),
  autoAnalyzeEdital: z.boolean().optional().describe('Auto-analyze edital documents'),
  autoSuggestPricing: z.boolean().optional().describe('Auto-suggest pricing'),
  autoMonitorPortals: z.boolean().optional().describe('Auto-monitor bid portals'),
  portalUrls: z.array(z.string().url().max(500)).max(20).optional().describe('Portal URLs to monitor'),
  keywords: z.array(z.string().max(100)).max(50).optional().describe('Keywords to watch for'),
});

export const bidAiConfigResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  enabled: z.boolean(),
  autoAnalyzeEdital: z.boolean(),
  autoSuggestPricing: z.boolean(),
  autoMonitorPortals: z.boolean(),
  portalUrls: z.array(z.string()).nullable(),
  keywords: z.array(z.string()).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
