import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageShareLink } from '@/entities/storage/storage-share-link';

export interface CreateShareLinkSchema {
  id?: string;
  tenantId: string;
  fileId: string;
  token: string;
  expiresAt?: Date | null;
  password?: string | null;
  maxDownloads?: number | null;
  createdBy: string;
}

export interface StorageShareLinksRepository {
  create(data: CreateShareLinkSchema): Promise<StorageShareLink>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageShareLink | null>;
  findByToken(token: string): Promise<StorageShareLink | null>;
  findByFileId(
    fileId: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageShareLink[]>;
  save(shareLink: StorageShareLink): Promise<void>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
}
