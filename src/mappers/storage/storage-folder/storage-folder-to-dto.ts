import type { StorageFolder } from '@/entities/storage/storage-folder';

export interface StorageFolderDTO {
  id: string;
  tenantId: string;
  parentId: string | null;
  name: string;
  slug: string;
  path: string;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
  isFilter: boolean;
  filterFileType: string | null;
  module: string | null;
  entityType: string | null;
  entityId: string | null;
  depth: number;
  isProtected: boolean;
  isHidden: boolean;
  createdBy: string | null;
  fileCount?: number;
  createdAt: Date;
  updatedAt?: Date;
}

export function storageFolderToDTO(
  folder: StorageFolder,
  fileCount?: number,
): StorageFolderDTO {
  return {
    id: folder.folderId.toString(),
    tenantId: folder.tenantId.toString(),
    parentId: folder.parentId?.toString() ?? null,
    name: folder.name,
    slug: folder.slug,
    path: folder.path,
    icon: folder.icon,
    color: folder.color,
    isSystem: folder.isSystem,
    isFilter: folder.isFilter,
    filterFileType: folder.filterFileType,
    module: folder.module,
    entityType: folder.entityType,
    entityId: folder.entityId,
    depth: folder.depth,
    isProtected: folder.isProtected,
    isHidden: folder.isHidden,
    createdBy: folder.createdBy,
    fileCount,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  };
}
