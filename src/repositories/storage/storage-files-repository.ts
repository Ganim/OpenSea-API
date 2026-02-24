import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFile } from '@/entities/storage/storage-file';

export interface CreateStorageFileSchema {
  tenantId: string;
  folderId: string;
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
}

export interface UpdateStorageFileSchema {
  id: UniqueEntityID;
  name?: string;
  path?: string;
  folderId?: string;
  status?: string;
  currentVersion?: number;
  thumbnailKey?: string | null;
  fileKey?: string;
  size?: number;
  mimeType?: string;
}

export interface ListStorageFilesParams {
  tenantId: string;
  folderId?: string;
  fileType?: string;
  entityType?: string;
  entityId?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface FindManyStorageFilesResult {
  files: StorageFile[];
  total: number;
}

export interface StorageFilesRepository {
  create(data: CreateStorageFileSchema): Promise<StorageFile>;
  findById(id: UniqueEntityID, tenantId: string): Promise<StorageFile | null>;
  findByPath(path: string, tenantId: string): Promise<StorageFile | null>;
  findMany(params: ListStorageFilesParams): Promise<FindManyStorageFilesResult>;
  findByEntityId(
    entityType: string,
    entityId: string,
    tenantId: string,
  ): Promise<StorageFile[]>;
  findByFileType(fileType: string, tenantId: string): Promise<StorageFile[]>;
  findSoftDeleted(olderThan: Date, limit?: number): Promise<StorageFile[]>;
  update(data: UpdateStorageFileSchema): Promise<StorageFile | null>;
  softDelete(id: UniqueEntityID): Promise<void>;
  hardDelete(id: UniqueEntityID): Promise<void>;
  countByFolder(folderId: UniqueEntityID): Promise<number>;
  getTotalSize(tenantId: string): Promise<number>;
  countByTenant(tenantId: string): Promise<number>;
  countByFileType(tenantId: string): Promise<Record<string, number>>;
}
