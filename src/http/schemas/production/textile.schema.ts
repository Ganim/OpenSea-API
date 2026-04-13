import { z } from 'zod';

// ============================================================================
// Textile Config
// ============================================================================

export const textileConfigResponseSchema = z.object({
  industryType: z.literal('TEXTILE'),
  enableSizeColorMatrix: z.boolean(),
  enableBundleTracking: z.boolean(),
  enableCutOrders: z.boolean(),
  enablePersonalization: z.boolean(),
  defaultSizes: z.array(z.string()),
  defaultBundleSize: z.number(),
  fabricConsumptionUnit: z.enum(['METERS', 'YARDS']),
  defaultFabricWastePercentage: z.number(),
  sizeConsumptionFactors: z.record(z.string(), z.number()),
});

// ============================================================================
// Size-Color Matrix (shared)
// ============================================================================

export const sizeColorMatrixSchema = z.object({
  sizes: z.array(z.string().min(1)).min(1, 'At least one size is required'),
  colors: z.array(z.string().min(1)).min(1, 'At least one color is required'),
  quantities: z.record(
    z.string(),
    z.record(z.string(), z.number().int().min(0)),
  ),
});

// ============================================================================
// Cut Plan
// ============================================================================

export const generateCutPlanSchema = z.object({
  matrix: sizeColorMatrixSchema,
  baseFabricConsumptionPerPiece: z
    .number()
    .positive('Base fabric consumption must be positive'),
  wastePercentage: z.number().min(0).max(50).optional().default(5),
  spreadingTableWidthPieces: z.number().int().positive().optional().default(50),
  sizeConsumptionFactors: z
    .record(z.string(), z.number().positive())
    .optional(),
});

const cutPlanSizeSummarySchema = z.object({
  size: z.string(),
  totalPieces: z.number(),
  estimatedFabricMeters: z.number(),
});

const cutPlanColorSummarySchema = z.object({
  color: z.string(),
  totalPieces: z.number(),
});

export const cutPlanResponseSchema = z.object({
  productionOrderId: z.string(),
  orderNumber: z.string(),
  totalPieces: z.number(),
  piecesPerSize: z.array(cutPlanSizeSummarySchema),
  piecesPerColor: z.array(cutPlanColorSummarySchema),
  totalEstimatedFabricMeters: z.number(),
  wastePercentage: z.number(),
  totalWithWaste: z.number(),
  layersNeeded: z.number(),
  matrix: sizeColorMatrixSchema,
});

// ============================================================================
// Bundle Tickets
// ============================================================================

export const generateBundleTicketsSchema = z.object({
  bundleSize: z.number().int().min(1).max(100).optional().default(15),
  sizes: z.array(z.string().min(1)).min(1, 'At least one size is required'),
  colors: z.array(z.string().min(1)).min(1, 'At least one color is required'),
  quantities: z.record(
    z.string(),
    z.record(z.string(), z.number().int().min(0)),
  ),
});

const bundleTicketSchema = z.object({
  bundleNumber: z.number(),
  size: z.string(),
  color: z.string(),
  quantity: z.number(),
  barcode: z.string(),
  productionOrderId: z.string(),
  orderNumber: z.string(),
});

export const bundleTicketsResponseSchema = z.object({
  productionOrderId: z.string(),
  orderNumber: z.string(),
  bundleSize: z.number(),
  totalBundles: z.number(),
  totalPieces: z.number(),
  bundles: z.array(bundleTicketSchema),
});
