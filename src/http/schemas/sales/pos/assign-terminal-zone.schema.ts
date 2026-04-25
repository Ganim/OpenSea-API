import { z } from 'zod';

export const assignTerminalZoneParamsSchema = z.object({
  terminalId: z.string().uuid(),
  zoneId: z.string().uuid(),
});

export const assignTerminalZoneBodySchema = z.object({
  tier: z.enum(['PRIMARY', 'SECONDARY']),
});

export const posTerminalZoneResponseSchema = z.object({
  id: z.string(),
  terminalId: z.string(),
  zoneId: z.string(),
  tier: z.enum(['PRIMARY', 'SECONDARY']),
  tenantId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const assignTerminalZoneResponseSchema = z.object({
  terminalZone: posTerminalZoneResponseSchema,
});
