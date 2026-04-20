import { z } from 'zod';

/**
 * Zod schemas for the Phase 5 punch-pin HTTP surface (Plan 05-05).
 *
 * Body validation enforces exactly 6 decimal digits so invalid PINs are
 * rejected at the edge (400) before reaching the use case. Use-case-level
 * checks are retained as a defense-in-depth.
 */

export const setPunchPinParamsSchema = z.object({
  id: z.string().uuid(),
});

export const setPunchPinBodySchema = z.object({
  pin: z
    .string()
    .regex(/^\d{6}$/, 'O PIN precisa ser uma string com exatamente 6 dígitos.'),
});

export const setPunchPinResponseSchema = z.object({
  setAt: z.string(),
});

export const unlockPunchPinParamsSchema = z.object({
  id: z.string().uuid(),
});

export const unlockPunchPinResponseSchema = z.object({
  unlockedAt: z.string(),
});
