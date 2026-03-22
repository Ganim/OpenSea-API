import z from 'zod';

// ─── Certificate Schemas ───────────────────────────────────────────────

export const uploadCertificateSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.string().min(1),
  subjectName: z.string().optional(),
  subjectCnpj: z.string().optional(),
  subjectCpf: z.string().optional(),
  issuerName: z.string().optional(),
  serialNumber: z.string().optional(),
  validFrom: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(),
  thumbprint: z.string().optional(),
  pfxFileId: z.string().uuid().optional(),
  pfxPassword: z.string().optional(),
  cloudProviderId: z.string().optional(),
  alertDaysBefore: z.number().int().min(0).optional(),
  isDefault: z.boolean().optional(),
  allowedModules: z.array(z.string()).optional(),
});

export const listCertificatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  type: z.string().optional(),
  search: z.string().optional(),
});

export const certificateResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  name: z.string(),
  type: z.string(),
  status: z.string(),
  subjectName: z.string().nullable(),
  subjectCnpj: z.string().nullable(),
  subjectCpf: z.string().nullable(),
  issuerName: z.string().nullable(),
  serialNumber: z.string().nullable(),
  validFrom: z.coerce.date().nullable(),
  validUntil: z.coerce.date().nullable(),
  thumbprint: z.string().nullable(),
  pfxFileId: z.string().nullable(),
  cloudProviderId: z.string().nullable(),
  alertDaysBefore: z.number().nullable(),
  isDefault: z.boolean(),
  allowedModules: z.array(z.string()).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// ─── Envelope Schemas ──────────────────────────────────────────────────

const signerInputSchema = z.object({
  userId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  externalName: z.string().optional(),
  externalEmail: z.string().email().optional(),
  externalPhone: z.string().optional(),
  externalDocument: z.string().optional(),
  order: z.number().int().min(0),
  group: z.number().int().min(0),
  role: z.string().min(1),
  signatureLevel: z.string().min(1),
  certificateId: z.string().uuid().optional(),
});

export const createEnvelopeSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  signatureLevel: z.string().min(1),
  minSignatureLevel: z.string().optional(),
  documentFileId: z.string().uuid(),
  documentHash: z.string().min(1),
  documentType: z.string().optional(),
  sourceModule: z.string().min(1),
  sourceEntityType: z.string().min(1),
  sourceEntityId: z.string().min(1),
  routingType: z.string().min(1),
  expiresAt: z.coerce.date().optional(),
  reminderDays: z.number().int().min(0).optional(),
  autoExpireDays: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  signers: z.array(signerInputSchema).min(1),
});

export const listEnvelopesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().optional(),
  sourceModule: z.string().optional(),
  createdByUserId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const signerResponseSchema = z.object({
  id: z.string().uuid(),
  envelopeId: z.string(),
  order: z.number(),
  group: z.number(),
  role: z.string(),
  status: z.string(),
  userId: z.string().nullable(),
  contactId: z.string().nullable(),
  externalName: z.string().nullable(),
  externalEmail: z.string().nullable(),
  externalPhone: z.string().nullable(),
  externalDocument: z.string().nullable(),
  signatureLevel: z.string(),
  signedAt: z.coerce.date().nullable(),
  rejectedAt: z.coerce.date().nullable(),
  rejectedReason: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const envelopeResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  signatureLevel: z.string(),
  documentFileId: z.string(),
  documentHash: z.string(),
  documentType: z.string().nullable(),
  sourceModule: z.string(),
  sourceEntityType: z.string(),
  sourceEntityId: z.string(),
  routingType: z.string(),
  expiresAt: z.coerce.date().nullable(),
  reminderDays: z.number().nullable(),
  autoExpireDays: z.number().nullable(),
  createdByUserId: z.string(),
  tags: z.array(z.string()).nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  completedAt: z.coerce.date().nullable(),
  cancelledAt: z.coerce.date().nullable(),
  cancelReason: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const envelopeDetailResponseSchema = envelopeResponseSchema.extend({
  signers: z.array(signerResponseSchema).optional(),
});

// ─── Signing Schemas (Public) ──────────────────────────────────────────

export const signDocumentSchema = z.object({
  signatureData: z.record(z.string(), z.unknown()).optional(),
  signatureImageFileId: z.string().uuid().optional(),
});

export const rejectDocumentSchema = z.object({
  reason: z.string().min(1).max(2000),
});

export const signingPageResponseSchema = z.object({
  envelopeTitle: z.string(),
  envelopeDescription: z.string().nullable(),
  documentFileId: z.string(),
  signerName: z.string().nullable(),
  signerEmail: z.string().nullable(),
  signerRole: z.string(),
  signerStatus: z.string(),
  signatureLevel: z.string(),
});

// ─── Template Schemas ──────────────────────────────────────────────────

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  signatureLevel: z.string().min(1),
  routingType: z.string().min(1),
  signerSlots: z.unknown(),
  expirationDays: z.number().int().min(1).optional(),
  reminderDays: z.number().int().min(0).optional(),
});

export const listTemplatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  isActive: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  search: z.string().optional(),
});

export const templateResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  signatureLevel: z.string(),
  routingType: z.string(),
  signerSlots: z.unknown(),
  expirationDays: z.number().nullable(),
  reminderDays: z.number().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
