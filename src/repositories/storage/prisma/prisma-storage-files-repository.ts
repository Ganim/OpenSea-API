import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import { storageFilePrismaToDomain } from '@/mappers/storage';
import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageFileStatus as PrismaStorageFileStatus } from '@prisma/generated/client.js';
import type {
  CreateStorageFileSchema,
  FindManyStorageFilesResult,
  ListStorageFilesParams,
  StorageFilesRepository,
  UpdateStorageFileSchema,
} from '../storage-files-repository';

export class PrismaStorageFilesRepository implements StorageFilesRepository {
  async create(data: CreateStorageFileSchema): Promise<StorageFile> {
    const fileDb = await prisma.storageFile.create({
      data: {
        tenantId: data.tenantId,
        folderId: data.folderId,
        name: data.name,
        originalName: data.originalName,
        fileKey: data.fileKey,
        path: data.path,
        size: data.size,
        mimeType: data.mimeType,
        fileType: data.fileType,
        thumbnailKey: data.thumbnailKey ?? null,
        entityType: data.entityType ?? null,
        entityId: data.entityId ?? null,
        expiresAt: data.expiresAt ?? null,
        uploadedBy: data.uploadedBy,
      },
    });

    return storageFilePrismaToDomain(fileDb);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageFile | null> {
    const fileDb = await prisma.storageFile.findUnique({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!fileDb) return null;
    return storageFilePrismaToDomain(fileDb);
  }

  async findByPath(
    path: string,
    tenantId: string,
  ): Promise<StorageFile | null> {
    const fileDb = await prisma.storageFile.findFirst({
      where: {
        path,
        tenantId,
        deletedAt: null,
      },
    });

    if (!fileDb) return null;
    return storageFilePrismaToDomain(fileDb);
  }

  async findMany(
    params: ListStorageFilesParams,
  ): Promise<FindManyStorageFilesResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const whereClause = this.buildWhereClause(params);

    const [filesDb, total] = await prisma.$transaction([
      prisma.storageFile.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.storageFile.count({
        where: whereClause,
      }),
    ]);

    const files = filesDb.map(storageFilePrismaToDomain);
    return { files, total };
  }

  async findByEntityId(
    entityType: string,
    entityId: string,
    tenantId: string,
  ): Promise<StorageFile[]> {
    const filesDb = await prisma.storageFile.findMany({
      where: {
        entityType,
        entityId,
        tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return filesDb.map(storageFilePrismaToDomain);
  }

  async findByFileType(
    fileType: string,
    tenantId: string,
  ): Promise<StorageFile[]> {
    const filesDb = await prisma.storageFile.findMany({
      where: {
        fileType,
        tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return filesDb.map(storageFilePrismaToDomain);
  }

  async findExpired(tenantId: string, limit = 100): Promise<StorageFile[]> {
    const filesDb = await prisma.storageFile.findMany({
      where: {
        tenantId,
        expiresAt: { lt: new Date() },
        status: 'ACTIVE' as PrismaStorageFileStatus,
        deletedAt: null,
      },
      take: limit,
      orderBy: { expiresAt: 'asc' },
    });

    return filesDb.map(storageFilePrismaToDomain);
  }

  async update(data: UpdateStorageFileSchema): Promise<StorageFile | null> {
    const fileDb = await prisma.storageFile.update({
      where: { id: data.id.toString() },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.path !== undefined && { path: data.path }),
        ...(data.folderId !== undefined && { folderId: data.folderId }),
        ...(data.status !== undefined && {
          status: data.status as PrismaStorageFileStatus,
        }),
        ...(data.currentVersion !== undefined && {
          currentVersion: data.currentVersion,
        }),
        ...(data.thumbnailKey !== undefined && {
          thumbnailKey: data.thumbnailKey,
        }),
        ...(data.fileKey !== undefined && { fileKey: data.fileKey }),
        ...(data.size !== undefined && { size: data.size }),
        ...(data.mimeType !== undefined && { mimeType: data.mimeType }),
      },
    });

    return storageFilePrismaToDomain(fileDb);
  }

  async findSoftDeleted(
    olderThan: Date,
    limit?: number,
  ): Promise<StorageFile[]> {
    const filesDb = await prisma.storageFile.findMany({
      where: {
        deletedAt: { not: null, lt: olderThan },
      },
      take: limit ?? 1000,
      orderBy: { deletedAt: 'asc' },
    });

    return filesDb.map(storageFilePrismaToDomain);
  }

  async softDelete(id: UniqueEntityID): Promise<void> {
    await prisma.storageFile.update({
      where: { id: id.toString() },
      data: {
        deletedAt: new Date(),
        status: 'DELETED' as PrismaStorageFileStatus,
      },
    });
  }

  async hardDelete(id: UniqueEntityID): Promise<void> {
    await prisma.storageFile.delete({
      where: { id: id.toString() },
    });
  }

  async batchUpdateFilePaths(
    oldPathPrefix: string,
    newPathPrefix: string,
    tenantId: string,
  ): Promise<number> {
    const result = await prisma.$executeRaw`
      UPDATE "storage_files"
      SET path = ${newPathPrefix} || substring(path, length(${oldPathPrefix}) + 1),
          "updated_at" = NOW()
      WHERE "tenant_id" = ${tenantId}
        AND "deleted_at" IS NULL
        AND path LIKE ${oldPathPrefix + '/%'}
    `;
    return result;
  }

  async softDeleteByFolderIds(
    folderIds: string[],
    tenantId: string,
  ): Promise<number> {
    if (folderIds.length === 0) return 0;
    const result = await prisma.storageFile.updateMany({
      where: {
        folderId: { in: folderIds },
        tenantId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        status: 'DELETED' as PrismaStorageFileStatus,
      },
    });
    return result.count;
  }

  async countByFolder(folderId: UniqueEntityID): Promise<number> {
    return prisma.storageFile.count({
      where: {
        folderId: folderId.toString(),
        deletedAt: null,
      },
    });
  }

  async getTotalSize(tenantId: string): Promise<number> {
    const aggregateResult = await prisma.storageFile.aggregate({
      where: {
        tenantId,
        deletedAt: null,
      },
      _sum: {
        size: true,
      },
    });

    return aggregateResult._sum.size ?? 0;
  }

  async countByTenant(tenantId: string): Promise<number> {
    return prisma.storageFile.count({
      where: {
        tenantId,
        deletedAt: null,
      },
    });
  }

  async countByFileType(tenantId: string): Promise<Record<string, number>> {
    const groupedFiles = await prisma.storageFile.groupBy({
      by: ['fileType'],
      where: {
        tenantId,
        deletedAt: null,
      },
      _count: {
        fileType: true,
      },
    });

    const filesByType: Record<string, number> = {};
    for (const group of groupedFiles) {
      filesByType[group.fileType] = group._count.fileType;
    }
    return filesByType;
  }

  private buildWhereClause(params: ListStorageFilesParams) {
    const whereClause: Record<string, unknown> = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    if (params.folderId) {
      whereClause.folderId = params.folderId;
    }

    if (params.fileType) {
      whereClause.fileType = params.fileType;
    }

    if (params.entityType) {
      whereClause.entityType = params.entityType;
    }

    if (params.entityId) {
      whereClause.entityId = params.entityId;
    }

    if (params.status) {
      whereClause.status = params.status as PrismaStorageFileStatus;
    }

    if (params.search) {
      whereClause.name = {
        contains: params.search,
        mode: 'insensitive',
      };
    }

    return whereClause;
  }
}
