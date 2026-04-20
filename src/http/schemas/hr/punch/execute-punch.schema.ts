import { z } from 'zod';

/**
 * Zod schemas for the unified punch endpoint POST /v1/hr/punch/clock
 * (Plan 04-04, D-03; Phase 5 / Plan 05-07 adds kiosk fields).
 * Named schemas per ADR-017.
 *
 * Auth modes accepted (subset per request):
 *   - JWT (funcionário bate pelo próprio app/web)
 *   - `x-punch-device-token` header (kiosk / PWA público / leitor biométrico)
 *
 * Phase 5 kiosk extensions:
 *   - `qrToken`        — 32-byte hex scanned from the employee's crachá (D-15)
 *   - `pin` + `matricula` — PIN fallback, 6 digits (D-08)
 *   - `faceEmbedding`  — 128 floats from face-api.js (D-01/D-03)
 *   - `liveness`       — kiosk-side signals, persisted as-is for audit (D-04)
 *
 * The superRefine below enforces `matricula` is present when `pin` is
 * (the pair is the only way to identify an employee via PIN per D-10).
 */

export const executePunchBodySchema = z
  .object({
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

    // ─── Phase 5 (Plan 05-07) kiosk extensions ────────────────────────────
    qrToken: z
      .string()
      .regex(
        /^[a-f0-9]{64}$/,
        'qrToken deve ser uma string hexadecimal de 64 caracteres.',
      )
      .optional(),
    pin: z
      .string()
      .regex(/^\d{6}$/, 'PIN deve conter exatamente 6 dígitos numéricos.')
      .optional(),
    matricula: z.string().min(1).max(32).optional(),
    faceEmbedding: z
      .array(z.number())
      .length(128, 'faceEmbedding deve conter exatamente 128 números.')
      .optional(),
    liveness: z
      .object({
        blinkDetected: z.boolean(),
        trackingFrames: z.number().int().nonnegative(),
        durationMs: z.number().int().nonnegative(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.pin && !data.matricula) {
      ctx.addIssue({
        code: 'custom',
        path: ['matricula'],
        message: 'matricula obrigatória quando PIN é fornecido.',
      });
    }
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

/**
 * Error envelope for the unified punch endpoint.
 *
 * Phase 5 (Plan 05-07) piggybacks on the envelope to surface kiosk-friendly
 * discriminators so the UI can switch on `code` without parsing the
 * user-facing `message`:
 *   - `INVALID_QR_TOKEN`         → 400
 *   - `PIN_INVALID`              → 400 + attemptsRemaining (0..4 or null)
 *   - `PIN_LOCKED`               → 423 + lockedUntil (ISO 8601)
 *   - `FACE_ENROLLMENT_REQUIRED` → 412
 *
 * `code` is typed as a plain string (NOT an enum) because the global
 * `errorHandler` mapping emits other codes (ErrorCodes.UNAUTHORIZED,
 * ErrorCodes.FORBIDDEN, etc.) that also flow through this schema when
 * the middleware layer throws before the handler runs.
 */
export const executePunchErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  attemptsRemaining: z.number().int().min(0).nullable().optional(),
  lockedUntil: z.string().datetime().optional(),
  requestId: z.string().optional(),
});
