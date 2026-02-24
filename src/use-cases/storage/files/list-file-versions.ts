import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFileVersion } from '@/entities/storage/storage-file-version';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFileVersionsRepository } from '@/repositories/storage/storage-file-versions-repository';

interface ListFileVersionsUseCaseRequest {
  tenantId: string;
  fileId: string;
}

interface ListFileVersionsUseCaseResponse {
  versions: StorageFileVersion[];
}

export class ListFileVersionsUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFileVersionsRepository: StorageFileVersionsRepository,
  ) {}

  async execute(
    request: ListFileVersionsUseCaseRequest,
  ): Promise<ListFileVersionsUseCaseResponse> {
    const { tenantId, fileId } = request;

    const file = await this.storageFilesRepository.findById(
      new UniqueEntityID(fileId),
      tenantId,
    );

    if (!file) {
      throw new ResourceNotFoundError('File not found');
    }

    const versions = await this.storageFileVersionsRepository.findByFileId(
      new UniqueEntityID(fileId),
    );

    return {
      versions,
    };
  }
}
