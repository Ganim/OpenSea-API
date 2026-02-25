import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFile } from '@/entities/storage/storage-file';
import type { StorageFileVersion } from '@/entities/storage/storage-file-version';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFileVersionsRepository } from '@/repositories/storage/storage-file-versions-repository';

interface GetFileUseCaseRequest {
  tenantId: string;
  fileId: string;
}

interface GetFileUseCaseResponse {
  file: StorageFile;
  versions: StorageFileVersion[];
}

export class GetFileUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFileVersionsRepository: StorageFileVersionsRepository,
  ) {}

  async execute(
    request: GetFileUseCaseRequest,
  ): Promise<GetFileUseCaseResponse> {
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
      tenantId,
    );

    return {
      file,
      versions,
    };
  }
}
