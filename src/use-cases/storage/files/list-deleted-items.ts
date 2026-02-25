import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageFolder } from '@/entities/storage/storage-folder';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface ListDeletedItemsUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
}

interface ListDeletedItemsUseCaseResponse {
  files: StorageFile[];
  folders: StorageFolder[];
  totalFiles: number;
  totalFolders: number;
}

export class ListDeletedItemsUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFoldersRepository: StorageFoldersRepository,
  ) {}

  async execute(
    request: ListDeletedItemsUseCaseRequest,
  ): Promise<ListDeletedItemsUseCaseResponse> {
    const page = request.page ?? 1;
    const limit = Math.min(request.limit ?? 20, 100);

    const [filesResult, foldersResult] = await Promise.all([
      this.storageFilesRepository.findDeleted(request.tenantId, page, limit),
      this.storageFoldersRepository.findDeleted(request.tenantId, page, limit),
    ]);

    return {
      files: filesResult.files,
      folders: foldersResult.folders,
      totalFiles: filesResult.total,
      totalFolders: foldersResult.total,
    };
  }
}
