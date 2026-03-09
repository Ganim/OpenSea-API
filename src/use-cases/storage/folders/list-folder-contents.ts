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
  sort?: 'name' | 'createdAt' | 'updatedAt' | 'size';
  sortOrder?: 'asc' | 'desc';
  /** Current user ID for visibility filtering */
  userId?: string;
  /** Current user's group IDs for visibility filtering */
  userGroupIds?: string[];
  /** Current user's team IDs for visibility filtering */
  userTeamIds?: string[];
  /** Whether the user is a tenant admin */
  isAdmin?: boolean;
  /** Whether admin opted-in to see all users' files and folders */
  viewAll?: boolean;
  /** Whether the user has storage.system-folders.list permission */
  canViewSystemFolders?: boolean;
  /** Whether the user has storage.filter-folders.list permission */
  canViewFilterFolders?: boolean;
  /** Whether to show hidden items (requires verified security key) */
  showHidden?: boolean;
}

interface ListFolderContentsUseCaseResponse {
  folders: import('@/entities/storage/storage-folder').StorageFolder[];
  files: import('@/entities/storage/storage-file').StorageFile[];
  totalFolders: number;
  totalFiles: number;
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
      sort = 'name',
      sortOrder = 'asc',
      userId,
      userGroupIds = [],
      userTeamIds = [],
      isAdmin = false,
      viewAll = false,
      canViewSystemFolders = false,
      canViewFilterFolders = false,
      showHidden = false,
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

    // Filter hidden folders
    if (!showHidden) {
      childFolders = childFolders.filter((folder) => !folder.isHidden);
    }

    // Apply search filter to folders
    if (search) {
      const searchTerm = search.toLowerCase();
      childFolders = childFolders.filter((folder) =>
        folder.name.toLowerCase().includes(searchTerm),
      );
    }

    // Apply visibility filtering (skip only when admin has viewAll enabled)
    if (userId && !(isAdmin && viewAll) && this.folderAccessRulesRepository) {
      childFolders = await this.filterByVisibility(
        childFolders,
        tenantId,
        userId,
        userGroupIds,
        userTeamIds,
        canViewSystemFolders,
        canViewFilterFolders,
      );
    }

    // Sort folders
    const dir = sortOrder === 'asc' ? 1 : -1;
    childFolders.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name, 'pt-BR') * dir;
        case 'createdAt':
          return (a.createdAt.getTime() - b.createdAt.getTime()) * dir;
        case 'updatedAt':
          return (
            ((a.updatedAt ?? a.createdAt).getTime() -
              (b.updatedAt ?? b.createdAt).getTime()) *
            dir
          );
        default:
          return a.name.localeCompare(b.name, 'pt-BR') * dir;
      }
    });

    // Paginate folders (after visibility filtering)
    const totalFolders = childFolders.length;
    const folderOffset = (page - 1) * limit;
    const paginatedFolders = childFolders.slice(
      folderOffset,
      folderOffset + limit,
    );

    // Get files in folder (filter by uploader at root level for non-admins)
    const filesResult = await this.storageFilesRepository.findMany({
      tenantId,
      folderId: folderId ?? null,
      search,
      page,
      limit,
      uploadedBy:
        !(isAdmin && viewAll) && !folderId && userId ? userId : undefined,
      showHidden,
    });

    const totalFiles = filesResult.total;

    return {
      folders: paginatedFolders,
      files: filesResult.files,
      totalFolders,
      totalFiles,
      total: totalFolders + totalFiles,
    };
  }

  /**
   * Filters folders based on visibility rules:
   * - System folders: visible if user has `storage.system-folders.list` permission
   * - Filter folders: visible if user has `storage.filter-folders.list` permission
   * - User folders: visible if user is the creator OR has an explicit access rule
   *
   * Uses batch query to avoid N+1 queries on access rules.
   */
  private async filterByVisibility(
    folders: import('@/entities/storage/storage-folder').StorageFolder[],
    tenantId: string,
    userId: string,
    userGroupIds: string[],
    userTeamIds: string[],
    canViewSystemFolders: boolean,
    canViewFilterFolders: boolean,
  ): Promise<import('@/entities/storage/storage-folder').StorageFolder[]> {
    // Collect folder IDs that need access rule checking
    const foldersNeedingAccessCheck = folders.filter(
      (f) => !f.isFilter && !f.isSystem && f.createdBy !== userId,
    );

    // Batch-load access rules for all folders that need checking
    let accessRulesMap = new Map<
      string,
      import('@/entities/storage/folder-access-rule').FolderAccessRule[]
    >();
    if (
      foldersNeedingAccessCheck.length > 0 &&
      this.folderAccessRulesRepository
    ) {
      const folderIds = foldersNeedingAccessCheck.map((f) =>
        f.folderId.toString(),
      );
      accessRulesMap = await this.folderAccessRulesRepository.findByFolderIds(
        folderIds,
        tenantId,
      );
    }

    const result: import('@/entities/storage/storage-folder').StorageFolder[] =
      [];

    for (const folder of folders) {
      if (folder.isFilter) {
        if (canViewFilterFolders) result.push(folder);
        continue;
      }

      if (folder.isSystem) {
        if (canViewSystemFolders) result.push(folder);
        continue;
      }

      if (folder.createdBy === userId) {
        result.push(folder);
        continue;
      }

      // Check batch-loaded access rules
      const rules = accessRulesMap.get(folder.folderId.toString()) ?? [];
      const hasAccess = rules.some((rule) => {
        if (rule.userId && rule.userId.toString() === userId) return true;
        if (rule.groupId && userGroupIds.includes(rule.groupId.toString()))
          return true;
        if (rule.teamId && userTeamIds.includes(rule.teamId.toString()))
          return true;
        return false;
      });
      if (hasAccess) {
        result.push(folder);
      }
    }

    return result;
  }
}
