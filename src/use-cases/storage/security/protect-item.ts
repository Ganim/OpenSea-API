import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';
import { hash } from 'bcryptjs';

interface ProtectItemUseCaseRequest {
  tenantId: string;
  itemId: string;
  itemType: 'file' | 'folder';
  password: string;
}

export class ProtectItemUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFoldersRepository: StorageFoldersRepository,
  ) {}

  async execute(request: ProtectItemUseCaseRequest): Promise<void> {
    const { tenantId, itemId, itemType, password } = request;

    const protectionHash = await hash(password, 10);

    if (itemType === 'file') {
      const file = await this.storageFilesRepository.findById(
        new UniqueEntityID(itemId),
        tenantId,
      );
      if (!file) throw new ResourceNotFoundError('Arquivo não encontrado');

      await this.storageFilesRepository.update({
        id: new UniqueEntityID(itemId),
        isProtected: true,
        protectionHash,
      });
    } else {
      const folder = await this.storageFoldersRepository.findById(
        new UniqueEntityID(itemId),
        tenantId,
      );
      if (!folder) throw new ResourceNotFoundError('Pasta não encontrada');

      await this.storageFoldersRepository.update({
        id: new UniqueEntityID(itemId),
        isProtected: true,
        protectionHash,
      });
    }
  }
}
