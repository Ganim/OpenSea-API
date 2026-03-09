import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';

interface ArchiveExpiredFilesUseCaseRequest {
  tenantId: string;
  batchSize?: number;
}

interface ArchiveExpiredFilesUseCaseResponse {
  archivedCount: number;
  errors: number;
}

export class ArchiveExpiredFilesUseCase {
  constructor(private storageFilesRepository: StorageFilesRepository) {}

  async execute(
    request: ArchiveExpiredFilesUseCaseRequest,
  ): Promise<ArchiveExpiredFilesUseCaseResponse> {
    const batchSize = request.batchSize ?? 100;

    const expiredFiles = await this.storageFilesRepository.findExpired(
      request.tenantId,
      batchSize,
    );

    if (expiredFiles.length === 0) {
      return { archivedCount: 0, errors: 0 };
    }

    const ids = expiredFiles.map((file) => file.id);
    const archivedCount = await this.storageFilesRepository.archiveByIds(ids);

    return { archivedCount, errors: 0 };
  }
}
