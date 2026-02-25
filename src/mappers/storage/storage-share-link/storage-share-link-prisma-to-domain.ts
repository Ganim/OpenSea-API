import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { StorageShareLink } from '@/entities/storage/storage-share-link';
import type { StorageShareLink as PrismaStorageShareLink } from '@prisma/generated/client.js';

export function mapStorageShareLinkPrismaToDomain(
  shareLinkDb: PrismaStorageShareLink,
) {
  return {
    id: new UniqueEntityID(shareLinkDb.id),
    tenantId: new UniqueEntityID(shareLinkDb.tenantId),
    fileId: new UniqueEntityID(shareLinkDb.fileId),
    token: shareLinkDb.token,
    expiresAt: shareLinkDb.expiresAt ?? null,
    password: shareLinkDb.password ?? null,
    maxDownloads: shareLinkDb.maxDownloads ?? null,
    downloadCount: shareLinkDb.downloadCount,
    isActive: shareLinkDb.isActive,
    createdBy: shareLinkDb.createdBy,
    createdAt: shareLinkDb.createdAt,
    updatedAt: shareLinkDb.updatedAt,
  };
}

export function storageShareLinkPrismaToDomain(
  shareLinkDb: PrismaStorageShareLink,
): StorageShareLink {
  return StorageShareLink.create(
    mapStorageShareLinkPrismaToDomain(shareLinkDb),
    new UniqueEntityID(shareLinkDb.id),
  );
}
