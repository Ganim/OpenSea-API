import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFileVersionsRepository } from '@/repositories/storage/storage-file-versions-repository';
import type { FileUploadService } from '@/services/storage/file-upload-service';

interface PurgeDeletedFilesUseCaseRequest {
  retentionDays?: number;
  batchSize?: number;
}

interface PurgeDeletedFilesUseCaseResponse {
  purgedFiles: number;
  purgedVersions: number;
  freedBytes: number;
  errors: number;
}

export class PurgeDeletedFilesUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFileVersionsRepository: StorageFileVersionsRepository,
    private fileUploadService: FileUploadService,
  ) {}

  async execute(
    request: PurgeDeletedFilesUseCaseRequest = {},
  ): Promise<PurgeDeletedFilesUseCaseResponse> {
    const retentionDays = request.retentionDays ?? 30;
    const batchSize = request.batchSize ?? 100;

    const olderThan = new Date();
    olderThan.setDate(olderThan.getDate() - retentionDays);

    const deletedFiles = await this.storageFilesRepository.findSoftDeleted(
      olderThan,
      batchSize,
    );

    let purgedFiles = 0;
    let purgedVersions = 0;
    let freedBytes = 0;
    let errors = 0;

    for (const file of deletedFiles) {
      try {
        // Get all versions to delete their physical files
        const versions = await this.storageFileVersionsRepository.findByFileId(
          file.id,
        );

        // Delete physical files for each version
        for (const version of versions) {
          try {
            await this.fileUploadService.delete(version.fileKey);
            freedBytes += version.size;
            purgedVersions++;
          } catch {
            errors++;
          }
        }

        // Delete version records from DB
        await this.storageFileVersionsRepository.deleteByFileId(file.id);

        // Hard-delete the file record
        await this.storageFilesRepository.hardDelete(file.id);
        purgedFiles++;
      } catch {
        errors++;
      }
    }

    return {
      purgedFiles,
      purgedVersions,
      freedBytes,
      errors,
    };
  }
}
