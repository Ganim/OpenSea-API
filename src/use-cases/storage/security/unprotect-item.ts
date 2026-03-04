import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';
import { compare } from 'bcryptjs';

interface UnprotectItemUseCaseRequest {
  tenantId: string;
  itemId: string;
  itemType: 'file' | 'folder';
  password: string;
}

export class UnprotectItemUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFoldersRepository: StorageFoldersRepository,
  ) {}

  async execute(request: UnprotectItemUseCaseRequest): Promise<void> {
    const { tenantId, itemId, itemType, password } = request;

    if (itemType === 'file') {
      const file = await this.storageFilesRepository.findById(
        new UniqueEntityID(itemId),
        tenantId,
      );
      if (!file) throw new ResourceNotFoundError('Arquivo não encontrado');
      if (!file.isProtected)
        throw new BadRequestError('Arquivo não está protegido');

      const valid = await compare(password, file.protectionHash!);
      if (!valid) throw new BadRequestError('Senha incorreta');

      await this.storageFilesRepository.update({
        id: new UniqueEntityID(itemId),
        isProtected: false,
        protectionHash: null,
      });
    } else {
      const folder = await this.storageFoldersRepository.findById(
        new UniqueEntityID(itemId),
        tenantId,
      );
      if (!folder) throw new ResourceNotFoundError('Pasta não encontrada');
      if (!folder.isProtected)
        throw new BadRequestError('Pasta não está protegida');

      const valid = await compare(password, folder.protectionHash!);
      if (!valid) throw new BadRequestError('Senha incorreta');

      await this.storageFoldersRepository.update({
        id: new UniqueEntityID(itemId),
        isProtected: false,
        protectionHash: null,
      });
    }
  }
}
