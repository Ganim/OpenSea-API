import type { FolderAccessRule } from '@/entities/storage/folder-access-rule';

export interface FolderAccessRuleDTO {
  id: string;
  tenantId: string;
  folderId: string;
  userId: string | null;
  userName: string | null;
  groupId: string | null;
  groupName: string | null;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
  isInherited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function folderAccessRuleToDTO(
  rule: FolderAccessRule,
  resolvedNames?: { userName?: string | null; groupName?: string | null },
): FolderAccessRuleDTO {
  return {
    id: rule.ruleId.toString(),
    tenantId: rule.tenantId.toString(),
    folderId: rule.folderId.toString(),
    userId: rule.userId?.toString() ?? null,
    userName: resolvedNames?.userName ?? null,
    groupId: rule.groupId?.toString() ?? null,
    groupName: resolvedNames?.groupName ?? null,
    canRead: rule.canRead,
    canWrite: rule.canWrite,
    canDelete: rule.canDelete,
    canShare: rule.canShare,
    isInherited: rule.isInherited,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  };
}
