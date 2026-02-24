import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FolderAccessRulesRepository } from '@/repositories/storage/folder-access-rules-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface RemoveFolderAccessUseCaseRequest {
  tenantId: string;
  folderId: string;
  ruleId: string;
}

export class RemoveFolderAccessUseCase {
  constructor(
    private storageFoldersRepository: StorageFoldersRepository,
    private folderAccessRulesRepository: FolderAccessRulesRepository,
  ) {}

  async execute({
    tenantId,
    folderId,
    ruleId,
  }: RemoveFolderAccessUseCaseRequest): Promise<void> {
    const folderEntityId = new UniqueEntityID(folderId);

    const folder = await this.storageFoldersRepository.findById(
      folderEntityId,
      tenantId,
    );

    if (!folder) {
      throw new ResourceNotFoundError('Folder');
    }

    const ruleEntityId = new UniqueEntityID(ruleId);

    const rule = await this.folderAccessRulesRepository.findById(ruleEntityId);

    if (!rule) {
      throw new ResourceNotFoundError('Access rule');
    }

    if (!rule.folderId.equals(folderEntityId)) {
      throw new ResourceNotFoundError('Access rule');
    }

    await this.folderAccessRulesRepository.deleteRule(ruleEntityId);

    // Remove inherited rules from descendant folders for the same subject
    const descendantFolders =
      await this.storageFoldersRepository.findDescendants(
        folderEntityId,
        tenantId,
      );

    for (const descendantFolder of descendantFolders) {
      await this.folderAccessRulesRepository.deleteInheritedByFolderAndSubject(
        descendantFolder.id,
        rule.userId,
        rule.groupId,
      );
    }
  }
}
