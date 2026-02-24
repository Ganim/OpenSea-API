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
}

export interface StorageFoldersRepository {
  create(data: CreateStorageFolderSchema): Promise<StorageFolder>;
  findById(id: UniqueEntityID, tenantId: string): Promise<StorageFolder | null>;
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
  countFiles(folderId: UniqueEntityID): Promise<number>;
}
