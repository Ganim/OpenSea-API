import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageShareLink } from '@/entities/storage/storage-share-link';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageShareLinksRepository } from '@/repositories/storage/storage-share-links-repository';

interface ListShareLinksUseCaseRequest {
  tenantId: string;
  fileId: string;
}

interface ListShareLinksUseCaseResponse {
  shareLinks: StorageShareLink[];
}

export class ListShareLinksUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageShareLinksRepository: StorageShareLinksRepository,
  ) {}

  async execute(
    request: ListShareLinksUseCaseRequest,
  ): Promise<ListShareLinksUseCaseResponse> {
    const { tenantId, fileId } = request;

    const file = await this.storageFilesRepository.findById(
      new UniqueEntityID(fileId),
      tenantId,
    );

    if (!file) {
      throw new ResourceNotFoundError('File not found');
    }

    const shareLinks = await this.storageShareLinksRepository.findByFileId(
      new UniqueEntityID(fileId),
      tenantId,
    );

    return { shareLinks };
  }
}
