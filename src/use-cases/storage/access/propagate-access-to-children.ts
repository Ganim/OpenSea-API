import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FolderAccessRulesRepository } from '@/repositories/storage/folder-access-rules-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';

interface PropagateAccessToChildrenUseCaseRequest {
  tenantId: string;
  folderId: string;
  userId?: string | null;
  groupId?: string | null;
  teamId?: string | null;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
}

export class PropagateAccessToChildrenUseCase {
  constructor(
    private storageFoldersRepository: StorageFoldersRepository,
    private folderAccessRulesRepository: FolderAccessRulesRepository,
  ) {}

  async execute({
    tenantId,
    folderId,
    userId,
    groupId,
    teamId,
    canRead,
    canWrite,
    canDelete,
    canShare,
  }: PropagateAccessToChildrenUseCaseRequest): Promise<void> {
    const parentFolderId = new UniqueEntityID(folderId);

    const descendantFolders =
      await this.storageFoldersRepository.findDescendants(
        parentFolderId,
        tenantId,
      );

    for (const descendantFolder of descendantFolders) {
      const descendantFolderIdStr = descendantFolder.id.toString();

      let existingRule;
      if (userId) {
        existingRule =
          await this.folderAccessRulesRepository.findByFolderAndUser(
            descendantFolder.id,
            new UniqueEntityID(userId),
          );
      } else if (groupId) {
        existingRule =
          await this.folderAccessRulesRepository.findByFolderAndGroup(
            descendantFolder.id,
            new UniqueEntityID(groupId),
          );
      } else if (teamId) {
        existingRule =
          await this.folderAccessRulesRepository.findByFolderAndTeam(
            descendantFolder.id,
            new UniqueEntityID(teamId),
          );
      }

      if (existingRule) {
        continue;
      }

      await this.folderAccessRulesRepository.create({
        tenantId,
        folderId: descendantFolderIdStr,
        userId: userId ?? null,
        groupId: groupId ?? null,
        teamId: teamId ?? null,
        canRead,
        canWrite,
        canDelete,
        canShare,
        isInherited: true,
      });
    }
  }
}
