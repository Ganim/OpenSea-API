import { z } from 'zod';

// Request schemas
export const createWarehouseSchema = z.object({
  code: z.string().min(2).max(5),
  name: z.string().min(1).max(128),
  description: z.string().max(500).optional(),
  address: z.string().max(256).optional(),
  isActive: z.boolean().optional(),
});

export const updateWarehouseSchema = z.object({
  code: z.string().min(2).max(5).optional(),
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(500).nullable().optional(),
  address: z.string().max(256).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const listWarehousesQuerySchema = z.object({
  activeOnly: z.coerce.boolean().optional(),
});

// Response schemas
export const warehouseResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  address: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  zoneCount: z.number().optional(),
});

export const warehouseListResponseSchema = z.object({
  warehouses: z.array(warehouseResponseSchema),
});

// Types
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
export type WarehouseResponse = z.infer<typeof warehouseResponseSchema>;
