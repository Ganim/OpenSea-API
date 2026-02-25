import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageShareLink } from '@/entities/storage/storage-share-link';
import { prisma } from '@/lib/prisma';
import { storageShareLinkPrismaToDomain } from '@/mappers/storage';
import type {
  CreateShareLinkSchema,
  StorageShareLinksRepository,
} from '../storage-share-links-repository';

export class PrismaStorageShareLinksRepository
  implements StorageShareLinksRepository
{
  async create(data: CreateShareLinkSchema): Promise<StorageShareLink> {
    const shareLinkDb = await prisma.storageShareLink.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        fileId: data.fileId,
        token: data.token,
        expiresAt: data.expiresAt ?? null,
        password: data.password ?? null,
        maxDownloads: data.maxDownloads ?? null,
        createdBy: data.createdBy,
      },
    });

    return storageShareLinkPrismaToDomain(shareLinkDb);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageShareLink | null> {
    const shareLinkDb = await prisma.storageShareLink.findUnique({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!shareLinkDb) return null;
    return storageShareLinkPrismaToDomain(shareLinkDb);
  }

  async findByToken(token: string): Promise<StorageShareLink | null> {
    const shareLinkDb = await prisma.storageShareLink.findUnique({
      where: { token },
    });

    if (!shareLinkDb) return null;
    return storageShareLinkPrismaToDomain(shareLinkDb);
  }

  async findByFileId(
    fileId: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageShareLink[]> {
    const shareLinksDb = await prisma.storageShareLink.findMany({
      where: {
        fileId: fileId.toString(),
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return shareLinksDb.map(storageShareLinkPrismaToDomain);
  }

  async save(shareLink: StorageShareLink): Promise<void> {
    await prisma.storageShareLink.update({
      where: { id: shareLink.shareLinkId.toString() },
      data: {
        downloadCount: shareLink.downloadCount,
        isActive: shareLink.isActive,
        updatedAt: shareLink.updatedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.storageShareLink.delete({
      where: { id: id.toString() },
    });
  }
}
