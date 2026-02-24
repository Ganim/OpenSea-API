import { z } from 'zod';

// ============================================================================
// Response Schemas
// ============================================================================

export const storageStatsResponseSchema = z.object({
  totalFiles: z.number().int().nonnegative(),
  totalSize: z.number().int().nonnegative(),
  filesByType: z.record(z.string(), z.number().int().nonnegative()),
  usedStoragePercent: z.number().min(0).max(100),
});

// ============================================================================
// Types
// ============================================================================

export type StorageStatsResponse = z.infer<typeof storageStatsResponseSchema>;
