import { z } from 'zod';

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

/**
 * Query schema for `GET /v1/admin/pos/conflicts` (Emporion Plan A — Task 30).
 *
 * - `status` accepts the same key repeated multiple times (Fastify parses
 *   that into a string[]) or a single string. We normalize via
 *   `z.union([..., z.array(...)])` so both wire shapes flow through.
 * - `terminalId` and `operatorEmployeeId` are UUIDs to fail fast on bad
 *   input.
 * - `page` defaults to `1`, `limit` defaults to `20` and is capped at `100`.
 */
export const listConflictsQuerySchema = z.object({
  status: z
    .union([
      z.enum(POS_ORDER_CONFLICT_STATUS_VALUES),
      z.array(z.enum(POS_ORDER_CONFLICT_STATUS_VALUES)),
    ])
    .optional(),
  terminalId: z.string().uuid().optional(),
  operatorEmployeeId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const conflictDetailSchema = z.object({
  itemId: z.string(),
  variantId: z.string(),
  requestedQuantity: z.number(),
  availableQuantity: z.number(),
  shortage: z.number(),
  reason: z.enum(POS_ORDER_CONFLICT_REASON_VALUES),
});

export const conflictListItemSchema = z.object({
  id: z.string(),
  saleLocalUuid: z.string(),
  status: z.enum(POS_ORDER_CONFLICT_STATUS_VALUES),
  posTerminalId: z.string(),
  terminalName: z.string(),
  posSessionId: z.string().nullable(),
  posOperatorEmployeeId: z.string().nullable(),
  operatorName: z.string(),
  operatorShortId: z.string(),
  conflictDetails: z.array(conflictDetailSchema),
  resolvedByUserId: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const listConflictsResponseSchema = z.object({
  data: z.array(conflictListItemSchema),
  meta: z.object({
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    pages: z.number().int().nonnegative(),
  }),
});
