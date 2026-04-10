import { z } from 'zod';

export const registerPrintAgentBodySchema = z.object({
  name: z.string().min(1).max(128),
});

export const registerPrintAgentResponseSchema = z.object({
  agentId: z.string(),
  apiKey: z.string(),
  message: z.string(),
});

export const listPrintAgentsResponseSchema = z.object({
  agents: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      status: z.enum(['ONLINE', 'OFFLINE', 'ERROR']),
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

export const regenerateKeyResponseSchema = z.object({
  apiKey: z.string(),
  message: z.string(),
});
