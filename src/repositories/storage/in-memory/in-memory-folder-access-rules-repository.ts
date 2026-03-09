import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FolderAccessRule } from '@/entities/storage/folder-access-rule';
import type {
  CreateFolderAccessRuleSchema,
  FolderAccessRulesRepository,
} from '../folder-access-rules-repository';

export class InMemoryFolderAccessRulesRepository
  implements FolderAccessRulesRepository
{
  public items: FolderAccessRule[] = [];

  async create(data: CreateFolderAccessRuleSchema): Promise<FolderAccessRule> {
    const accessRule = FolderAccessRule.create({
      tenantId: new UniqueEntityID(data.tenantId),
      folderId: new UniqueEntityID(data.folderId),
      userId: data.userId ? new UniqueEntityID(data.userId) : null,
      groupId: data.groupId ? new UniqueEntityID(data.groupId) : null,
      teamId: data.teamId ? new UniqueEntityID(data.teamId) : null,
      canRead: data.canRead ?? true,
      canWrite: data.canWrite ?? false,
      canDelete: data.canDelete ?? false,
      canShare: data.canShare ?? false,
      isInherited: data.isInherited ?? false,
    });

    this.items.push(accessRule);
    return accessRule;
  }

  async save(rule: FolderAccessRule): Promise<void> {
    const ruleIndex = this.items.findIndex((item) => item.id.equals(rule.id));
    if (ruleIndex >= 0) {
      this.items[ruleIndex] = rule;
    }
  }

  async findById(id: UniqueEntityID): Promise<FolderAccessRule | null> {
    const rule = this.items.find((item) => item.id.equals(id));
    return rule ?? null;
  }

  async findByFolder(folderId: UniqueEntityID): Promise<FolderAccessRule[]> {
    return this.items.filter((item) => item.folderId.equals(folderId));
  }

  async findByUser(
    userId: UniqueEntityID,
    tenantId: string,
  ): Promise<FolderAccessRule[]> {
    return this.items.filter(
      (item) =>
        item.userId !== null &&
        item.userId.equals(userId) &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findByFolderAndUser(
    folderId: UniqueEntityID,
    userId: UniqueEntityID,
  ): Promise<FolderAccessRule | null> {
    const accessRule = this.items.find(
      (item) =>
        item.folderId.equals(folderId) &&
        item.userId !== null &&
        item.userId.equals(userId),
    );
    return accessRule ?? null;
  }

  async findByFolderAndGroup(
    folderId: UniqueEntityID,
    groupId: UniqueEntityID,
  ): Promise<FolderAccessRule | null> {
    const accessRule = this.items.find(
      (item) =>
        item.folderId.equals(folderId) &&
        item.groupId !== null &&
        item.groupId.equals(groupId),
    );
    return accessRule ?? null;
  }

  async findByFolderAndTeam(
    folderId: UniqueEntityID,
    teamId: UniqueEntityID,
  ): Promise<FolderAccessRule | null> {
    const accessRule = this.items.find(
      (item) =>
        item.folderId.equals(folderId) &&
        item.teamId !== null &&
        item.teamId.equals(teamId),
    );
    return accessRule ?? null;
  }

  async deleteRule(id: UniqueEntityID): Promise<void> {
    const ruleIndex = this.items.findIndex((item) => item.id.equals(id));
    if (ruleIndex >= 0) {
      this.items.splice(ruleIndex, 1);
    }
  }

  async deleteInheritedByFolder(folderId: UniqueEntityID): Promise<void> {
    this.items = this.items.filter(
      (item) => !(item.folderId.equals(folderId) && item.isInherited),
    );
  }

  async deleteInheritedByFolderAndSubject(
    folderId: UniqueEntityID,
    userId: UniqueEntityID | null,
    groupId: UniqueEntityID | null,
    teamId?: UniqueEntityID | null,
  ): Promise<void> {
    this.items = this.items.filter((item) => {
      if (!item.folderId.equals(folderId)) return true;
      if (!item.isInherited) return true;

      if (userId && item.userId !== null && item.userId.equals(userId)) {
        return false;
      }

      if (groupId && item.groupId !== null && item.groupId.equals(groupId)) {
        return false;
      }

      if (teamId && item.teamId !== null && item.teamId.equals(teamId)) {
        return false;
      }

      return true;
    });
  }

  async findByFolderIds(
    folderIds: string[],
    tenantId: string,
  ): Promise<Map<string, FolderAccessRule[]>> {
    const map = new Map<string, FolderAccessRule[]>();
    for (const folderId of folderIds) {
      map.set(folderId, []);
    }
    for (const item of this.items) {
      if (
        item.tenantId.toString() === tenantId &&
        folderIds.includes(item.folderId.toString())
      ) {
        const list = map.get(item.folderId.toString());
        if (list) {
          list.push(item);
        }
      }
    }
    return map;
  }

  async countByFolder(folderId: UniqueEntityID): Promise<number> {
    return this.items.filter((item) => item.folderId.equals(folderId)).length;
  }

  async findEffectiveAccess(
    folderId: UniqueEntityID,
    userId: UniqueEntityID,
    groupIds: UniqueEntityID[],
  ): Promise<FolderAccessRule[]> {
    return this.items.filter((item) => {
      if (!item.folderId.equals(folderId)) return false;

      const matchesUser = item.userId !== null && item.userId.equals(userId);
      const matchesGroup =
        item.groupId !== null &&
        groupIds.some((groupId) => item.groupId!.equals(groupId));

      return matchesUser || matchesGroup;
    });
  }
}
