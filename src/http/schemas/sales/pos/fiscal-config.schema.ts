import { z } from 'zod';

/**
 * Schemas for `GET /v1/admin/pos/fiscal-config` and
 * `PUT /v1/admin/pos/fiscal-config` (Emporion Plan A — Task 32).
 *
 * The configuration is a singleton per tenant: there is no `:id` parameter on
 * either endpoint — the backing row is keyed by the JWT-derived `tenantId`.
 * Cross-tenant access is impossible because neither schema exposes a tenant
 * input.
 */

const POS_FISCAL_DOCUMENT_TYPE_VALUES = [
  'NFE',
  'NFC_E',
  'SAT_CFE',
  'MFE',
] as const;

const POS_FISCAL_EMISSION_MODE_VALUES = [
  'ONLINE_SYNC',
  'OFFLINE_CONTINGENCY',
  'NONE',
] as const;

/**
 * Body schema for `PUT /v1/admin/pos/fiscal-config`. Cross-field invariants
 * (`defaultDocumentType` must be enabled, NFC-e online needs counter, etc.)
 * live in `UpdateTenantFiscalConfigUseCase` because they depend on persisted
 * tenant state — the schema only enforces shape and trivial bounds.
 */
export const updateFiscalConfigBodySchema = z.object({
  enabledDocumentTypes: z
    .array(z.enum(POS_FISCAL_DOCUMENT_TYPE_VALUES))
    .min(1, 'enabledDocumentTypes must contain at least one document type.'),
  defaultDocumentType: z.enum(POS_FISCAL_DOCUMENT_TYPE_VALUES),
  emissionMode: z.enum(POS_FISCAL_EMISSION_MODE_VALUES),
  certificatePath: z.string().trim().min(1).max(500).nullish(),
  nfceSeries: z.number().int().positive().nullish(),
  nfceNextNumber: z.number().int().positive().nullish(),
  satDeviceId: z.string().trim().min(1).max(120).nullish(),
});

const fiscalConfigShape = z.object({
  id: z.string(),
  tenantId: z.string(),
  enabledDocumentTypes: z.array(z.enum(POS_FISCAL_DOCUMENT_TYPE_VALUES)),
  defaultDocumentType: z.enum(POS_FISCAL_DOCUMENT_TYPE_VALUES),
  emissionMode: z.enum(POS_FISCAL_EMISSION_MODE_VALUES),
  certificatePath: z.string().nullable(),
  nfceSeries: z.number().int().nullable(),
  nfceNextNumber: z.number().int().nullable(),
  satDeviceId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

/**
 * Response schema for `GET /v1/admin/pos/fiscal-config`. `fiscalConfig` is
 * `null` when the tenant has not configured the fiscal subsystem yet — the
 * frontend uses this signal to render the first-time setup panel instead of
 * an edit form.
 */
export const getFiscalConfigResponseSchema = z.object({
  fiscalConfig: fiscalConfigShape.nullable(),
});

export const updateFiscalConfigResponseSchema = z.object({
  fiscalConfig: fiscalConfigShape,
});
