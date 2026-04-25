import { z } from 'zod';

/**
 * Schemas for `POST /v1/pos/fiscal/emit` (Emporion Plan A — Task 32).
 *
 * Device-authenticated endpoint: the terminal calls this after a successful
 * `POST /v1/pos/sales` to trigger NFC-e emission for the resulting Order. The
 * use case is idempotent — replaying the request for an already-authorized
 * Order returns `ALREADY_EMITTED` with the persisted authorization metadata.
 */

const POS_FISCAL_DOCUMENT_TYPE_VALUES = [
  'NFE',
  'NFC_E',
  'SAT_CFE',
  'MFE',
] as const;

const ORDER_STATUS_VALUES = [
  'DRAFT',
  'PENDING',
  'CONFIRMED',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
] as const;

const ORDER_ORIGIN_SOURCE_VALUES = [
  'WEB',
  'POS_DESKTOP',
  'API',
  'MOBILE',
] as const;

export const emitFiscalDocumentBodySchema = z.object({
  orderId: z.string().uuid(),
});

// Order serialization: Date fields flow through Fastify's JSON serializer as
// ISO strings before Zod sees them, so the response schema accepts either
// shape. Same convention used by Tasks 28-31.
const dateOrIsoString = z.union([z.string(), z.date()]);

const orderShape = z.object({
  id: z.string(),
  tenantId: z.string(),
  orderNumber: z.string(),
  type: z.string(),
  status: z.enum(ORDER_STATUS_VALUES),
  customerId: z.string(),
  pipelineId: z.string(),
  stageId: z.string(),
  channel: z.string(),
  subtotal: z.number(),
  discountTotal: z.number(),
  grandTotal: z.number(),
  paidAmount: z.number(),
  originSource: z.enum(ORDER_ORIGIN_SOURCE_VALUES),
  posTerminalId: z.string().nullable(),
  posSessionId: z.string().nullable(),
  posOperatorEmployeeId: z.string().nullable(),
  saleLocalUuid: z.string().nullable(),
  fiscalDocumentType: z.enum(POS_FISCAL_DOCUMENT_TYPE_VALUES).nullable(),
  fiscalDocumentNumber: z.number().int().nullable(),
  fiscalAccessKey: z.string().nullable(),
  fiscalAuthorizationProtocol: z.string().nullable(),
  fiscalEmittedAt: dateOrIsoString.nullable(),
  fiscalEmissionStatus: z.string().nullable(),
  createdAt: dateOrIsoString,
});

/**
 * Discriminated union by `status`:
 * - `AUTHORIZED` — fresh emission; carries documentType/Number/accessKey/protocol/xml + Order snapshot.
 * - `ALREADY_EMITTED` — idempotent replay; carries the persisted metadata + Order snapshot.
 * - `SKIPPED` — fiscal disabled at tenant level (`emissionMode=NONE`); carries `reason`.
 * - `REJECTED` — SEFAZ rejected the envelope; carries `errorCode/errorMessage` + Order snapshot
 *   (with `fiscalEmissionStatus=REJECTED`).
 */
const authorizedResponseSchema = z.object({
  status: z.literal('AUTHORIZED'),
  documentType: z.enum(POS_FISCAL_DOCUMENT_TYPE_VALUES),
  documentNumber: z.number().int().positive(),
  accessKey: z.string(),
  authorizationProtocol: z.string(),
  xml: z.string(),
  order: orderShape,
});

const alreadyEmittedResponseSchema = z.object({
  status: z.literal('ALREADY_EMITTED'),
  documentType: z.enum(POS_FISCAL_DOCUMENT_TYPE_VALUES).optional(),
  documentNumber: z.number().int().positive().optional(),
  accessKey: z.string().optional(),
  authorizationProtocol: z.string().optional(),
  order: orderShape,
});

const skippedResponseSchema = z.object({
  status: z.literal('SKIPPED'),
  reason: z.string(),
});

const rejectedResponseSchema = z.object({
  status: z.literal('REJECTED'),
  errorCode: z.string(),
  errorMessage: z.string(),
  order: orderShape,
});

export const emitFiscalDocumentResponseSchema = z.discriminatedUnion('status', [
  authorizedResponseSchema,
  alreadyEmittedResponseSchema,
  skippedResponseSchema,
  rejectedResponseSchema,
]);
