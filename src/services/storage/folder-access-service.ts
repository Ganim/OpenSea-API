import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FolderAccessRulesRepository } from '@/repositories/storage/folder-access-rules-repository';

type FolderPermission = 'read' | 'write' | 'delete' | 'share';

/**
 * Wraps ACL checks with "default allow" behavior.
 *
 * If a folder has NO access rules at all, access is allowed (RBAC-only mode).
 * If rules exist, the user/group must have the required permission via OR-merge.
 */
export class FolderAccessService {
  constructor(
    private folderAccessRulesRepository: FolderAccessRulesRepository,
  ) {}

  async verifyAccess(
    folderId: string,
    userId: string,
    groupIds: string[],
    requiredPermission: FolderPermission,
  ): Promise<void> {
    const folderEntityId = new UniqueEntityID(folderId);

    // Default allow: if no ACL rules exist for this folder, allow access
    const ruleCount =
      await this.folderAccessRulesRepository.countByFolder(folderEntityId);

    if (ruleCount === 0) {
      return; // No ACL rules → RBAC-only mode, allow
    }

    const userEntityId = new UniqueEntityID(userId);
    const groupEntityIds = groupIds.map((id) => new UniqueEntityID(id));

    const effectiveRules =
      await this.folderAccessRulesRepository.findEffectiveAccess(
        folderEntityId,
        userEntityId,
        groupEntityIds,
      );

    if (effectiveRules.length === 0) {
      throw new ForbiddenError(
        'Você não tem permissão para acessar esta pasta',
      );
    }

    const hasPermission = effectiveRules.some((rule) => {
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

    if (!hasPermission) {
      throw new ForbiddenError(
        'Você não tem permissão para esta ação nesta pasta',
      );
    }
  }
}
