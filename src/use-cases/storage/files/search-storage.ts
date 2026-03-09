import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageFolder } from '@/entities/storage/storage-folder';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface SearchStorageUseCaseRequest {
  tenantId: string;
  query: string;
  fileType?: string;
  page?: number;
  limit?: number;
}

interface SearchStorageUseCaseResponse {
  files: StorageFile[];
  folders: StorageFolder[];
  totalFiles: number;
  totalFolders: number;
}

export class SearchStorageUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFoldersRepository: StorageFoldersRepository,
  ) {}

  async execute(
    request: SearchStorageUseCaseRequest,
  ): Promise<SearchStorageUseCaseResponse> {
    const { tenantId, query, fileType, page = 1, limit = 20 } = request;

    if (!query || query.trim().length < 2) {
      return { files: [], folders: [], totalFiles: 0, totalFolders: 0 };
    }

    const trimmedQuery = query.trim();

    const [filesResult, folders, totalFolders] = await Promise.all([
      this.storageFilesRepository.findMany({
        tenantId,
        search: trimmedQuery,
        fileType,
        page,
        limit,
      }),
      this.storageFoldersRepository.search(tenantId, trimmedQuery, limit),
      this.storageFoldersRepository.searchCount(tenantId, trimmedQuery),
    ]);

    return {
      files: filesResult.files,
      folders,
      totalFiles: filesResult.total,
      totalFolders,
    };
  }
}
