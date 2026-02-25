import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { StorageFile } from '@/entities/storage/storage-file';
import {
  StorageFileStatus,
  type StorageFileStatusValue,
} from '@/entities/storage/value-objects/storage-file-status';
import type {
  CreateStorageFileSchema,
  FindManyStorageFilesResult,
  ListStorageFilesParams,
  StorageFilesRepository,
  UpdateStorageFileSchema,
} from '../storage-files-repository';

export class InMemoryStorageFilesRepository implements StorageFilesRepository {
  public items: StorageFile[] = [];

  async create(data: CreateStorageFileSchema): Promise<StorageFile> {
    const file = StorageFile.create({
      tenantId: new UniqueEntityID(data.tenantId),
      folderId: data.folderId ? new UniqueEntityID(data.folderId) : null,
      name: data.name,
      originalName: data.originalName,
      fileKey: data.fileKey,
      path: data.path,
      size: data.size,
      mimeType: data.mimeType,
      fileType: data.fileType,
      thumbnailKey: data.thumbnailKey ?? null,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
      expiresAt: data.expiresAt ?? null,
      uploadedBy: data.uploadedBy,
    });

    this.items.push(file);
    return file;
  }

  async findByIds(ids: string[], tenantId: string): Promise<StorageFile[]> {
    return this.items.filter(
      (item) =>
        item.deletedAt === null &&
        ids.includes(item.id.toString()) &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageFile | null> {
    const file = this.items.find(
      (item) =>
        item.deletedAt === null &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return file ?? null;
  }

  async findByPath(
    path: string,
    tenantId: string,
  ): Promise<StorageFile | null> {
    const file = this.items.find(
      (item) =>
        item.deletedAt === null &&
        item.path === path &&
        item.tenantId.toString() === tenantId,
    );
    return file ?? null;
  }

  async findMany(
    params: ListStorageFilesParams,
  ): Promise<FindManyStorageFilesResult> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;

    const filteredFiles = this.items.filter((item) => {
      if (item.deletedAt !== null) return false;
      if (item.tenantId.toString() !== params.tenantId) return false;

      if (params.folderId && item.folderId?.toString() !== params.folderId)
        return false;
      if (params.fileType && item.fileType !== params.fileType) return false;
      if (params.entityType && item.entityType !== params.entityType)
        return false;
      if (params.entityId && item.entityId !== params.entityId) return false;
      if (params.status && item.status.value !== params.status) return false;

      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(searchTerm);
        const matchesOriginalName = item.originalName
          .toLowerCase()
          .includes(searchTerm);
        if (!matchesName && !matchesOriginalName) return false;
      }

      return true;
    });

    const total = filteredFiles.length;
    const startIndex = (page - 1) * limit;
    const paginatedFiles = filteredFiles.slice(startIndex, startIndex + limit);

    return { files: paginatedFiles, total };
  }

  async findByEntityId(
    entityType: string,
    entityId: string,
    tenantId: string,
  ): Promise<StorageFile[]> {
    return this.items.filter(
      (item) =>
        item.deletedAt === null &&
        item.entityType === entityType &&
        item.entityId === entityId &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findByFileType(
    fileType: string,
    tenantId: string,
  ): Promise<StorageFile[]> {
    return this.items.filter(
      (item) =>
        item.deletedAt === null &&
        item.fileType === fileType &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findExpired(tenantId: string, limit = 100): Promise<StorageFile[]> {
    const now = new Date();
    return this.items
      .filter(
        (f) =>
          f.tenantId.toString() === tenantId &&
          f.expiresAt !== null &&
          f.expiresAt < now &&
          f.status.value === 'ACTIVE' &&
          f.deletedAt === null,
      )
      .slice(0, limit);
  }

  async update(data: UpdateStorageFileSchema): Promise<StorageFile | null> {
    const file = this.items.find(
      (item) => item.deletedAt === null && item.id.equals(data.id),
    );
    if (!file) return null;

    if (data.name !== undefined) file.name = data.name;
    if (data.path !== undefined) file.path = data.path;
    if (data.folderId !== undefined)
      file.folderId = data.folderId ? new UniqueEntityID(data.folderId) : null;
    if (data.status !== undefined)
      file.status = StorageFileStatus.create(
        data.status as StorageFileStatusValue,
      );
    if (data.currentVersion !== undefined)
      file.currentVersion = data.currentVersion;
    if (data.thumbnailKey !== undefined) file.thumbnailKey = data.thumbnailKey;
    if (data.fileKey !== undefined) file.props.fileKey = data.fileKey;
    if (data.size !== undefined) file.props.size = data.size;
    if (data.mimeType !== undefined) file.props.mimeType = data.mimeType;

    return file;
  }

  async findSoftDeleted(
    olderThan: Date,
    limit?: number,
  ): Promise<StorageFile[]> {
    const deleted = this.items.filter(
      (item) =>
        item.deletedAt !== null &&
        item.deletedAt.getTime() < olderThan.getTime(),
    );

    return limit ? deleted.slice(0, limit) : deleted;
  }

  async softDelete(id: UniqueEntityID): Promise<void> {
    const file = this.items.find(
      (item) => item.deletedAt === null && item.id.equals(id),
    );
    if (file) {
      file.delete();
    }
  }

  async hardDelete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  async batchUpdateFilePaths(
    oldPathPrefix: string,
    newPathPrefix: string,
    tenantId: string,
  ): Promise<number> {
    let count = 0;
    for (const item of this.items) {
      if (
        item.deletedAt === null &&
        item.tenantId.toString() === tenantId &&
        item.path.startsWith(oldPathPrefix + '/')
      ) {
        item.path = newPathPrefix + item.path.substring(oldPathPrefix.length);
        count++;
      }
    }
    return count;
  }

  async softDeleteByFolderIds(
    folderIds: string[],
    tenantId: string,
  ): Promise<number> {
    let count = 0;
    for (const item of this.items) {
      if (
        item.deletedAt === null &&
        item.tenantId.toString() === tenantId &&
        item.folderId !== null && folderIds.includes(item.folderId.toString())
      ) {
        item.delete();
        count++;
      }
    }
    return count;
  }

  async countByFolder(folderId: UniqueEntityID): Promise<number> {
    return this.items.filter(
      (item) => item.deletedAt === null && item.folderId !== null && item.folderId.equals(folderId),
    ).length;
  }

  async getTotalSize(tenantId: string): Promise<number> {
    return this.items
      .filter(
        (item) =>
          item.deletedAt === null && item.tenantId.toString() === tenantId,
      )
      .reduce((totalSize, item) => totalSize + item.size, 0);
  }

  async atomicCheckQuota(
    tenantId: string,
    additionalBytes: number,
    maxBytes: number,
  ): Promise<boolean> {
    const currentUsage = await this.getTotalSize(tenantId);
    return currentUsage + additionalBytes <= maxBytes;
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.items.filter(
      (item) =>
        item.deletedAt === null && item.tenantId.toString() === tenantId,
    ).length;
  }

  async countByFileType(tenantId: string): Promise<Record<string, number>> {
    const filesByType: Record<string, number> = {};

    this.items
      .filter(
        (item) =>
          item.deletedAt === null && item.tenantId.toString() === tenantId,
      )
      .forEach((item) => {
        filesByType[item.fileType] = (filesByType[item.fileType] ?? 0) + 1;
      });

    return filesByType;
  }

  async findDeletedById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageFile | null> {
    const file = this.items.find(
      (item) =>
        item.deletedAt !== null &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return file ?? null;
  }

  async findDeleted(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<{ files: StorageFile[]; total: number }> {
    const deleted = this.items.filter(
      (item) =>
        item.deletedAt !== null && item.tenantId.toString() === tenantId,
    );
    const total = deleted.length;
    const startIndex = (page - 1) * limit;
    const files = deleted.slice(startIndex, startIndex + limit);
    return { files, total };
  }

  async restore(id: UniqueEntityID): Promise<void> {
    const file = this.items.find(
      (item) => item.deletedAt !== null && item.id.equals(id),
    );
    if (file) {
      file.restore();
    }
  }

  async restoreByFolderIds(
    folderIds: string[],
    tenantId: string,
  ): Promise<number> {
    let count = 0;
    for (const item of this.items) {
      if (
        item.deletedAt !== null &&
        item.tenantId.toString() === tenantId &&
        item.folderId &&
        folderIds.includes(item.folderId.toString())
      ) {
        item.restore();
        count++;
      }
    }
    return count;
  }

  async hardDeleteAllSoftDeleted(
    tenantId: string,
  ): Promise<{ count: number; fileKeys: string[] }> {
    const deleted = this.items.filter(
      (item) =>
        item.deletedAt !== null && item.tenantId.toString() === tenantId,
    );
    const fileKeys = deleted.map((item) => item.fileKey);
    const count = deleted.length;
    this.items = this.items.filter(
      (item) =>
        !(item.deletedAt !== null && item.tenantId.toString() === tenantId),
    );
    return { count, fileKeys };
  }
}
