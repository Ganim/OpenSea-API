import { z } from 'zod';

export const registerPrintAgentBodySchema = z.object({
  name: z.string().min(1).max(128),
});

export const registerPrintAgentResponseSchema = z.object({
  agentId: z.string(),
});

export const listPrintAgentsResponseSchema = z.object({
  agents: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      status: z.enum(['ONLINE', 'OFFLINE', 'ERROR']),
      isPaired: z.boolean(),
      deviceLabel: z.string().nullable(),
      pairedAt: z.string().nullable(),
      lastSeenAt: z.string().nullable(),
      ipAddress: z.string().nullable(),
      hostname: z.string().nullable(),
      version: z.string().nullable(),
      printerCount: z.number(),
      createdAt: z.string(),
    }),
  ),
});

export const printAgentParamsSchema = z.object({
  id: z.string(),
});

export const getPairingCodeResponseSchema = z.object({
  code: z.string(),
  expiresAt: z.string(),
});

export const pairPrintAgentBodySchema = z.object({
  pairingCode: z.string().min(6).max(6),
  hostname: z.string().max(128),
});

export const pairPrintAgentResponseSchema = z.object({
  deviceToken: z.string(),
  agentId: z.string(),
  agentName: z.string(),
});
