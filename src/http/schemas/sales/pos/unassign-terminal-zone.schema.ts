import { z } from 'zod';

export const unassignTerminalZoneParamsSchema = z.object({
  terminalId: z.string().uuid(),
  zoneId: z.string().uuid(),
});

export const unassignTerminalZoneResponseSchema = z.object({
  success: z.literal(true),
});
