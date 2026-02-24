import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { StorageFileVersion } from '@/entities/storage/storage-file-version';
import type { StorageFileVersion as PrismaStorageFileVersion } from '@prisma/generated/client.js';

export function mapStorageFileVersionPrismaToDomain(
  versionDb: PrismaStorageFileVersion,
) {
  return {
    id: new UniqueEntityID(versionDb.id),
    fileId: new UniqueEntityID(versionDb.fileId),
    version: versionDb.version,
    fileKey: versionDb.fileKey,
    size: versionDb.size,
    mimeType: versionDb.mimeType,
    changeNote: versionDb.changeNote ?? null,
    uploadedBy: versionDb.uploadedBy,
    createdAt: versionDb.createdAt,
  };
}

export function storageFileVersionPrismaToDomain(
  versionDb: PrismaStorageFileVersion,
): StorageFileVersion {
  return StorageFileVersion.create(
    mapStorageFileVersionPrismaToDomain(versionDb),
    new UniqueEntityID(versionDb.id),
  );
}
