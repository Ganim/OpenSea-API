import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FolderAccessRule } from '@/entities/storage/folder-access-rule';
import type { FolderAccessRulesRepository } from '@/repositories/storage/folder-access-rules-repository';
import type { StorageFoldersRepository } from '@/repositories/storage/storage-folders-repository';
import type { PropagateAccessToChildrenUseCase } from './propagate-access-to-children';

interface SetFolderAccessUseCaseRequest {
  tenantId: string;
  folderId: string;
  userId?: string;
  groupId?: string;
  teamId?: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
}

interface SetFolderAccessUseCaseResponse {
  rule: FolderAccessRule;
}

export class SetFolderAccessUseCase {
  constructor(
    private storageFoldersRepository: StorageFoldersRepository,
    private folderAccessRulesRepository: FolderAccessRulesRepository,
    private propagateAccessToChildrenUseCase: PropagateAccessToChildrenUseCase,
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
  }: SetFolderAccessUseCaseRequest): Promise<SetFolderAccessUseCaseResponse> {
    const hasUserId = userId !== undefined && userId !== null;
    const hasGroupId = groupId !== undefined && groupId !== null;
    const hasTeamId = teamId !== undefined && teamId !== null;

    const subjectCount = [hasUserId, hasGroupId, hasTeamId].filter(
      Boolean,
    ).length;

    if (subjectCount === 0) {
      throw new BadRequestError(
        'One of userId, groupId, or teamId must be provided.',
      );
    }

    if (subjectCount > 1) {
      throw new BadRequestError(
        'Only one of userId, groupId, or teamId can be provided.',
      );
    }

    const folderEntityId = new UniqueEntityID(folderId);

    const folder = await this.storageFoldersRepository.findById(
      folderEntityId,
      tenantId,
    );

    if (!folder) {
      throw new ResourceNotFoundError('Folder');
    }

    let existingRule: FolderAccessRule | null = null;

    if (hasUserId) {
      existingRule = await this.folderAccessRulesRepository.findByFolderAndUser(
        folderEntityId,
        new UniqueEntityID(userId),
      );
    } else if (hasGroupId) {
      existingRule =
        await this.folderAccessRulesRepository.findByFolderAndGroup(
          folderEntityId,
          new UniqueEntityID(groupId!),
        );
    } else {
      existingRule = await this.folderAccessRulesRepository.findByFolderAndTeam(
        folderEntityId,
        new UniqueEntityID(teamId!),
      );
    }

    let rule: FolderAccessRule;

    if (existingRule) {
      existingRule.canRead = canRead;
      existingRule.canWrite = canWrite;
      existingRule.canDelete = canDelete;
      existingRule.canShare = canShare;

      await this.folderAccessRulesRepository.save(existingRule);

      rule = existingRule;
    } else {
      rule = await this.folderAccessRulesRepository.create({
        tenantId,
        folderId,
        userId: hasUserId ? userId : null,
        groupId: hasGroupId ? groupId : null,
        teamId: hasTeamId ? teamId : null,
        canRead,
        canWrite,
        canDelete,
        canShare,
        isInherited: false,
      });
    }

    await this.propagateAccessToChildrenUseCase.execute({
      tenantId,
      folderId,
      userId: hasUserId ? userId : null,
      groupId: hasGroupId ? groupId : null,
      teamId: hasTeamId ? teamId : null,
      canRead,
      canWrite,
      canDelete,
      canShare,
    });

    return { rule };
  }
}
