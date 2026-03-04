import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FolderAccessRule } from '@/entities/storage/folder-access-rule';

export interface CreateFolderAccessRuleSchema {
  tenantId: string;
  folderId: string;
  userId?: string | null;
  groupId?: string | null;
  teamId?: string | null;
  canRead?: boolean;
  canWrite?: boolean;
  canDelete?: boolean;
  canShare?: boolean;
  isInherited?: boolean;
}

export interface FolderAccessRulesRepository {
  create(data: CreateFolderAccessRuleSchema): Promise<FolderAccessRule>;
  save(rule: FolderAccessRule): Promise<void>;
  findById(id: UniqueEntityID): Promise<FolderAccessRule | null>;
  findByFolder(folderId: UniqueEntityID): Promise<FolderAccessRule[]>;
  findByUser(
    userId: UniqueEntityID,
    tenantId: string,
  ): Promise<FolderAccessRule[]>;
  findByFolderAndUser(
    folderId: UniqueEntityID,
    userId: UniqueEntityID,
  ): Promise<FolderAccessRule | null>;
  findByFolderAndGroup(
    folderId: UniqueEntityID,
    groupId: UniqueEntityID,
  ): Promise<FolderAccessRule | null>;
  findByFolderAndTeam(
    folderId: UniqueEntityID,
    teamId: UniqueEntityID,
  ): Promise<FolderAccessRule | null>;
  deleteRule(id: UniqueEntityID): Promise<void>;
  deleteInheritedByFolder(folderId: UniqueEntityID): Promise<void>;
  deleteInheritedByFolderAndSubject(
    folderId: UniqueEntityID,
    userId: UniqueEntityID | null,
    groupId: UniqueEntityID | null,
    teamId?: UniqueEntityID | null,
  ): Promise<void>;
  findEffectiveAccess(
    folderId: UniqueEntityID,
    userId: UniqueEntityID,
    groupIds: UniqueEntityID[],
  ): Promise<FolderAccessRule[]>;
  findByFolderIds(
    folderIds: string[],
    tenantId: string,
  ): Promise<Map<string, FolderAccessRule[]>>;
}
