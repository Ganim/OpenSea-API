/**
 * LABEL SCHEMAS
 */

import { z } from 'zod';

export const labelFormatEnum = z.enum(['qr', 'barcode']);
export type LabelFormat = z.infer<typeof labelFormatEnum>;

export const labelSizeEnum = z.enum(['small', 'medium', 'large']);
export type LabelSize = z.infer<typeof labelSizeEnum>;

export const generateLabelsSchema = z.object({
  binIds: z
    .array(z.uuid())
    .min(1, 'At least one bin ID is required')
    .max(500, 'Maximum 500 bins per request'),
  format: labelFormatEnum.default('qr'),
  size: labelSizeEnum.default('medium'),
  includeWarehouse: z.boolean().optional().default(true),
  includeZone: z.boolean().optional().default(true),
});

export type GenerateLabelsInput = z.infer<typeof generateLabelsSchema>;

export const generateLabelsResponseSchema = z.object({
  labels: z.array(
    z.object({
      binId: z.uuid(),
      address: z.string(),
      warehouseCode: z.string(),
      warehouseName: z.string(),
      zoneCode: z.string(),
      zoneName: z.string(),
      aisle: z.number(),
      shelf: z.number(),
      position: z.string(),
      codeData: z.string(),
    }),
  ),
  format: labelFormatEnum,
  size: labelSizeEnum,
  totalLabels: z.number(),
});

export type GenerateLabelsResponse = z.infer<
  typeof generateLabelsResponseSchema
>;

export const labelPreviewResponseSchema = z.object({
  binId: z.uuid(),
  address: z.string(),
  warehouseCode: z.string(),
  warehouseName: z.string(),
  zoneCode: z.string(),
  zoneName: z.string(),
  aisle: z.number(),
  shelf: z.number(),
  position: z.string(),
  codeData: z.string(),
  occupancy: z.object({
    current: z.number(),
    capacity: z.number().nullable(),
  }),
});

export type LabelPreviewResponse = z.infer<typeof labelPreviewResponseSchema>;

export const generateLabelsByZoneSchema = z.object({
  zoneId: z.uuid(),
  format: labelFormatEnum.default('qr'),
  size: labelSizeEnum.default('medium'),
  aisles: z.array(z.number().positive()).optional(),
  shelvesFrom: z.number().positive().optional(),
  shelvesTo: z.number().positive().optional(),
  positions: z.array(z.string().min(1).max(2)).optional(),
  includeWarehouse: z.boolean().optional().default(true),
  includeZone: z.boolean().optional().default(true),
});

export type GenerateLabelsByZoneInput = z.infer<
  typeof generateLabelsByZoneSchema
>;
