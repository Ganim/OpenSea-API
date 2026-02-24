import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';
import type { FolderAccessRulesRepository } from '@/repositories/storage/folder-access-rules-repository';

interface ListFolderContentsUseCaseRequest {
  tenantId: string;
  folderId?: string;
  page?: number;
  limit?: number;
  search?: string;
  /** Current user ID for visibility filtering */
  userId?: string;
  /** Current user's group IDs for visibility filtering */
  userGroupIds?: string[];
  /** Whether the user is a tenant admin (sees everything) */
  isAdmin?: boolean;
  /** Whether the user has storage.system-folders.list permission */
  canViewSystemFolders?: boolean;
  /** Whether the user has storage.filter-folders.list permission */
  canViewFilterFolders?: boolean;
}

interface ListFolderContentsUseCaseResponse {
  folders: import('@/entities/storage/storage-folder').StorageFolder[];
  files: import('@/entities/storage/storage-file').StorageFile[];
  total: number;
}

export class ListFolderContentsUseCase {
  constructor(
    private storageFoldersRepository: StorageFoldersRepository,
    private storageFilesRepository: StorageFilesRepository,
    private folderAccessRulesRepository?: FolderAccessRulesRepository,
  ) {}

  async execute(
    request: ListFolderContentsUseCaseRequest,
  ): Promise<ListFolderContentsUseCaseResponse> {
    const {
      tenantId,
      folderId,
      page = 1,
      limit = 20,
      search,
      userId,
      userGroupIds = [],
      isAdmin = false,
      canViewSystemFolders = false,
      canViewFilterFolders = false,
    } = request;

    // Validate folder exists if provided
    if (folderId) {
      const parentFolder = await this.storageFoldersRepository.findById(
        new UniqueEntityID(folderId),
        tenantId,
      );

      if (!parentFolder) {
        throw new ResourceNotFoundError('Folder not found');
      }
    }

    // Get child folders
    let childFolders: import('@/entities/storage/storage-folder').StorageFolder[];

    if (folderId) {
      childFolders = await this.storageFoldersRepository.findChildren(
        new UniqueEntityID(folderId),
        tenantId,
      );
    } else {
      childFolders =
        await this.storageFoldersRepository.findRootFolders(tenantId);
    }

    // Apply search filter to folders
    if (search) {
      const searchTerm = search.toLowerCase();
      childFolders = childFolders.filter((folder) =>
        folder.name.toLowerCase().includes(searchTerm),
      );
    }

    // Apply visibility filtering (only if userId is provided and user is not admin)
    if (userId && !isAdmin && this.folderAccessRulesRepository) {
      childFolders = await this.filterByVisibility(
        childFolders,
        tenantId,
        userId,
        userGroupIds,
        canViewSystemFolders,
        canViewFilterFolders,
      );
    }

    // Get files in folder
    const filesResult = await this.storageFilesRepository.findMany({
      tenantId,
      folderId: folderId ?? undefined,
      search,
      page,
      limit,
    });

    const totalFolders = childFolders.length;
    const totalFiles = filesResult.total;

    return {
      folders: childFolders,
      files: filesResult.files,
      total: totalFolders + totalFiles,
    };
  }

  /**
   * Filters folders based on visibility rules:
   * - System folders: visible if user has `storage.system-folders.list` permission
   * - Filter folders: visible if user has `storage.filter-folders.list` permission
   * - User folders: visible if user is the creator OR has an explicit access rule
   */
  private async filterByVisibility(
    folders: import('@/entities/storage/storage-folder').StorageFolder[],
    tenantId: string,
    userId: string,
    userGroupIds: string[],
    canViewSystemFolders: boolean,
    canViewFilterFolders: boolean,
  ): Promise<import('@/entities/storage/storage-folder').StorageFolder[]> {
    const result: import('@/entities/storage/storage-folder').StorageFolder[] =
      [];

    for (const folder of folders) {
      // Filter folders: visible only if user has storage.filter-folders.list permission
      if (folder.isFilter) {
        if (canViewFilterFolders) {
          result.push(folder);
        }
        continue;
      }

      // System folders: visible only if user has storage.system-folders.list permission
      if (folder.isSystem) {
        if (canViewSystemFolders) {
          result.push(folder);
        }
        continue;
      }

      // User folders: visible if user is the creator OR has access rule
      if (folder.createdBy === userId) {
        result.push(folder);
        continue;
      }

      const hasAccess = await this.checkFolderAccess(
        folder.folderId.toString(),
        tenantId,
        userId,
        userGroupIds,
      );
      if (hasAccess) {
        result.push(folder);
      }
    }

    return result;
  }

  private async checkFolderAccess(
    folderId: string,
    _tenantId: string,
    userId: string,
    userGroupIds: string[],
  ): Promise<boolean> {
    if (!this.folderAccessRulesRepository) return true;

    const rules = await this.folderAccessRulesRepository.findByFolder(
      new UniqueEntityID(folderId),
    );

    return rules.some((rule) => {
      if (rule.userId && rule.userId.toString() === userId) return true;
      if (rule.groupId && userGroupIds.includes(rule.groupId.toString()))
        return true;
      return false;
    });
  }
}
