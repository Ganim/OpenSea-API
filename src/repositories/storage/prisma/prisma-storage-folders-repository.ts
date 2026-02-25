import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import { storageFolderPrismaToDomain } from '@/mappers/storage';
import type { StorageFolder } from '@/entities/storage/storage-folder';
import type {
  CreateStorageFolderSchema,
  StorageFoldersRepository,
  UpdateStorageFolderSchema,
} from '../storage-folders-repository';

export class PrismaStorageFoldersRepository
  implements StorageFoldersRepository
{
  async create(data: CreateStorageFolderSchema): Promise<StorageFolder> {
    const folderDb = await prisma.storageFolder.create({
      data: {
        tenantId: data.tenantId,
        parentId: data.parentId ?? null,
        name: data.name,
        slug: data.slug,
        path: data.path,
        icon: data.icon ?? null,
        color: data.color ?? null,
        isSystem: data.isSystem ?? false,
        isFilter: data.isFilter ?? false,
        filterFileType: data.filterFileType ?? null,
        module: data.module ?? null,
        entityType: data.entityType ?? null,
        entityId: data.entityId ?? null,
        depth: data.depth ?? 0,
        createdBy: data.createdBy ?? null,
      },
    });

    return storageFolderPrismaToDomain(folderDb);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageFolder | null> {
    const folderDb = await prisma.storageFolder.findUnique({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!folderDb) return null;
    return storageFolderPrismaToDomain(folderDb);
  }

  async findByPath(
    path: string,
    tenantId: string,
  ): Promise<StorageFolder | null> {
    const folderDb = await prisma.storageFolder.findFirst({
      where: {
        path,
        tenantId,
        deletedAt: null,
      },
    });

    if (!folderDb) return null;
    return storageFolderPrismaToDomain(folderDb);
  }

  async findChildren(
    parentId: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageFolder[]> {
    const foldersDb = await prisma.storageFolder.findMany({
      where: {
        parentId: parentId.toString(),
        tenantId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });

    return foldersDb.map(storageFolderPrismaToDomain);
  }

  async findRootFolders(tenantId: string): Promise<StorageFolder[]> {
    const foldersDb = await prisma.storageFolder.findMany({
      where: {
        parentId: null,
        tenantId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });

    return foldersDb.map(storageFolderPrismaToDomain);
  }

  async findByEntityId(
    entityType: string,
    entityId: string,
    tenantId: string,
  ): Promise<StorageFolder | null> {
    const folderDb = await prisma.storageFolder.findFirst({
      where: {
        entityType,
        entityId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!folderDb) return null;
    return storageFolderPrismaToDomain(folderDb);
  }

  async findFilterFolders(tenantId: string): Promise<StorageFolder[]> {
    const foldersDb = await prisma.storageFolder.findMany({
      where: {
        isFilter: true,
        tenantId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });

    return foldersDb.map(storageFolderPrismaToDomain);
  }

  async findDescendants(
    folderId: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageFolder[]> {
    const parentFolder = await prisma.storageFolder.findUnique({
      where: { id: folderId.toString() },
    });

    if (!parentFolder) return [];

    const pathPrefix =
      parentFolder.path === '/' ? '/' : `${parentFolder.path}/`;

    const descendantsDb = await prisma.storageFolder.findMany({
      where: {
        tenantId,
        deletedAt: null,
        path: { startsWith: pathPrefix },
        id: { not: folderId.toString() },
      },
      orderBy: { depth: 'asc' },
    });

    return descendantsDb.map(storageFolderPrismaToDomain);
  }

  async update(data: UpdateStorageFolderSchema): Promise<StorageFolder | null> {
    const folderDb = await prisma.storageFolder.update({
      where: { id: data.id.toString() },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.path !== undefined && { path: data.path }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.depth !== undefined && { depth: data.depth }),
      },
    });

    return storageFolderPrismaToDomain(folderDb);
  }

  async softDelete(id: UniqueEntityID): Promise<void> {
    await prisma.storageFolder.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }

  async batchUpdatePaths(
    oldPathPrefix: string,
    newPathPrefix: string,
    tenantId: string,
  ): Promise<number> {
    const result = await prisma.$executeRaw`
      UPDATE "storage_folders"
      SET path = ${newPathPrefix} || substring(path, length(${oldPathPrefix}) + 1),
          "updated_at" = NOW()
      WHERE "tenant_id" = ${tenantId}
        AND "deleted_at" IS NULL
        AND path LIKE ${oldPathPrefix + '/%'}
    `;
    return result;
  }

  async batchUpdateDepths(
    pathPrefix: string,
    depthDelta: number,
    tenantId: string,
  ): Promise<number> {
    const result = await prisma.$executeRaw`
      UPDATE "storage_folders"
      SET depth = depth + ${depthDelta},
          "updated_at" = NOW()
      WHERE "tenant_id" = ${tenantId}
        AND "deleted_at" IS NULL
        AND path LIKE ${pathPrefix + '/%'}
    `;
    return result;
  }

  async batchSoftDelete(folderIds: string[]): Promise<number> {
    if (folderIds.length === 0) return 0;
    const result = await prisma.storageFolder.updateMany({
      where: { id: { in: folderIds } },
      data: { deletedAt: new Date() },
    });
    return result.count;
  }

  async countFiles(folderId: UniqueEntityID): Promise<number> {
    return prisma.storageFile.count({
      where: {
        folderId: folderId.toString(),
        deletedAt: null,
      },
    });
  }
}
