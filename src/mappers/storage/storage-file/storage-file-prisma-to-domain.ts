import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { StorageFile } from '@/entities/storage/storage-file';
import {
  StorageFileStatus,
  type StorageFileStatusValue,
} from '@/entities/storage/value-objects/storage-file-status';
import type {
  StorageFile as PrismaStorageFile,
  StorageFileVersion as PrismaStorageFileVersion,
} from '@prisma/generated/client.js';
import { storageFileVersionPrismaToDomain } from '../storage-file-version/storage-file-version-prisma-to-domain';

type StorageFileWithRelations = PrismaStorageFile & {
  versions?: PrismaStorageFileVersion[];
};

export function mapStorageFilePrismaToDomain(fileDb: StorageFileWithRelations) {
  return {
    id: new UniqueEntityID(fileDb.id),
    tenantId: new UniqueEntityID(fileDb.tenantId),
    folderId: fileDb.folderId ? new UniqueEntityID(fileDb.folderId) : null,
    name: fileDb.name,
    originalName: fileDb.originalName,
    fileKey: fileDb.fileKey,
    path: fileDb.path,
    size: fileDb.size,
    mimeType: fileDb.mimeType,
    fileType: fileDb.fileType,
    thumbnailKey: fileDb.thumbnailKey ?? null,
    status: StorageFileStatus.create(fileDb.status as StorageFileStatusValue),
    currentVersion: fileDb.currentVersion,
    entityType: fileDb.entityType ?? null,
    entityId: fileDb.entityId ?? null,
    expiresAt: fileDb.expiresAt ?? null,
    uploadedBy: fileDb.uploadedBy,
    versions: fileDb.versions
      ? fileDb.versions.map(storageFileVersionPrismaToDomain)
      : undefined,
    createdAt: fileDb.createdAt,
    updatedAt: fileDb.updatedAt ?? new Date(),
    deletedAt: fileDb.deletedAt ?? null,
  };
}

export function storageFilePrismaToDomain(
  fileDb: StorageFileWithRelations,
): StorageFile {
  return StorageFile.create(
    mapStorageFilePrismaToDomain(fileDb),
    new UniqueEntityID(fileDb.id),
  );
}
