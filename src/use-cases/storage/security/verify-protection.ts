import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { StorageFilesRepository } from '@/repositories/storage/storage-files-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';
import { compare } from 'bcryptjs';

interface VerifyProtectionUseCaseRequest {
  tenantId: string;
  itemId: string;
  itemType: 'file' | 'folder';
  password: string;
}

interface VerifyProtectionUseCaseResponse {
  valid: boolean;
}

export class VerifyProtectionUseCase {
  constructor(
    private storageFilesRepository: StorageFilesRepository,
    private storageFoldersRepository: StorageFoldersRepository,
  ) {}

  async execute(
    request: VerifyProtectionUseCaseRequest,
  ): Promise<VerifyProtectionUseCaseResponse> {
    const { tenantId, itemId, itemType, password } = request;

    let protectionHash: string | null = null;

    if (itemType === 'file') {
      const file = await this.storageFilesRepository.findById(
        new UniqueEntityID(itemId),
        tenantId,
      );
      if (!file) throw new ResourceNotFoundError('Arquivo não encontrado');
      protectionHash = file.protectionHash;
    } else {
      const folder = await this.storageFoldersRepository.findById(
        new UniqueEntityID(itemId),
        tenantId,
      );
      if (!folder) throw new ResourceNotFoundError('Pasta não encontrada');
      protectionHash = folder.protectionHash;
    }

    if (!protectionHash) {
      return { valid: true }; // Not protected, always valid
    }

    const valid = await compare(password, protectionHash);
    return { valid };
  }
}
