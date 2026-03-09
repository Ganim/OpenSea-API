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

    if (deletedFiles.length === 0) {
      return { purgedFiles: 0, purgedVersions: 0, freedBytes: 0, errors: 0 };
    }

    const fileIds = deletedFiles.map((f) => f.id);

    // Batch load all versions in a single query (eliminates N+1)
    const allVersions =
      await this.storageFileVersionsRepository.findByFileIds(fileIds);

    // Collect all S3 keys to delete (file keys + version keys)
    const s3KeysToDelete = new Set<string>();
    for (const file of deletedFiles) {
      s3KeysToDelete.add(file.fileKey);
    }
    for (const version of allVersions) {
      s3KeysToDelete.add(version.fileKey);
    }

    // Delete S3 objects (still sequential per key, but no N+1 on DB)
    for (const key of s3KeysToDelete) {
      try {
        await this.fileUploadService.delete(key);
        const version = allVersions.find((v) => v.fileKey === key);
        if (version) {
          freedBytes += version.size;
          purgedVersions++;
        } else {
          const file = deletedFiles.find((f) => f.fileKey === key);
          if (file) freedBytes += file.size;
        }
      } catch {
        errors++;
      }
    }

    // Batch delete version records and file records from DB
    await this.storageFileVersionsRepository.deleteByFileIds(fileIds);

    for (const file of deletedFiles) {
      try {
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
