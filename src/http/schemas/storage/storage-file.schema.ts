import { z } from 'zod';

// ============================================================================
// Request Schemas
// ============================================================================

export const renameStorageFileSchema = z.object({
  name: z.string().min(1).max(256),
});

export const moveStorageFileSchema = z.object({
  folderId: z.string().uuid().nullable(),
});

// ============================================================================
// Query Schemas
// ============================================================================

export const listFilesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  folderId: z.string().uuid().optional(),
  fileType: z
    .enum([
      'IMAGE',
      'DOCUMENT',
      'SPREADSHEET',
      'PDF',
      'VIDEO',
      'AUDIO',
      'ARCHIVE',
      'OTHER',
    ])
    .optional(),
  entityType: z.string().max(64).optional(),
  entityId: z.string().max(128).optional(),
  search: z.string().max(256).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED', 'TRASHED']).optional(),
});

// ============================================================================
// Response Schemas
// ============================================================================

export const storageFileResponseSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  folderId: z.string().uuid().optional().nullable(),
  name: z.string(),
  originalName: z.string(),
  fileKey: z.string(),
  path: z.string(),
  mimeType: z.string(),
  size: z.number().int(),
  fileType: z.string(),
  thumbnailKey: z.string().optional().nullable(),
  status: z.string(),
  currentVersion: z.number().int(),
  entityType: z.string().optional().nullable(),
  entityId: z.string().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  uploadedBy: z.string(),
  isEncrypted: z.boolean(),
  isProtected: z.boolean(),
  isHidden: z.boolean(),
  versions: z
    .array(
      z.object({
        id: z.string().uuid(),
        fileId: z.string().uuid(),
        version: z.number().int(),
        fileKey: z.string(),
        size: z.number().int(),
        mimeType: z.string(),
        changeNote: z.string().optional().nullable(),
        uploadedBy: z.string(),
        createdAt: z.coerce.date(),
      }),
    )
    .optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
});

export const uploadFileResponseSchema = storageFileResponseSchema;

export const storageFileVersionResponseSchema = z.object({
  id: z.string().uuid(),
  fileId: z.string().uuid(),
  version: z.number().int(),
  fileKey: z.string(),
  size: z.number().int(),
  mimeType: z.string(),
  changeNote: z.string().optional().nullable(),
  uploadedBy: z.string(),
  createdAt: z.coerce.date(),
});

// ============================================================================
// Types
// ============================================================================

export type RenameStorageFileInput = z.infer<typeof renameStorageFileSchema>;
export type MoveStorageFileInput = z.infer<typeof moveStorageFileSchema>;
export type ListFilesQuery = z.infer<typeof listFilesQuerySchema>;
export type StorageFileResponse = z.infer<typeof storageFileResponseSchema>;
export type UploadFileResponse = z.infer<typeof uploadFileResponseSchema>;
export type StorageFileVersionResponse = z.infer<
  typeof storageFileVersionResponseSchema
>;
