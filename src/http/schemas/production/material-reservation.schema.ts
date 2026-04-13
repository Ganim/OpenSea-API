import { z } from 'zod';

export const createMaterialReservationSchema = z.object({
  productionOrderId: z.string().min(1),
  materialId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantityReserved: z.number().positive(),
});

export const materialReservationResponseSchema = z.object({
  id: z.string(),
  productionOrderId: z.string(),
  materialId: z.string(),
  warehouseId: z.string(),
  quantityReserved: z.number(),
  quantityIssued: z.number(),
  status: z.enum(['RESERVED', 'PARTIALLY_ISSUED', 'FULLY_ISSUED', 'CANCELLED']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
