import { z } from 'zod';

// ============================================================================
// Request Schemas
// ============================================================================

export const createAdmissionInviteSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).max(30).optional(),
  fullName: z.string().min(2).max(255),
  positionId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  expectedStartDate: z.coerce.date().optional(),
  salary: z.number().positive().optional(),
  contractType: z
    .enum(['CLT', 'PJ', 'INTERN', 'TEMPORARY', 'APPRENTICE'])
    .optional(),
  workRegime: z
    .enum(['FULL_TIME', 'PART_TIME', 'HOURLY', 'SHIFT', 'FLEXIBLE'])
    .optional(),
  expiresInDays: z.number().int().positive().max(90).optional().default(7),
});

export const updateAdmissionInviteSchema = z.object({
  email: z.string().email().nullable().optional(),
  phone: z.string().min(8).max(30).nullable().optional(),
  fullName: z.string().min(2).max(255).optional(),
  positionId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  expectedStartDate: z.coerce.date().nullable().optional(),
  salary: z.number().positive().nullable().optional(),
  contractType: z
    .enum(['CLT', 'PJ', 'INTERN', 'TEMPORARY', 'APPRENTICE'])
    .nullable()
    .optional(),
  workRegime: z
    .enum(['FULL_TIME', 'PART_TIME', 'HOURLY', 'SHIFT', 'FLEXIBLE'])
    .nullable()
    .optional(),
  expiresAt: z.coerce.date().nullable().optional(),
});

export const submitCandidateDataSchema = z.object({
  candidateData: z.record(z.unknown()),
});

export const signDocumentSchema = z.object({
  signerName: z.string().min(2).max(255),
  signerCpf: z.string().max(14).optional(),
  signerEmail: z.string().email().optional(),
  documentHash: z.string().min(1).max(128),
  signatureType: z.enum([
    'ADMISSION_CONTRACT',
    'DOCUMENT_ACKNOWLEDGMENT',
    'POLICY_ACCEPTANCE',
  ]),
  documentId: z.string().uuid().optional(),
});

export const approveAdmissionSchema = z.object({
  registrationNumber: z.string().min(1).max(32),
  weeklyHours: z.number().positive().max(44).optional().default(44),
});

export const rejectAdmissionSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export const listAdmissionInvitesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'CANCELLED'])
    .optional(),
  search: z.string().optional(),
});

// ============================================================================
// Response Schemas
// ============================================================================

export const admissionDocumentResponseSchema = z.object({
  id: z.string().uuid(),
  admissionInviteId: z.string().uuid(),
  tenantId: z.string().uuid(),
  type: z.string(),
  fileName: z.string(),
  fileUrl: z.string(),
  status: z.string(),
  rejectionReason: z.string().nullable(),
  validatedBy: z.string().nullable(),
  validatedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const digitalSignatureResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  admissionInviteId: z.string().uuid().nullable(),
  documentId: z.string().nullable(),
  signerName: z.string(),
  signerCpf: z.string().nullable(),
  signerEmail: z.string().nullable(),
  signedAt: z.coerce.date(),
  ipAddress: z.string(),
  userAgent: z.string(),
  documentHash: z.string(),
  pinVerified: z.boolean(),
  signatureType: z.string(),
});

export const admissionInviteResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  token: z.string().uuid(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  fullName: z.string(),
  positionId: z.string().nullable(),
  departmentId: z.string().nullable(),
  companyId: z.string().nullable(),
  expectedStartDate: z.coerce.date().nullable(),
  salary: z.number().nullable(),
  contractType: z.string().nullable(),
  workRegime: z.string().nullable(),
  status: z.string(),
  candidateData: z.record(z.unknown()).nullable(),
  expiresAt: z.coerce.date().nullable(),
  completedAt: z.coerce.date().nullable(),
  employeeId: z.string().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  documents: z.array(admissionDocumentResponseSchema).optional(),
  signatures: z.array(digitalSignatureResponseSchema).optional(),
});

export const publicAdmissionResponseSchema = z.object({
  id: z.string().uuid(),
  token: z.string().uuid(),
  fullName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  positionId: z.string().nullable(),
  departmentId: z.string().nullable(),
  expectedStartDate: z.coerce.date().nullable(),
  salary: z.number().nullable(),
  contractType: z.string().nullable(),
  workRegime: z.string().nullable(),
  status: z.string(),
  candidateData: z.record(z.unknown()).nullable(),
  expiresAt: z.coerce.date().nullable(),
  documents: z.array(admissionDocumentResponseSchema).optional(),
  signatures: z.array(digitalSignatureResponseSchema).optional(),
});

export const admissionPaginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  perPage: z.number(),
  totalPages: z.number(),
});
