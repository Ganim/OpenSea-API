import { z } from 'zod';
import { dateSchema, idSchema } from '../common.schema';

/**
 * Schema para resposta de certificado (sem dados PFX)
 */
export const esocialCertificateResponseSchema = z.object({
  id: idSchema,
  tenantId: idSchema,
  type: z.string(),
  serialNumber: z.string(),
  issuer: z.string(),
  subject: z.string(),
  validFrom: dateSchema,
  validUntil: dateSchema,
  isActive: z.boolean(),
  isExpired: z.boolean(),
  isExpiringSoon: z.boolean(),
  daysUntilExpiry: z.number(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});

/**
 * Schema para upload de certificado
 */
export const uploadCertificateSchema = z.object({
  type: z.enum(['E_CNPJ', 'E_CPF']),
  passphrase: z.string().min(1).max(512),
});

/**
 * Schema para verificação de expiração
 */
export const certificateExpiryResponseSchema = z.object({
  hasCertificate: z.boolean(),
  isExpired: z.boolean(),
  isExpiringSoon: z.boolean(),
  daysUntilExpiry: z.number().nullable(),
  validUntil: dateSchema.nullable(),
});
