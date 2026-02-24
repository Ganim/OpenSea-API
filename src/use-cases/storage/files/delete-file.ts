import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';

interface DeleteFileUseCaseRequest {
  tenantId: string;
  fileId: string;
}

export class DeleteFileUseCase {
  constructor(private storageFilesRepository: StorageFilesRepository) {}

  async execute(request: DeleteFileUseCaseRequest): Promise<void> {
    const { tenantId, fileId } = request;

    const file = await this.storageFilesRepository.findById(
      new UniqueEntityID(fileId),
      tenantId,
    );

    if (!file) {
      throw new ResourceNotFoundError('File not found');
    }

    await this.storageFilesRepository.softDelete(new UniqueEntityID(fileId));
  }
}
