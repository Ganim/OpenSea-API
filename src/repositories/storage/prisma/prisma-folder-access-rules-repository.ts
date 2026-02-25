import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma } from '@/lib/prisma';
import { folderAccessRulePrismaToDomain } from '@/mappers/storage';
import type { FolderAccessRule } from '@/entities/storage/folder-access-rule';
import type {
  CreateFolderAccessRuleSchema,
  FolderAccessRulesRepository,
} from '../folder-access-rules-repository';

export class PrismaFolderAccessRulesRepository
  implements FolderAccessRulesRepository
{
  async create(data: CreateFolderAccessRuleSchema): Promise<FolderAccessRule> {
    const ruleDb = await prisma.folderAccessRule.create({
      data: {
        tenantId: data.tenantId,
        folderId: data.folderId,
        userId: data.userId ?? null,
        groupId: data.groupId ?? null,
        canRead: data.canRead ?? true,
        canWrite: data.canWrite ?? false,
        canDelete: data.canDelete ?? false,
        canShare: data.canShare ?? false,
        isInherited: data.isInherited ?? false,
      },
    });

    return folderAccessRulePrismaToDomain(ruleDb);
  }

  async save(rule: FolderAccessRule): Promise<void> {
    await prisma.folderAccessRule.update({
      where: { id: rule.id.toString() },
      data: {
        canRead: rule.canRead,
        canWrite: rule.canWrite,
        canDelete: rule.canDelete,
        canShare: rule.canShare,
        updatedAt: rule.updatedAt,
      },
    });
  }

  async findById(id: UniqueEntityID): Promise<FolderAccessRule | null> {
    const ruleDb = await prisma.folderAccessRule.findUnique({
      where: { id: id.toString() },
    });

    if (!ruleDb) return null;
    return folderAccessRulePrismaToDomain(ruleDb);
  }

  async findByFolder(folderId: UniqueEntityID): Promise<FolderAccessRule[]> {
    const rulesDb = await prisma.folderAccessRule.findMany({
      where: { folderId: folderId.toString() },
      orderBy: { createdAt: 'asc' },
    });

    return rulesDb.map(folderAccessRulePrismaToDomain);
  }

  async findByUser(
    userId: UniqueEntityID,
    tenantId: string,
  ): Promise<FolderAccessRule[]> {
    const rulesDb = await prisma.folderAccessRule.findMany({
      where: {
        userId: userId.toString(),
        tenantId,
      },
      orderBy: { createdAt: 'asc' },
    });

    return rulesDb.map(folderAccessRulePrismaToDomain);
  }

  async findByFolderAndUser(
    folderId: UniqueEntityID,
    userId: UniqueEntityID,
  ): Promise<FolderAccessRule | null> {
    const ruleDb = await prisma.folderAccessRule.findFirst({
      where: {
        folderId: folderId.toString(),
        userId: userId.toString(),
      },
    });

    if (!ruleDb) return null;
    return folderAccessRulePrismaToDomain(ruleDb);
  }

  async findByFolderAndGroup(
    folderId: UniqueEntityID,
    groupId: UniqueEntityID,
  ): Promise<FolderAccessRule | null> {
    const ruleDb = await prisma.folderAccessRule.findFirst({
      where: {
        folderId: folderId.toString(),
        groupId: groupId.toString(),
      },
    });

    if (!ruleDb) return null;
    return folderAccessRulePrismaToDomain(ruleDb);
  }

  async deleteRule(id: UniqueEntityID): Promise<void> {
    await prisma.folderAccessRule.delete({
      where: { id: id.toString() },
    });
  }

  async deleteInheritedByFolder(folderId: UniqueEntityID): Promise<void> {
    await prisma.folderAccessRule.deleteMany({
      where: {
        folderId: folderId.toString(),
        isInherited: true,
      },
    });
  }

  async deleteInheritedByFolderAndSubject(
    folderId: UniqueEntityID,
    userId: UniqueEntityID | null,
    groupId: UniqueEntityID | null,
  ): Promise<void> {
    const whereCondition: Record<string, unknown> = {
      folderId: folderId.toString(),
      isInherited: true,
    };

    if (userId) {
      whereCondition.userId = userId.toString();
    }

    if (groupId) {
      whereCondition.groupId = groupId.toString();
    }

    await prisma.folderAccessRule.deleteMany({
      where: whereCondition,
    });
  }

  async findByFolderIds(
    folderIds: string[],
    tenantId: string,
  ): Promise<Map<string, FolderAccessRule[]>> {
    const rulesDb = await prisma.folderAccessRule.findMany({
      where: {
        folderId: { in: folderIds },
        tenantId,
      },
      orderBy: { createdAt: 'asc' },
    });

    const map = new Map<string, FolderAccessRule[]>();
    for (const folderId of folderIds) {
      map.set(folderId, []);
    }
    for (const ruleDb of rulesDb) {
      const rule = folderAccessRulePrismaToDomain(ruleDb);
      const list = map.get(ruleDb.folderId);
      if (list) {
        list.push(rule);
      }
    }

    return map;
  }

  async findEffectiveAccess(
    folderId: UniqueEntityID,
    userId: UniqueEntityID,
    groupIds: UniqueEntityID[],
  ): Promise<FolderAccessRule[]> {
    const groupIdStrings = groupIds.map((groupId) => groupId.toString());

    const rulesDb = await prisma.folderAccessRule.findMany({
      where: {
        folderId: folderId.toString(),
        OR: [
          { userId: userId.toString() },
          { groupId: { in: groupIdStrings } },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    return rulesDb.map(folderAccessRulePrismaToDomain);
  }
}
