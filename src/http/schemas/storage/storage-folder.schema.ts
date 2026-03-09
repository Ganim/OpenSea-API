import { z } from 'zod';

// ============================================================================
// Request Schemas
// ============================================================================

export const createStorageFolderSchema = z.object({
  name: z.string().min(1).max(256),
  parentId: z.string().uuid().optional(),
  icon: z.string().max(64).optional(),
  color: z
    .string()
    .regex(
      /^#[0-9a-fA-F]{6}$/,
      'Color must be a valid hex color (e.g. #FF00AA)',
    )
    .optional(),
  module: z.string().max(64).optional(),
  entityType: z.string().max(64).optional(),
  entityId: z.string().max(128).optional(),
});

export const updateStorageFolderSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  icon: z.string().max(64).nullable().optional(),
  color: z
    .string()
    .regex(
      /^#[0-9a-fA-F]{6}$/,
      'Color must be a valid hex color (e.g. #FF00AA)',
    )
    .nullable()
    .optional(),
});

export const renameStorageFolderSchema = z.object({
  name: z.string().min(1).max(256),
});

export const moveStorageFolderSchema = z.object({
  parentId: z.string().uuid().nullable(),
});

// ============================================================================
// Query Schemas
// ============================================================================

export const folderContentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sort: z
    .enum(['name', 'createdAt', 'updatedAt', 'size'])
    .optional()
    .default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  search: z.string().max(256).optional(),
  viewAll: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((v) => v === 'true'),
  showHidden: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((v) => v === 'true'),
});

// ============================================================================
// Response Schemas
// ============================================================================

export const storageFolderResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  parentId: z.string().uuid().optional().nullable(),
  name: z.string(),
  slug: z.string(),
  path: z.string(),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isSystem: z.boolean(),
  isFilter: z.boolean(),
  filterFileType: z.string().optional().nullable(),
  module: z.string().optional().nullable(),
  entityType: z.string().optional().nullable(),
  entityId: z.string().optional().nullable(),
  depth: z.number().int(),
  createdBy: z.string().uuid().nullable(),
  isProtected: z.boolean(),
  isHidden: z.boolean(),
  fileCount: z.number().int().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

// ============================================================================
// Types
// ============================================================================

export type CreateStorageFolderInput = z.infer<
  typeof createStorageFolderSchema
>;
export type UpdateStorageFolderInput = z.infer<
  typeof updateStorageFolderSchema
>;
export type RenameStorageFolderInput = z.infer<
  typeof renameStorageFolderSchema
>;
export type MoveStorageFolderInput = z.infer<typeof moveStorageFolderSchema>;
export type FolderContentsQuery = z.infer<typeof folderContentsQuerySchema>;
export type StorageFolderResponse = z.infer<typeof storageFolderResponseSchema>;
