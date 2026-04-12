import { z } from 'zod';

export const printerTypeSchema = z.enum(['THERMAL', 'INKJET', 'LABEL']);

export const printerConnectionSchema = z.enum([
  'USB',
  'NETWORK',
  'BLUETOOTH',
  'SERIAL',
]);

export const registerPrinterBodySchema = z.object({
  name: z.string().min(1).max(128),
  type: printerTypeSchema,
  connection: printerConnectionSchema,
  ipAddress: z.string().max(15).optional(),
  port: z.number().int().min(1).max(65535).optional(),
  deviceId: z.string().max(128).optional(),
  bluetoothAddress: z.string().max(20).optional(),
  paperWidth: z.union([z.literal(80), z.literal(58)]).optional(),
  isDefault: z.boolean().optional(),
});

export const registerPrinterResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.literal('active'),
});

export const listPrintersResponseSchema = z.object({
  printers: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: printerTypeSchema,
      connection: printerConnectionSchema,
      ipAddress: z.string().nullable(),
      port: z.number().nullable(),
      deviceId: z.string().nullable(),
      bluetoothAddress: z.string().nullable(),
      paperWidth: z.number(),
      isDefault: z.boolean(),
      isActive: z.boolean(),
      isHidden: z.boolean(),
      status: z.enum(['ONLINE', 'OFFLINE', 'BUSY', 'ERROR', 'UNKNOWN']),
      lastSeenAt: z.string().nullable(),
      agentId: z.string().nullable(),
      agentName: z.string().nullable(),
      osName: z.string().nullable(),
    }),
  ),
});

export const deletePrinterParamsSchema = z.object({
  id: z.string(),
});
