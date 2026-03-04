import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageShareLink } from '@/entities/storage/storage-share-link';
import { prisma } from '@/lib/prisma';
import { storageShareLinkPrismaToDomain } from '@/mappers/storage';
import { ENCRYPTED_FIELD_CONFIG } from '@/services/security/encrypted-field-config';
import { getFieldCipherService } from '@/services/security/field-cipher-service';
import type {
  CreateShareLinkSchema,
  StorageShareLinksRepository,
} from '../storage-share-links-repository';

const { encryptedFields } = ENCRYPTED_FIELD_CONFIG.StorageShareLink;

function tryGetCipher() {
  try {
    return getFieldCipherService();
  } catch {
    return null;
  }
}

function decryptShareLinkData<T extends Record<string, unknown>>(data: T): T {
  const cipher = tryGetCipher();
  if (!cipher) return data;
  return cipher.decryptFields(data, encryptedFields);
}

function decryptAndMap(shareLinkDb: Record<string, unknown>): StorageShareLink {
  const decrypted = decryptShareLinkData(shareLinkDb);
  return storageShareLinkPrismaToDomain(decrypted as never);
}

export class PrismaStorageShareLinksRepository
  implements StorageShareLinksRepository
{
  async create(data: CreateShareLinkSchema): Promise<StorageShareLink> {
    const cipher = tryGetCipher();

    const passwordEncrypted =
      data.password && cipher ? cipher.encrypt(data.password) : data.password;

    const shareLinkDb = await prisma.storageShareLink.create({
      data: {
        id: data.id,
        tenantId: data.tenantId,
        fileId: data.fileId,
        token: data.token,
        expiresAt: data.expiresAt ?? null,
        password: passwordEncrypted ?? null,
        maxDownloads: data.maxDownloads ?? null,
        createdBy: data.createdBy,
      },
    });

    return decryptAndMap(shareLinkDb as unknown as Record<string, unknown>);
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
    return decryptAndMap(shareLinkDb as unknown as Record<string, unknown>);
  }

  async findByToken(token: string): Promise<StorageShareLink | null> {
    const shareLinkDb = await prisma.storageShareLink.findUnique({
      where: { token },
    });

    if (!shareLinkDb) return null;
    return decryptAndMap(shareLinkDb as unknown as Record<string, unknown>);
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

    return shareLinksDb.map((sl) =>
      decryptAndMap(sl as unknown as Record<string, unknown>),
    );
  }

  async save(shareLink: StorageShareLink): Promise<void> {
    await prisma.storageShareLink.update({
      where: {
        id: shareLink.shareLinkId.toString(),
        tenantId: shareLink.tenantId.toString(),
      },
      data: {
        downloadCount: shareLink.downloadCount,
        isActive: shareLink.isActive,
        updatedAt: shareLink.updatedAt,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.storageShareLink.delete({
      where: {
        id: id.toString(),
        ...(tenantId && { tenantId }),
      },
    });
  }
}
