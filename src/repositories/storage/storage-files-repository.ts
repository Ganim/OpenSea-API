import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFile } from '@/entities/storage/storage-file';

export interface CreateStorageFileSchema {
  tenantId: string;
  folderId: string | null;
  name: string;
  originalName: string;
  fileKey: string;
  path: string;
  size: number;
  mimeType: string;
  fileType: string;
  thumbnailKey?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  expiresAt?: Date | null;
  uploadedBy: string;
  isEncrypted?: boolean;
}

export interface UpdateStorageFileSchema {
  id: UniqueEntityID;
  name?: string;
  path?: string;
  folderId?: string | null;
  status?: string;
  currentVersion?: number;
  thumbnailKey?: string | null;
  fileKey?: string;
  size?: number;
  mimeType?: string;
  isEncrypted?: boolean;
  isProtected?: boolean;
  protectionHash?: string | null;
  isHidden?: boolean;
}

export interface ListStorageFilesParams {
  tenantId: string;
  folderId?: string | null;
  fileType?: string;
  entityType?: string;
  entityId?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
  /** Filter files by uploader. Used for ownership-based visibility at root level. */
  uploadedBy?: string;
  /** When false (default), hidden files are excluded */
  showHidden?: boolean;
}

export interface FindManyStorageFilesResult {
  files: StorageFile[];
  total: number;
}

export interface StorageFilesRepository {
  create(data: CreateStorageFileSchema): Promise<StorageFile>;
  findById(id: UniqueEntityID, tenantId: string): Promise<StorageFile | null>;
  findByIds(ids: string[], tenantId: string): Promise<StorageFile[]>;
  findByPath(path: string, tenantId: string): Promise<StorageFile | null>;
  findMany(params: ListStorageFilesParams): Promise<FindManyStorageFilesResult>;
  findByEntityId(
    entityType: string,
    entityId: string,
    tenantId: string,
  ): Promise<StorageFile[]>;
  findByFileType(fileType: string, tenantId: string): Promise<StorageFile[]>;
  findExpired(tenantId: string, limit?: number): Promise<StorageFile[]>;
  findSoftDeleted(olderThan: Date, limit?: number): Promise<StorageFile[]>;
  update(data: UpdateStorageFileSchema): Promise<StorageFile | null>;
  softDelete(id: UniqueEntityID): Promise<void>;
  hardDelete(id: UniqueEntityID): Promise<void>;
  batchUpdateFilePaths(
    oldPathPrefix: string,
    newPathPrefix: string,
    tenantId: string,
  ): Promise<number>;
  softDeleteByFolderIds(folderIds: string[], tenantId: string): Promise<number>;
  countByFolder(folderId: UniqueEntityID): Promise<number>;
  getTotalSize(tenantId: string): Promise<number>;
  atomicCheckQuota(
    tenantId: string,
    additionalBytes: number,
    maxBytes: number,
  ): Promise<boolean>;
  countByTenant(tenantId: string): Promise<number>;
  countByFileType(tenantId: string): Promise<Record<string, number>>;
  // Trash methods
  findDeletedById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageFile | null>;
  findDeleted(
    tenantId: string,
    page?: number,
    limit?: number,
  ): Promise<{ files: StorageFile[]; total: number }>;
  restore(id: UniqueEntityID): Promise<void>;
  restoreByFolderIds(folderIds: string[], tenantId: string): Promise<number>;
  hardDeleteAllSoftDeleted(
    tenantId: string,
  ): Promise<{ count: number; fileKeys: string[] }>;
}
