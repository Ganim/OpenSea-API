import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface SearchFoldersUseCaseRequest {
  tenantId: string;
  query: string;
}

interface SearchFoldersUseCaseResponse {
  folders: import('@/entities/storage/storage-folder').StorageFolder[];
}

export class SearchFoldersUseCase {
  constructor(private storageFoldersRepository: StorageFoldersRepository) {}

  async execute(
    request: SearchFoldersUseCaseRequest,
  ): Promise<SearchFoldersUseCaseResponse> {
    const { tenantId, query } = request;

    if (!query || query.trim().length === 0) {
      return { folders: [] };
    }

    // Get all non-deleted folders for the tenant and filter by name
    const rootFolders =
      await this.storageFoldersRepository.findRootFolders(tenantId);

    const matchingFolders: import('@/entities/storage/storage-folder').StorageFolder[] =
      [];
    const searchTerm = query.trim().toLowerCase();

    // Search root folders and their descendants
    for (const rootFolder of rootFolders) {
      if (rootFolder.name.toLowerCase().includes(searchTerm)) {
        matchingFolders.push(rootFolder);
      }

      const descendants = await this.storageFoldersRepository.findDescendants(
        rootFolder.id,
        tenantId,
      );

      for (const descendant of descendants) {
        if (descendant.name.toLowerCase().includes(searchTerm)) {
          matchingFolders.push(descendant);
        }
      }
    }

    return {
      folders: matchingFolders,
    };
  }
}
