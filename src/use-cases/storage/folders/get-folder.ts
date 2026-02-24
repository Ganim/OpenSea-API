import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface GetFolderUseCaseRequest {
  tenantId: string;
  folderId: string;
}

interface GetFolderUseCaseResponse {
  folder: import('@/entities/storage/storage-folder').StorageFolder;
}

export class GetFolderUseCase {
  constructor(private storageFoldersRepository: StorageFoldersRepository) {}

  async execute(
    request: GetFolderUseCaseRequest,
  ): Promise<GetFolderUseCaseResponse> {
    const { tenantId, folderId } = request;

    const folder = await this.storageFoldersRepository.findById(
      new UniqueEntityID(folderId),
      tenantId,
    );

    if (!folder) {
      throw new ResourceNotFoundError('Folder not found');
    }

    return {
      folder,
    };
  }
}
