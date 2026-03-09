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

    // Batch-check which descendants already have a rule for this subject (N+1 → 1 query)
    const descendantFolderIds = descendantFolders.map((f) => f.id.toString());
    const subject: { userId?: string; groupId?: string; teamId?: string } = {};
    if (userId) subject.userId = userId;
    else if (groupId) subject.groupId = groupId;
    else if (teamId) subject.teamId = teamId;

    const existingFolderIds =
      await this.folderAccessRulesRepository.findExistingFolderIdsForSubject(
        descendantFolderIds,
        subject,
      );

    for (const descendantFolder of descendantFolders) {
      const descendantFolderIdStr = descendantFolder.id.toString();

      if (existingFolderIds.has(descendantFolderIdStr)) {
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
