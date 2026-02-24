import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';

interface GetStorageStatsUseCaseRequest {
  tenantId: string;
}

interface GetStorageStatsUseCaseResponse {
  totalFiles: number;
  totalSize: number;
  filesByType: Record<string, number>;
}

export class GetStorageStatsUseCase {
  constructor(private storageFilesRepository: StorageFilesRepository) {}

  async execute(
    request: GetStorageStatsUseCaseRequest,
  ): Promise<GetStorageStatsUseCaseResponse> {
    const { tenantId } = request;

    const [totalFiles, totalSize, filesByType] = await Promise.all([
      this.storageFilesRepository.countByTenant(tenantId),
      this.storageFilesRepository.getTotalSize(tenantId),
      this.storageFilesRepository.countByFileType(tenantId),
    ]);

    return {
      totalFiles,
      totalSize,
      filesByType,
    };
  }
}
