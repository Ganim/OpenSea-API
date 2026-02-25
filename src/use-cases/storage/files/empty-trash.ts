import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface EmptyTrashUseCaseRequest {
  tenantId: string;
}

interface EmptyTrashUseCaseResponse {
  deletedFiles: number;
  deletedFolders: number;
  fileKeys: string[];
}

export class EmptyTrashUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFoldersRepository: StorageFoldersRepository,
  ) {}

  async execute(
    request: EmptyTrashUseCaseRequest,
  ): Promise<EmptyTrashUseCaseResponse> {
    const { tenantId } = request;

    // Hard delete all soft-deleted files (returns count and fileKeys for S3 cleanup)
    const { count: deletedFiles, fileKeys } =
      await this.storageFilesRepository.hardDeleteAllSoftDeleted(tenantId);

    // Hard delete all soft-deleted folders
    const deletedFolders =
      await this.storageFoldersRepository.hardDeleteAllSoftDeleted(tenantId);

    return {
      deletedFiles,
      deletedFolders,
      fileKeys,
    };
  }
}
