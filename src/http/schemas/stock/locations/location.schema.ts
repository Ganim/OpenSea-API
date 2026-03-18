import { z } from 'zod';

// ---- Health Summary ----

export const locationHealthSummaryResponseSchema = z.object({
  overallOccupancy: z.object({
    used: z.number(),
    total: z.number(),
    percentage: z.number(),
  }),
  blockedBins: z.object({
    count: z.number(),
  }),
  orphanedItems: z.object({
    count: z.number(),
  }),
  expiringItems: z.object({
    count: z.number(),
    thresholdDays: z.number(),
  }),
  inconsistencies: z.object({
    count: z.number(),
  }),
});

// ---- Search Item Location ----

export const searchItemLocationQuerySchema = z.object({
  q: z.string().min(2),
  limit: z.coerce.number().int().positive().max(20).optional(),
});

export const itemLocationResultSchema = z.object({
  itemId: z.string().uuid(),
  productName: z.string(),
  variantName: z.string().nullable(),
  sku: z.string().nullable(),
  barcode: z.string().nullable(),
  quantity: z.number(),
  bin: z
    .object({
      id: z.string().uuid(),
      address: z.string(),
    })
    .nullable(),
  warehouse: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
  }),
  zone: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
  }),
});

export const searchItemLocationResponseSchema = z.object({
  items: z.array(itemLocationResultSchema),
});

// ---- Setup Location ----

export const setupLocationBodySchema = z.object({
  warehouse: z.object({
    code: z.string().min(2).max(5),
    name: z.string().min(1).max(128),
    description: z.string().max(500).optional(),
  }),
  zones: z
    .array(
      z.object({
        code: z.string().min(2).max(5),
        name: z.string().min(1).max(128),
        structure: z
          .object({
            aisleConfigs: z.array(
              z.object({
                shelvesPerAisle: z.number().int().min(1).max(999),
                binsPerShelf: z.number().int().min(1).max(26),
              }),
            ),
          })
          .optional(),
      }),
    )
    .min(1),
});

export const setupLocationZoneResultSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  binCount: z.number(),
});

export const setupLocationResponseSchema = z.object({
  warehouse: z.object({
    id: z.string().uuid(),
    code: z.string(),
    name: z.string(),
    description: z.string().nullable(),
  }),
  zones: z.array(setupLocationZoneResultSchema),
  totalBinsCreated: z.number(),
});

// ---- Types ----

export type LocationHealthSummaryResponse = z.infer<
  typeof locationHealthSummaryResponseSchema
>;
export type SearchItemLocationQuery = z.infer<
  typeof searchItemLocationQuerySchema
>;
export type SearchItemLocationResponse = z.infer<
  typeof searchItemLocationResponseSchema
>;
export type SetupLocationBody = z.infer<typeof setupLocationBodySchema>;
export type SetupLocationResponse = z.infer<typeof setupLocationResponseSchema>;
