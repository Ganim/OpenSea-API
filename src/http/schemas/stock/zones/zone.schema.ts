import { z } from 'zod';

// Code pattern schema
export const codePatternSchema = z.object({
  separator: z.string().max(1).default('-'),
  aisleDigits: z.number().int().min(1).max(2).default(1),
  shelfDigits: z.number().int().min(2).max(3).default(2),
  binLabeling: z.enum(['LETTERS', 'NUMBERS']).default('LETTERS'),
  binDirection: z.enum(['BOTTOM_UP', 'TOP_DOWN']).default('BOTTOM_UP'),
});

// Zone dimensions schema
export const zoneDimensionsSchema = z.object({
  aisleWidth: z.number().positive().optional(),
  aisleSpacing: z.number().positive().optional(),
  shelfWidth: z.number().positive().optional(),
  shelfHeight: z.number().positive().optional(),
  binHeight: z.number().positive().optional(),
});

export const aisleConfigSchema = z.object({
  aisleNumber: z.number().int().min(1).max(99),
  shelvesCount: z.number().int().min(1).max(999),
  binsPerShelf: z.number().int().min(1).max(26),
});

const defaultCodePattern = codePatternSchema.parse({});

// Zone structure schema
export const zoneStructureSchema = z
  .object({
    aisles: z.number().int().min(0).max(99),
    shelvesPerAisle: z.number().int().min(0).max(999),
    binsPerShelf: z.number().int().min(0).max(26),
    aisleConfigs: z.array(aisleConfigSchema).optional(),
    codePattern: codePatternSchema.optional().default(defaultCodePattern),
    dimensions: zoneDimensionsSchema.optional(),
  })
  .refine(
    (data) => {
      if (!data.aisleConfigs?.length) return true;

      const aisleNumbers = data.aisleConfigs.map(
        (config) => config.aisleNumber,
      );
      return new Set(aisleNumbers).size === aisleNumbers.length;
    },
    {
      message: 'Aisle numbers must be unique.',
      path: ['aisleConfigs'],
    },
  );

// Aisle position schema
export const aislePositionSchema = z.object({
  aisleNumber: z.number().int().positive(),
  x: z.number(),
  y: z.number(),
  rotation: z.number().refine((v) => [0, 90, 180, 270].includes(v), {
    message: 'Rotation must be 0, 90, 180, or 270',
  }),
  customWidth: z.number().positive().optional(),
});

// Layout annotation schema
export const layoutAnnotationSchema = z.object({
  id: z.string(),
  type: z.enum(['DOOR', 'PILLAR', 'WALL', 'LABEL', 'AREA']),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().optional(),
  label: z.string().optional(),
  color: z.string().optional(),
});

// Zone layout schema
export const zoneLayoutSchema = z.object({
  aislePositions: z.array(aislePositionSchema),
  canvasWidth: z.number().positive().default(1000),
  canvasHeight: z.number().positive().default(800),
  gridSize: z.number().positive().default(10),
  annotations: z.array(layoutAnnotationSchema).optional(),
});

// Request schemas
export const createZoneSchema = z.object({
  warehouseId: z.string().uuid(),
  code: z.string().min(2).max(5),
  name: z.string().min(1).max(128),
  description: z.string().max(500).optional(),
  structure: zoneStructureSchema.optional(),
  isActive: z.boolean().optional(),
});

export const updateZoneSchema = z.object({
  code: z.string().min(2).max(5).optional(),
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const configureZoneStructureSchema = z.object({
  structure: zoneStructureSchema.required(),
  regenerateBins: z.boolean().optional().default(true),
  forceRemoveOccupiedBins: z.boolean().optional().default(false),
});

export const previewZoneStructureSchema = z.object({
  structure: zoneStructureSchema.required(),
});

export const updateZoneLayoutSchema = z.object({
  layout: zoneLayoutSchema,
});

export const listZonesQuerySchema = z.object({
  warehouseId: z.string().uuid().optional(),
  activeOnly: z.coerce.boolean().optional(),
});

// Response schemas
export const zoneResponseSchema = z.object({
  id: z.string().uuid(),
  warehouseId: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  structure: zoneStructureSchema,
  layout: zoneLayoutSchema.nullable(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  binCount: z.number().optional(),
  totalBins: z.number().optional(),
});

export const zoneListResponseSchema = z.object({
  zones: z.array(zoneResponseSchema),
});

export const binPreviewSchema = z.object({
  address: z.string(),
  aisle: z.number(),
  shelf: z.number(),
  position: z.string(),
});

export const structurePreviewResponseSchema = z.object({
  totalBins: z.number(),
  totalShelves: z.number(),
  totalAisles: z.number(),
  sampleBins: z.array(binPreviewSchema),
});

export const configureStructureResponseSchema = z.object({
  zone: zoneResponseSchema,
  binsCreated: z.number(),
  binsPreserved: z.number(),
  binsUpdated: z.number(),
  binsDeleted: z.number(),
  binsBlocked: z.number(),
  itemsDetached: z.number(),
  blockedBins: z.array(
    z.object({
      binId: z.string().uuid(),
      address: z.string(),
      itemCount: z.number(),
    }),
  ),
});

export const reconfigurationPreviewResponseSchema = z.object({
  binsToPreserve: z.number(),
  binsToCreate: z.number(),
  binsToDeleteEmpty: z.number(),
  binsWithItems: z.array(
    z.object({
      binId: z.string().uuid(),
      address: z.string(),
      itemCount: z.number(),
    }),
  ),
  totalAffectedItems: z.number(),
  addressUpdates: z.number(),
  isFirstConfiguration: z.boolean(),
  totalNewBins: z.number(),
});

export const zoneItemStatsResponseSchema = z.object({
  totalBins: z.number(),
  activeBins: z.number(),
  blockedBins: z.number(),
  occupiedBins: z.number(),
  totalItems: z.number(),
  itemsInBlockedBins: z.number(),
});

// Types
export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;
export type ZoneStructureInput = z.infer<typeof zoneStructureSchema>;
export type ZoneLayoutInput = z.infer<typeof zoneLayoutSchema>;
export type ZoneResponse = z.infer<typeof zoneResponseSchema>;
