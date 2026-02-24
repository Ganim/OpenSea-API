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
      folderId: new UniqueEntityID(data.folderId),
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

      if (params.folderId && item.folderId.toString() !== params.folderId)
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

  async update(data: UpdateStorageFileSchema): Promise<StorageFile | null> {
    const file = this.items.find(
      (item) => item.deletedAt === null && item.id.equals(data.id),
    );
    if (!file) return null;

    if (data.name !== undefined) file.name = data.name;
    if (data.path !== undefined) file.path = data.path;
    if (data.folderId !== undefined)
      file.folderId = new UniqueEntityID(data.folderId);
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
        item.deletedAt !== null && item.deletedAt.getTime() < olderThan.getTime(),
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

  async countByFolder(folderId: UniqueEntityID): Promise<number> {
    return this.items.filter(
      (item) => item.deletedAt === null && item.folderId.equals(folderId),
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
}
