import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFolder } from '@/entities/storage/storage-folder';

export interface CreateStorageFolderSchema {
  tenantId: string;
  parentId?: string | null;
  name: string;
  slug: string;
  path: string;
  icon?: string | null;
  color?: string | null;
  isSystem?: boolean;
  isFilter?: boolean;
  filterFileType?: string | null;
  module?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  depth?: number;
  createdBy?: string | null;
}

export interface UpdateStorageFolderSchema {
  id: UniqueEntityID;
  name?: string;
  slug?: string;
  path?: string;
  icon?: string | null;
  color?: string | null;
  parentId?: string | null;
  depth?: number;
  isProtected?: boolean;
  protectionHash?: string | null;
  isHidden?: boolean;
}

export interface StorageFoldersRepository {
  create(data: CreateStorageFolderSchema): Promise<StorageFolder>;
  findById(id: UniqueEntityID, tenantId: string): Promise<StorageFolder | null>;
  findByIds(ids: string[], tenantId: string): Promise<StorageFolder[]>;
  findByPath(path: string, tenantId: string): Promise<StorageFolder | null>;
  findChildren(
    parentId: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageFolder[]>;
  findRootFolders(tenantId: string): Promise<StorageFolder[]>;
  findByEntityId(
    entityType: string,
    entityId: string,
    tenantId: string,
  ): Promise<StorageFolder | null>;
  findFilterFolders(tenantId: string): Promise<StorageFolder[]>;
  findDescendants(
    folderId: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageFolder[]>;
  update(data: UpdateStorageFolderSchema): Promise<StorageFolder | null>;
  softDelete(id: UniqueEntityID): Promise<void>;
  batchUpdatePaths(
    oldPathPrefix: string,
    newPathPrefix: string,
    tenantId: string,
  ): Promise<number>;
  batchUpdateDepths(
    pathPrefix: string,
    depthDelta: number,
    tenantId: string,
  ): Promise<number>;
  batchSoftDelete(folderIds: string[], tenantId: string): Promise<number>;
  countFiles(folderId: UniqueEntityID): Promise<number>;
  search(
    tenantId: string,
    query: string,
    limit?: number,
  ): Promise<StorageFolder[]>;
  // Trash methods
  findDeletedById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageFolder | null>;
  findDeleted(
    tenantId: string,
    page?: number,
    limit?: number,
  ): Promise<{ folders: StorageFolder[]; total: number }>;
  restore(id: UniqueEntityID): Promise<void>;
  batchRestore(folderIds: string[]): Promise<number>;
  hardDeleteAllSoftDeleted(tenantId: string): Promise<number>;
}
