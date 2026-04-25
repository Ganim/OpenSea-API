import { z } from 'zod';

/**
 * Schemas for `POST /v1/pos/sales/:saleLocalUuid/ack` (Emporion Plan A —
 * Task 29). The endpoint is device-authenticated (shares
 * `verifyDeviceToken` with Tasks 26-28) and idempotent: subsequent calls
 * with the same `saleLocalUuid` return the original `ackedAt` timestamp
 * without overwriting it.
 */

export const acknowledgeSaleResultParamsSchema = z.object({
  saleLocalUuid: z.string().uuid(),
});

export const acknowledgeSaleResultSuccessResponseSchema = z.object({
  success: z.literal(true),
  ackedAt: z.date(),
});

export type AcknowledgeSaleResultParams = z.infer<
  typeof acknowledgeSaleResultParamsSchema
>;
