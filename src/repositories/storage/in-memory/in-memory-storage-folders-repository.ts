import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { StorageFolder } from '@/entities/storage/storage-folder';
import type {
  CreateStorageFolderSchema,
  StorageFoldersRepository,
  UpdateStorageFolderSchema,
} from '../storage-folders-repository';

export class InMemoryStorageFoldersRepository
  implements StorageFoldersRepository
{
  public items: StorageFolder[] = [];

  async create(data: CreateStorageFolderSchema): Promise<StorageFolder> {
    const folder = StorageFolder.create({
      tenantId: new UniqueEntityID(data.tenantId),
      parentId: data.parentId ? new UniqueEntityID(data.parentId) : null,
      name: data.name,
      slug: data.slug,
      path: data.path,
      icon: data.icon ?? null,
      color: data.color ?? null,
      isSystem: data.isSystem ?? false,
      isFilter: data.isFilter ?? false,
      filterFileType: data.filterFileType ?? null,
      module: data.module ?? null,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
      depth: data.depth ?? 0,
      createdBy: data.createdBy ?? null,
    });

    this.items.push(folder);
    return folder;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageFolder | null> {
    const folder = this.items.find(
      (item) =>
        item.deletedAt === null &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return folder ?? null;
  }

  async findByPath(
    path: string,
    tenantId: string,
  ): Promise<StorageFolder | null> {
    const folder = this.items.find(
      (item) =>
        item.deletedAt === null &&
        item.path === path &&
        item.tenantId.toString() === tenantId,
    );
    return folder ?? null;
  }

  async findChildren(
    parentId: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageFolder[]> {
    return this.items.filter(
      (item) =>
        item.deletedAt === null &&
        item.parentId !== null &&
        item.parentId.equals(parentId) &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findRootFolders(tenantId: string): Promise<StorageFolder[]> {
    return this.items.filter(
      (item) =>
        item.deletedAt === null &&
        item.parentId === null &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findByEntityId(
    entityType: string,
    entityId: string,
    tenantId: string,
  ): Promise<StorageFolder | null> {
    const folder = this.items.find(
      (item) =>
        item.deletedAt === null &&
        item.entityType === entityType &&
        item.entityId === entityId &&
        item.tenantId.toString() === tenantId,
    );
    return folder ?? null;
  }

  async findFilterFolders(tenantId: string): Promise<StorageFolder[]> {
    return this.items.filter(
      (item) =>
        item.deletedAt === null &&
        item.isFilter === true &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findDescendants(
    folderId: UniqueEntityID,
    tenantId: string,
  ): Promise<StorageFolder[]> {
    const parentFolder = this.items.find(
      (item) =>
        item.deletedAt === null &&
        item.id.equals(folderId) &&
        item.tenantId.toString() === tenantId,
    );

    if (!parentFolder) return [];

    const parentPath = parentFolder.path;
    const pathPrefix = parentPath === '/' ? '/' : `${parentPath}/`;

    return this.items.filter(
      (item) =>
        item.deletedAt === null &&
        item.tenantId.toString() === tenantId &&
        !item.id.equals(folderId) &&
        (item.path.startsWith(pathPrefix) ||
          (parentPath === '/' && item.path !== '/')),
    );
  }

  async update(data: UpdateStorageFolderSchema): Promise<StorageFolder | null> {
    const folder = this.items.find(
      (item) => item.deletedAt === null && item.id.equals(data.id),
    );
    if (!folder) return null;

    if (data.name !== undefined) folder.name = data.name;
    if (data.slug !== undefined) folder.slug = data.slug;
    if (data.path !== undefined) folder.path = data.path;
    if (data.icon !== undefined) folder.icon = data.icon;
    if (data.color !== undefined) folder.color = data.color;
    if (data.parentId !== undefined)
      folder.parentId = data.parentId
        ? new UniqueEntityID(data.parentId)
        : null;
    if (data.depth !== undefined) folder.depth = data.depth;

    return folder;
  }

  async softDelete(id: UniqueEntityID): Promise<void> {
    const folder = this.items.find(
      (item) => item.deletedAt === null && item.id.equals(id),
    );
    if (folder) {
      folder.delete();
    }
  }

  async batchUpdatePaths(
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

  async batchUpdateDepths(
    pathPrefix: string,
    depthDelta: number,
    tenantId: string,
  ): Promise<number> {
    let count = 0;
    for (const item of this.items) {
      if (
        item.deletedAt === null &&
        item.tenantId.toString() === tenantId &&
        item.path.startsWith(pathPrefix + '/')
      ) {
        item.depth = item.depth + depthDelta;
        count++;
      }
    }
    return count;
  }

  async batchSoftDelete(folderIds: string[]): Promise<number> {
    let count = 0;
    for (const id of folderIds) {
      const folder = this.items.find(
        (item) => item.deletedAt === null && item.id.toString() === id,
      );
      if (folder) {
        folder.delete();
        count++;
      }
    }
    return count;
  }

  async countFiles(folderId: UniqueEntityID): Promise<number> {
    // In-memory folder repository cannot directly count files as that
    // requires cross-repository access. This returns the count of
    // child folders instead. For file counting in tests, use
    // InMemoryStorageFilesRepository.countByFolder() directly.
    return this.items.filter(
      (item) =>
        item.deletedAt === null &&
        item.parentId !== null &&
        item.parentId.equals(folderId),
    ).length;
  }
}
