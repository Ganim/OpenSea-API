import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { StorageFolder } from '@/entities/storage/storage-folder';
import type { StorageFolder as PrismaStorageFolder } from '@prisma/generated/client.js';

type StorageFolderWithRelations = PrismaStorageFolder & {
  children?: PrismaStorageFolder[];
};

export function mapStorageFolderPrismaToDomain(
  folderDb: StorageFolderWithRelations,
) {
  return {
    id: new UniqueEntityID(folderDb.id),
    tenantId: new UniqueEntityID(folderDb.tenantId),
    parentId: folderDb.parentId ? new UniqueEntityID(folderDb.parentId) : null,
    name: folderDb.name,
    slug: folderDb.slug,
    path: folderDb.path,
    icon: folderDb.icon ?? null,
    color: folderDb.color ?? null,
    isSystem: folderDb.isSystem,
    isFilter: folderDb.isFilter,
    filterFileType: folderDb.filterFileType ?? null,
    module: folderDb.module ?? null,
    entityType: folderDb.entityType ?? null,
    entityId: folderDb.entityId ?? null,
    depth: folderDb.depth,
    isProtected: folderDb.isProtected,
    protectionHash: folderDb.protectionHash ?? null,
    isHidden: folderDb.isHidden,
    createdBy: folderDb.createdBy ?? null,
    createdAt: folderDb.createdAt,
    updatedAt: folderDb.updatedAt ?? undefined,
    deletedAt: folderDb.deletedAt ?? undefined,
  };
}

export function storageFolderPrismaToDomain(
  folderDb: StorageFolderWithRelations,
): StorageFolder {
  return StorageFolder.create(
    mapStorageFolderPrismaToDomain(folderDb),
    new UniqueEntityID(folderDb.id),
  );
}
