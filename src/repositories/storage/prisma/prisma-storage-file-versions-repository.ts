import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import { storageFileVersionPrismaToDomain } from '@/mappers/storage';
import type { StorageFileVersion } from '@/entities/storage/storage-file-version';
import type {
  CreateStorageFileVersionSchema,
  StorageFileVersionsRepository,
} from '../storage-file-versions-repository';

export class PrismaStorageFileVersionsRepository
  implements StorageFileVersionsRepository
{
  async create(
    data: CreateStorageFileVersionSchema,
  ): Promise<StorageFileVersion> {
    const versionDb = await prisma.storageFileVersion.create({
      data: {
        fileId: data.fileId,
        version: data.version,
        fileKey: data.fileKey,
        size: data.size,
        mimeType: data.mimeType,
        changeNote: data.changeNote ?? null,
        uploadedBy: data.uploadedBy,
      },
    });

    return storageFileVersionPrismaToDomain(versionDb);
  }

  async findByFileId(
    fileId: UniqueEntityID,
    tenantId?: string,
  ): Promise<StorageFileVersion[]> {
    const versionsDb = await prisma.storageFileVersion.findMany({
      where: {
        fileId: fileId.toString(),
        ...(tenantId && { file: { tenantId } }),
      },
      orderBy: { version: 'desc' },
    });

    return versionsDb.map(storageFileVersionPrismaToDomain);
  }

  async findByVersion(
    fileId: UniqueEntityID,
    version: number,
    tenantId?: string,
  ): Promise<StorageFileVersion | null> {
    const versionDb = await prisma.storageFileVersion.findFirst({
      where: {
        fileId: fileId.toString(),
        version,
        ...(tenantId && { file: { tenantId } }),
      },
    });

    if (!versionDb) return null;
    return storageFileVersionPrismaToDomain(versionDb);
  }

  async findLatest(
    fileId: UniqueEntityID,
    tenantId?: string,
  ): Promise<StorageFileVersion | null> {
    const versionDb = await prisma.storageFileVersion.findFirst({
      where: {
        fileId: fileId.toString(),
        ...(tenantId && { file: { tenantId } }),
      },
      orderBy: { version: 'desc' },
    });

    if (!versionDb) return null;
    return storageFileVersionPrismaToDomain(versionDb);
  }

  async deleteByFileId(fileId: UniqueEntityID): Promise<void> {
    await prisma.storageFileVersion.deleteMany({
      where: { fileId: fileId.toString() },
    });
  }

  async findByFileIds(fileIds: UniqueEntityID[]): Promise<StorageFileVersion[]> {
    if (fileIds.length === 0) return [];
    const versionsDb = await prisma.storageFileVersion.findMany({
      where: {
        fileId: { in: fileIds.map((id) => id.toString()) },
      },
      orderBy: { version: 'desc' },
    });
    return versionsDb.map(storageFileVersionPrismaToDomain);
  }

  async deleteByFileIds(fileIds: UniqueEntityID[]): Promise<void> {
    if (fileIds.length === 0) return;
    await prisma.storageFileVersion.deleteMany({
      where: { fileId: { in: fileIds.map((id) => id.toString()) } },
    });
  }
}
