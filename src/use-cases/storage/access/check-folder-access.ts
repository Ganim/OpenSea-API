import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FolderAccessRulesRepository } from '@/repositories/storage/folder-access-rules-repository';

type FolderPermission = 'read' | 'write' | 'delete' | 'share';

interface CheckFolderAccessUseCaseRequest {
  tenantId: string;
  folderId: string;
  userId: string;
  groupIds: string[];
  requiredPermission: FolderPermission;
}

interface CheckFolderAccessUseCaseResponse {
  hasAccess: boolean;
}

export class CheckFolderAccessUseCase {
  constructor(
    private folderAccessRulesRepository: FolderAccessRulesRepository,
  ) {}

  async execute({
    folderId,
    userId,
    groupIds,
    requiredPermission,
  }: CheckFolderAccessUseCaseRequest): Promise<CheckFolderAccessUseCaseResponse> {
    const folderEntityId = new UniqueEntityID(folderId);
    const userEntityId = new UniqueEntityID(userId);
    const groupEntityIds = groupIds.map(
      (groupId) => new UniqueEntityID(groupId),
    );

    const effectiveRules =
      await this.folderAccessRulesRepository.findEffectiveAccess(
        folderEntityId,
        userEntityId,
        groupEntityIds,
      );

    if (effectiveRules.length === 0) {
      return { hasAccess: false };
    }

    // Merge permissions: any "allow" from any rule wins
    const mergedAccess = effectiveRules.some((rule) => {
      switch (requiredPermission) {
        case 'read':
          return rule.canRead;
        case 'write':
          return rule.canWrite;
        case 'delete':
          return rule.canDelete;
        case 'share':
          return rule.canShare;
        default:
          return false;
      }
    });

    return { hasAccess: mergedAccess };
  }
}
