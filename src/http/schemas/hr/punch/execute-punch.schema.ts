import { z } from 'zod';

/**
 * Zod schemas for the unified punch endpoint POST /v1/hr/punch/clock
 * (Plan 04-04, D-03). Named schemas per ADR-017.
 *
 * The endpoint accepts both authentication paths (JWT or
 * `x-punch-device-token`) — the body itself is identical. `employeeId`
 * is OPTIONAL here because the JWT path derives it from the token; the
 * use case layer enforces "required when device-token path" so the 400
 * message can be localized.
 */

export const executePunchBodySchema = z.object({
  employeeId: z.string().uuid().optional(),
  entryType: z
    .enum(['CLOCK_IN', 'CLOCK_OUT', 'BREAK_START', 'BREAK_END'])
    .optional(),
  timestamp: z.string().datetime().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  ipAddress: z.string().max(45).optional(),
  notes: z.string().max(500).optional(),
  // Idempotency key — the client passes the same value on retries.
  requestId: z.string().min(1).max(64).optional(),
});

export const executePunchResponseSchema = z.object({
  timeEntry: z.object({
    id: z.string(),
    employeeId: z.string(),
    entryType: z.string(),
    timestamp: z.date(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    ipAddress: z.string().nullable(),
    notes: z.string().nullable(),
    createdAt: z.date(),
  }),
  nsrNumber: z.number(),
  approvalsCreated: z.array(
    z.object({
      id: z.string().uuid(),
      reason: z.string(),
      details: z.record(z.string(), z.unknown()),
    }),
  ),
  idempotentHit: z.boolean(),
});

export const executePunchErrorSchema = z.object({ message: z.string() });
