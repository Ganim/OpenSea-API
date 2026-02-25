import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { StorageFileVersion } from '@/entities/storage/storage-file-version';
import type {
  CreateStorageFileVersionSchema,
  StorageFileVersionsRepository,
} from '../storage-file-versions-repository';

export class InMemoryStorageFileVersionsRepository
  implements StorageFileVersionsRepository
{
  public items: StorageFileVersion[] = [];

  async create(
    data: CreateStorageFileVersionSchema,
  ): Promise<StorageFileVersion> {
    const fileVersion = StorageFileVersion.create({
      fileId: new UniqueEntityID(data.fileId),
      version: data.version,
      fileKey: data.fileKey,
      size: data.size,
      mimeType: data.mimeType,
      changeNote: data.changeNote ?? null,
      uploadedBy: data.uploadedBy,
    });

    this.items.push(fileVersion);
    return fileVersion;
  }

  async findByFileId(
    fileId: UniqueEntityID,
    _tenantId?: string,
  ): Promise<StorageFileVersion[]> {
    // In-memory implementation doesn't have file-to-tenant join;
    // tenantId filtering is handled by the use case layer.
    return this.items.filter((item) => item.fileId.equals(fileId));
  }

  async findByVersion(
    fileId: UniqueEntityID,
    version: number,
    _tenantId?: string,
  ): Promise<StorageFileVersion | null> {
    const fileVersion = this.items.find(
      (item) => item.fileId.equals(fileId) && item.version === version,
    );
    return fileVersion ?? null;
  }

  async findLatest(
    fileId: UniqueEntityID,
    _tenantId?: string,
  ): Promise<StorageFileVersion | null> {
    const versionsForFile = this.items
      .filter((item) => item.fileId.equals(fileId))
      .sort((a, b) => b.version - a.version);

    return versionsForFile[0] ?? null;
  }

  async deleteByFileId(fileId: UniqueEntityID): Promise<void> {
    this.items = this.items.filter((item) => !item.fileId.equals(fileId));
  }
}
