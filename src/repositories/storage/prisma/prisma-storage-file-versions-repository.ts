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

  async findByFileId(fileId: UniqueEntityID): Promise<StorageFileVersion[]> {
    const versionsDb = await prisma.storageFileVersion.findMany({
      where: { fileId: fileId.toString() },
      orderBy: { version: 'desc' },
    });

    return versionsDb.map(storageFileVersionPrismaToDomain);
  }

  async findByVersion(
    fileId: UniqueEntityID,
    version: number,
  ): Promise<StorageFileVersion | null> {
    const versionDb = await prisma.storageFileVersion.findFirst({
      where: {
        fileId: fileId.toString(),
        version,
      },
    });

    if (!versionDb) return null;
    return storageFileVersionPrismaToDomain(versionDb);
  }

  async findLatest(fileId: UniqueEntityID): Promise<StorageFileVersion | null> {
    const versionDb = await prisma.storageFileVersion.findFirst({
      where: { fileId: fileId.toString() },
      orderBy: { version: 'desc' },
    });

    if (!versionDb) return null;
    return storageFileVersionPrismaToDomain(versionDb);
  }
}
