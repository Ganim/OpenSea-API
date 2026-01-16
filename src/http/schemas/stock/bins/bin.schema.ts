import { z } from 'zod';

// Request schemas
export const updateBinSchema = z.object({
  capacity: z.number().int().nonnegative().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const blockBinSchema = z.object({
  reason: z.string().min(1).max(256),
});

export const searchBinsQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const listBinsQuerySchema = z.object({
  zoneId: z.string().uuid().optional(),
  aisle: z.coerce.number().int().positive().optional(),
  shelf: z.coerce.number().int().positive().optional(),
  isActive: z.coerce.boolean().optional(),
  isBlocked: z.coerce.boolean().optional(),
  isEmpty: z.coerce.boolean().optional(),
  isFull: z.coerce.boolean().optional(),
  addressPattern: z.string().optional(),
});

// Response schemas
export const binResponseSchema = z.object({
  id: z.string().uuid(),
  zoneId: z.string().uuid(),
  address: z.string(),
  aisle: z.number(),
  shelf: z.number(),
  position: z.string(),
  capacity: z.number().nullable(),
  currentOccupancy: z.number(),
  isActive: z.boolean(),
  isBlocked: z.boolean(),
  blockReason: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  itemCount: z.number().optional(),
  occupancyPercentage: z.number().optional(),
  isAvailable: z.boolean().optional(),
});

export const binListResponseSchema = z.object({
  bins: z.array(binResponseSchema),
});

export const binOccupancyDataSchema = z.object({
  binId: z.string().uuid(),
  address: z.string(),
  aisle: z.number(),
  shelf: z.number(),
  position: z.string(),
  capacity: z.number().nullable(),
  currentOccupancy: z.number(),
  isBlocked: z.boolean(),
  itemCount: z.number(),
});

export const occupancyStatsSchema = z.object({
  totalBins: z.number(),
  emptyBins: z.number(),
  partialBins: z.number(),
  fullBins: z.number(),
  blockedBins: z.number(),
});

export const occupancyMapResponseSchema = z.object({
  occupancyData: z.array(binOccupancyDataSchema),
  stats: occupancyStatsSchema,
});

// Bin Detail Response (for GET /v1/bins/:id/detail)
export const binItemSchema = z.object({
  id: z.string().uuid(),
  itemCode: z.string(),
  sku: z.string(),
  productName: z.string(),
  variantName: z.string().nullable(),
  quantity: z.number(),
  addedAt: z.coerce.date(),
});

export const binDetailResponseSchema = z.object({
  bin: binResponseSchema,
  items: z.array(binItemSchema),
  zone: z.object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
  }),
  warehouse: z.object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
  }),
});

// Types
export type UpdateBinInput = z.infer<typeof updateBinSchema>;
export type BlockBinInput = z.infer<typeof blockBinSchema>;
export type BinResponse = z.infer<typeof binResponseSchema>;
export type OccupancyMapResponse = z.infer<typeof occupancyMapResponseSchema>;
export type BinDetailResponse = z.infer<typeof binDetailResponseSchema>;
export type BinItem = z.infer<typeof binItemSchema>;
