import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFileVersion } from '@/entities/storage/storage-file-version';

export interface CreateStorageFileVersionSchema {
  fileId: string;
  version: number;
  fileKey: string;
  size: number;
  mimeType: string;
  changeNote?: string | null;
  uploadedBy: string;
}

export interface StorageFileVersionsRepository {
  create(data: CreateStorageFileVersionSchema): Promise<StorageFileVersion>;
  findByFileId(fileId: UniqueEntityID): Promise<StorageFileVersion[]>;
  findByVersion(
    fileId: UniqueEntityID,
    version: number,
  ): Promise<StorageFileVersion | null>;
  findLatest(fileId: UniqueEntityID): Promise<StorageFileVersion | null>;
}
