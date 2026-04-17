/**
 * Period-lock shared schemas (P2-49).
 *
 * Before this file existed, each of the three period-lock controllers
 * redeclared its own inline `periodLockSchema`. They all agreed on
 * `z.coerce.date()` (so the OpenAPI consumer sees ISO-8601 strings that
 * decode into a JS Date), but the duplication was fragile — the list
 * endpoint could drift from the create endpoint. Pinning the shape in
 * one place keeps create/list/delete in sync and leaves a single place
 * to flip to `.transform(d => d.toISOString())` if we ever decide to
 * serialize period-lock responses as raw strings.
 */

import { z } from 'zod';

/**
 * Response payload for a single finance period lock.
 */
export const periodLockSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  year: z.number().int(),
  month: z.number().int(),
  lockedBy: z.string(),
  lockedAt: z.coerce.date(),
  releasedBy: z.string().nullable(),
  releasedAt: z.coerce.date().nullable(),
  reason: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type PeriodLock = z.infer<typeof periodLockSchema>;
