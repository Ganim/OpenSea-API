import { z } from 'zod';

const RESOLVE_CONFLICT_ACTIONS = [
  'CANCEL_AND_REFUND',
  'FORCE_ADJUSTMENT',
  'SUBSTITUTE_ITEM',
] as const;

const POS_ORDER_CONFLICT_STATUS_VALUES = [
  'PENDING_RESOLUTION',
  'AUTO_SUBSTITUTED',
  'AUTO_ADJUSTED',
  'CANCELED_REFUNDED',
  'FORCED_ADJUSTMENT',
  'ITEM_SUBSTITUTED_MANUAL',
  'EXPIRED',
] as const;

const POS_ORDER_CONFLICT_REASON_VALUES = [
  'INSUFFICIENT_STOCK',
  'FRACTIONAL_NOT_ALLOWED',
  'BELOW_MIN_FRACTIONAL_SALE',
  'ITEM_NOT_FOUND',
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

const FISCAL_DOCUMENT_TYPE_VALUES = ['NFE', 'NFC_E', 'SAT_CFE', 'MFE'] as const;

/**
 * Body schema for `POST /v1/admin/pos/conflicts/:id/resolve`
 * (Emporion Plan A — Task 31).
 *
 * The discriminator is the `action` field. We use `.superRefine` to enforce
 * `substituteItemIds` cardinality (must be present and non-empty when
 * action === 'SUBSTITUTE_ITEM') because that constraint depends on the
 * conflict's `conflictDetails.length` which is only known server-side — the
 * use case re-checks it strictly. The schema layer just guards against the
 * obvious "I picked SUBSTITUTE_ITEM but forgot to send any ids" mistake.
 */
export const resolveConflictManuallyBodySchema = z
  .object({
    action: z.enum(RESOLVE_CONFLICT_ACTIONS),
    notes: z.string().trim().max(2000).optional(),
    substituteItemIds: z.array(z.string().uuid()).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === 'SUBSTITUTE_ITEM') {
      if (!value.substituteItemIds || value.substituteItemIds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['substituteItemIds'],
          message:
            'substituteItemIds is required and must contain at least one id when action is SUBSTITUTE_ITEM.',
        });
      }
    }
  });

export const resolveConflictManuallyParamsSchema = z.object({
  id: z.string().uuid(),
});

const conflictDetailSchema = z.object({
  itemId: z.string(),
  variantId: z.string(),
  requestedQuantity: z.number(),
  availableQuantity: z.number(),
  shortage: z.number(),
  reason: z.enum(POS_ORDER_CONFLICT_REASON_VALUES),
});

const conflictResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  saleLocalUuid: z.string(),
  orderId: z.string().nullable(),
  posTerminalId: z.string(),
  posSessionId: z.string().nullable(),
  posOperatorEmployeeId: z.string().nullable(),
  status: z.enum(POS_ORDER_CONFLICT_STATUS_VALUES),
  conflictDetails: z.array(conflictDetailSchema),
  resolutionDetails: z.record(z.string(), z.unknown()).nullable(),
  resolvedByUserId: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

// Order serialization: Date fields flow through Fastify's JSON serializer as
// ISO strings before Zod sees them, so the response schema accepts either
// shape. Using `z.union([z.string(), z.date()])` keeps the schema permissive
// while still validating non-date types correctly.
const dateOrIsoString = z.union([z.string(), z.date()]);

const orderResponseSchema = z.object({
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
  cancelledAt: dateOrIsoString.nullable(),
  cancelReason: z.string().nullable(),
  confirmedAt: dateOrIsoString.nullable(),
  originSource: z.enum(ORDER_ORIGIN_SOURCE_VALUES),
  posTerminalId: z.string().nullable(),
  posSessionId: z.string().nullable(),
  posOperatorEmployeeId: z.string().nullable(),
  saleLocalUuid: z.string().nullable(),
  fiscalDocumentType: z.enum(FISCAL_DOCUMENT_TYPE_VALUES).nullable(),
  createdAt: dateOrIsoString,
});

export const resolveConflictManuallyResponseSchema = z.object({
  conflict: conflictResponseSchema,
  order: orderResponseSchema,
});
