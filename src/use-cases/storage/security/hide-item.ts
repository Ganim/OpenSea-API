import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface HideItemUseCaseRequest {
  tenantId: string;
  itemId: string;
  itemType: 'file' | 'folder';
}

export class HideItemUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFoldersRepository: StorageFoldersRepository,
  ) {}

  async execute(request: HideItemUseCaseRequest): Promise<void> {
    const { tenantId, itemId, itemType } = request;

    if (itemType === 'file') {
      const file = await this.storageFilesRepository.findById(
        new UniqueEntityID(itemId),
        tenantId,
      );
      if (!file) throw new ResourceNotFoundError('Arquivo não encontrado');

      await this.storageFilesRepository.update({
        id: new UniqueEntityID(itemId),
        isHidden: true,
      });
    } else {
      const folder = await this.storageFoldersRepository.findById(
        new UniqueEntityID(itemId),
        tenantId,
      );
      if (!folder) throw new ResourceNotFoundError('Pasta não encontrada');

      await this.storageFoldersRepository.update({
        id: new UniqueEntityID(itemId),
        isHidden: true,
      });
    }
  }
}
