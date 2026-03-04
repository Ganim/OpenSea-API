import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FolderAccessRule } from '@/entities/storage/folder-access-rule';
import type { FolderAccessRule as PrismaFolderAccessRule } from '@prisma/generated/client.js';

export function mapFolderAccessRulePrismaToDomain(
  ruleDb: PrismaFolderAccessRule,
) {
  return {
    id: new UniqueEntityID(ruleDb.id),
    tenantId: new UniqueEntityID(ruleDb.tenantId),
    folderId: new UniqueEntityID(ruleDb.folderId),
    userId: ruleDb.userId ? new UniqueEntityID(ruleDb.userId) : null,
    groupId: ruleDb.groupId ? new UniqueEntityID(ruleDb.groupId) : null,
    teamId: ruleDb.teamId ? new UniqueEntityID(ruleDb.teamId) : null,
    canRead: ruleDb.canRead,
    canWrite: ruleDb.canWrite,
    canDelete: ruleDb.canDelete,
    canShare: ruleDb.canShare,
    isInherited: ruleDb.isInherited,
    createdAt: ruleDb.createdAt,
    updatedAt: ruleDb.updatedAt,
  };
}

export function folderAccessRulePrismaToDomain(
  ruleDb: PrismaFolderAccessRule,
): FolderAccessRule {
  return FolderAccessRule.create(
    mapFolderAccessRulePrismaToDomain(ruleDb),
    new UniqueEntityID(ruleDb.id),
  );
}
