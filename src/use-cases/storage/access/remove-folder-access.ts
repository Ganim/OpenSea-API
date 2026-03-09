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

    // Batch-remove inherited rules from all descendants (N queries → 1)
    const descendantFolders =
      await this.storageFoldersRepository.findDescendants(
        folderEntityId,
        tenantId,
      );

    if (descendantFolders.length > 0) {
      const descendantFolderIds = descendantFolders.map((f) => f.id.toString());
      await this.folderAccessRulesRepository.deleteInheritedByFolderIdsAndSubject(
        descendantFolderIds,
        rule.userId,
        rule.groupId,
        rule.teamId,
      );
    }
  }
}
