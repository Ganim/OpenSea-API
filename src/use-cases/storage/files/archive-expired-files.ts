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

    let archivedCount = 0;
    let errors = 0;

    for (const file of expiredFiles) {
      try {
        await this.storageFilesRepository.update({
          id: file.id,
          status: 'ARCHIVED',
        });
        archivedCount++;
      } catch {
        errors++;
      }
    }

    return { archivedCount, errors };
  }
}
