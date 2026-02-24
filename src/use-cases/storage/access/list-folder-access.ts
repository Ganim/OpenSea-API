import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FolderAccessRule } from '@/entities/storage/folder-access-rule';
import type { FolderAccessRulesRepository } from '@/repositories/storage/folder-access-rules-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface ListFolderAccessUseCaseRequest {
  tenantId: string;
  folderId: string;
}

interface ListFolderAccessUseCaseResponse {
  rules: FolderAccessRule[];
}

export class ListFolderAccessUseCase {
  constructor(
    private storageFoldersRepository: StorageFoldersRepository,
    private folderAccessRulesRepository: FolderAccessRulesRepository,
  ) {}

  async execute({
    tenantId,
    folderId,
  }: ListFolderAccessUseCaseRequest): Promise<ListFolderAccessUseCaseResponse> {
    const folderEntityId = new UniqueEntityID(folderId);

    const folder = await this.storageFoldersRepository.findById(
      folderEntityId,
      tenantId,
    );

    if (!folder) {
      throw new ResourceNotFoundError('Folder');
    }

    const rules =
      await this.folderAccessRulesRepository.findByFolder(folderEntityId);

    return { rules };
  }
}
