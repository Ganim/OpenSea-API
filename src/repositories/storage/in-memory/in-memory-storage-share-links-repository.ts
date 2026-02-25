import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { StorageShareLink } from '@/entities/storage/storage-share-link';
import type {
  CreateShareLinkSchema,
  StorageShareLinksRepository,
} from '../storage-share-links-repository';

export class InMemoryStorageShareLinksRepository
  implements StorageShareLinksRepository
{
  public items: StorageShareLink[] = [];

  async create(data: CreateShareLinkSchema): Promise<StorageShareLink> {
    const shareLink = StorageShareLink.create({
      tenantId: new UniqueEntityID(data.tenantId),
      fileId: new UniqueEntityID(data.fileId),
      token: data.token,
      expiresAt: data.expiresAt ?? null,
      password: data.password ?? null,
      maxDownloads: data.maxDownloads ?? null,
      createdBy: data.createdBy,
    });

    this.items.push(shareLink);
    return shareLink;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageShareLink | null> {
    const shareLink = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return shareLink ?? null;
  }

  async findByToken(token: string): Promise<StorageShareLink | null> {
    const shareLink = this.items.find((item) => item.token === token);
    return shareLink ?? null;
  }

  async findByFileId(
    fileId: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageShareLink[]> {
    return this.items.filter(
      (item) =>
        item.fileId.equals(fileId) && item.tenantId.toString() === tenantId,
    );
  }

  async save(shareLink: StorageShareLink): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(shareLink.id));
    if (index !== -1) {
      this.items[index] = shareLink;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
