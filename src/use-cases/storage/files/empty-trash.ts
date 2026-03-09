import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';

interface EmptyTrashUseCaseRequest {
  tenantId: string;
}

interface EmptyTrashUseCaseResponse {
  deletedFiles: number;
  deletedFolders: number;
  deletedS3Objects: number;
  s3Errors: number;
}

export class EmptyTrashUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFoldersRepository: StorageFoldersRepository,
    private fileUploadService: FileUploadService,
  ) {}

  async execute(
    request: EmptyTrashUseCaseRequest,
  ): Promise<EmptyTrashUseCaseResponse> {
    const { tenantId } = request;

    // Hard delete all soft-deleted files (returns count and fileKeys for S3 cleanup)
    const { count: deletedFiles, fileKeys } =
      await this.storageFilesRepository.hardDeleteAllSoftDeleted(tenantId);

    // Delete physical files from S3
    let deletedS3Objects = 0;
    let s3Errors = 0;

    for (const key of fileKeys) {
      try {
        await this.fileUploadService.delete(key);
        deletedS3Objects++;
      } catch {
        s3Errors++;
      }
    }

    // Hard delete all soft-deleted folders
    const deletedFolders =
      await this.storageFoldersRepository.hardDeleteAllSoftDeleted(tenantId);

    return {
      deletedFiles,
      deletedFolders,
      deletedS3Objects,
      s3Errors,
    };
  }
}
