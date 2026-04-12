import { z } from 'zod';

export const posTerminalModeEnum = z.enum([
  'SALES_ONLY',
  'SALES_WITH_CHECKOUT',
  'CASHIER',
  'TOTEM',
]);

export const createPosTerminalSchema = z.object({
  terminalName: z.string().min(1).max(128),
  mode: posTerminalModeEnum,
  acceptsPendingOrders: z.boolean().optional(),
  warehouseIds: z.array(z.string().uuid()).optional(),
  defaultPriceTableId: z.string().uuid().optional().nullable(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const updatePosTerminalSchema = z.object({
  terminalName: z.string().min(1).max(128).optional(),
  mode: posTerminalModeEnum.optional(),
  acceptsPendingOrders: z.boolean().optional(),
  defaultPriceTableId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const posTerminalResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  terminalName: z.string(),
  terminalCode: z.string(),
  totemCode: z.string().nullable(),
  mode: posTerminalModeEnum,
  acceptsPendingOrders: z.boolean(),
  requiresSession: z.boolean(),
  allowAnonymous: z.boolean(),
  systemUserId: z.string().nullable(),
  defaultPriceTableId: z.string().nullable(),
  isActive: z.boolean(),
  hasPairing: z.boolean().optional(),
  deletedAt: z.string().nullable(),
  lastSyncAt: z.string().nullable(),
  lastOnlineAt: z.string().nullable(),
  settings: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const posDevicePairingResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  terminalId: z.string(),
  deviceLabel: z.string(),
  pairedAt: z.string(),
  lastSeenAt: z.string().nullable(),
  pairedByUserId: z.string(),
  revokedAt: z.string().nullable(),
  revokedByUserId: z.string().nullable(),
  revokedReason: z.string().nullable(),
  isActive: z.boolean(),
});
