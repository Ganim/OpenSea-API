import { z } from 'zod';

export const posTerminalModeEnum = z.enum([
  'FAST_CHECKOUT',
  'CONSULTIVE',
  'SELF_SERVICE',
  'EXTERNAL',
]);

export const posCashierModeEnum = z.enum(['INTEGRATED', 'SEPARATED']);

export const createPosTerminalSchema = z.object({
  name: z.string().min(1).max(128),
  deviceId: z.string().min(1).max(256),
  mode: posTerminalModeEnum,
  cashierMode: posCashierModeEnum.optional(),
  acceptsPendingOrders: z.boolean().optional(),
  warehouseId: z.string().uuid(),
  defaultPriceTableId: z.string().uuid().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

export const updatePosTerminalSchema = z.object({
  name: z.string().min(1).max(128).optional(),
  deviceId: z.string().min(1).max(256).optional(),
  mode: posTerminalModeEnum.optional(),
  cashierMode: posCashierModeEnum.optional(),
  acceptsPendingOrders: z.boolean().optional(),
  warehouseId: z.string().uuid().optional(),
  defaultPriceTableId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const posTerminalResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  name: z.string(),
  deviceId: z.string(),
  mode: z.string(),
  cashierMode: z.string(),
  acceptsPendingOrders: z.boolean(),
  warehouseId: z.string(),
  defaultPriceTableId: z.string().nullable(),
  isActive: z.boolean(),
  lastSyncAt: z.date().nullable(),
  lastOnlineAt: z.date().nullable(),
  settings: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});
