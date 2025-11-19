import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { PermissionGroup } from '@/entities/rbac/permission-group';
import { UserPermissionGroup } from '@/entities/rbac/user-permission-group';
import { prisma } from '@/lib/prisma';
import { mapPermissionGroupPrismaToDomain } from '@/mappers/rbac/permission-group-prisma-to-domain';
import { mapPermissionPrismaToDomain } from '@/mappers/rbac/permission-prisma-to-domain';
import type { Prisma } from '@prisma/client';
import type {
  AssignGroupToUserSchema,
  ListUserGroupsParams,
  UpdateUserGroupSchema,
  UserPermissionGroupsRepository,
} from '../user-permission-groups-repository';

export class PrismaUserPermissionGroupsRepository
  implements UserPermissionGroupsRepository
{
  // CREATE
  async assign(data: AssignGroupToUserSchema): Promise<UserPermissionGroup> {
    const assignment = await prisma.userPermissionGroup.create({
      data: {
        userId: data.userId.toString(),
        groupId: data.groupId.toString(),
        expiresAt: data.expiresAt,
        grantedBy: data.grantedBy?.toString() ?? null,
      },
    });

    return UserPermissionGroup.create(
      {
        id: new UniqueEntityID(assignment.id),
        userId: new UniqueEntityID(assignment.userId),
        groupId: new UniqueEntityID(assignment.groupId),
        expiresAt: assignment.expiresAt,
        grantedBy: assignment.grantedBy
          ? new UniqueEntityID(assignment.grantedBy)
          : null,
        createdAt: assignment.createdAt,
      },
      new UniqueEntityID(assignment.id),
    );
  }

  async assignMany(data: AssignGroupToUserSchema[]): Promise<void> {
    await prisma.userPermissionGroup.createMany({
      data: data.map((d) => ({
        userId: d.userId.toString(),
        groupId: d.groupId.toString(),
        expiresAt: d.expiresAt,
        grantedBy: d.grantedBy?.toString() ?? null,
      })),
      skipDuplicates: true,
    });
  }

  // UPDATE
  async update(
    data: UpdateUserGroupSchema,
  ): Promise<UserPermissionGroup | null> {
    try {
      const assignment = await prisma.userPermissionGroup.update({
        where: { id: data.id.toString() },
        data: {
          expiresAt: data.expiresAt ?? undefined,
        },
      });

      return UserPermissionGroup.create(
        {
          id: new UniqueEntityID(assignment.id),
          userId: new UniqueEntityID(assignment.userId),
          groupId: new UniqueEntityID(assignment.groupId),
          expiresAt: assignment.expiresAt,
          grantedBy: assignment.grantedBy
            ? new UniqueEntityID(assignment.grantedBy)
            : null,
          createdAt: assignment.createdAt,
        },
        new UniqueEntityID(assignment.id),
      );
    } catch {
      return null;
    }
  }

  // DELETE
  async remove(userId: UniqueEntityID, groupId: UniqueEntityID): Promise<void> {
    await prisma.userPermissionGroup.deleteMany({
      where: {
        userId: userId.toString(),
        groupId: groupId.toString(),
      },
    });
  }

  async removeAllFromUser(userId: UniqueEntityID): Promise<void> {
    await prisma.userPermissionGroup.deleteMany({
      where: { userId: userId.toString() },
    });
  }

  async removeAllUsersFromGroup(groupId: UniqueEntityID): Promise<void> {
    await prisma.userPermissionGroup.deleteMany({
      where: { groupId: groupId.toString() },
    });
  }

  async removeExpired(): Promise<number> {
    const result = await prisma.userPermissionGroup.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    return result.count;
  }

  // RETRIEVE
  async findById(id: UniqueEntityID): Promise<UserPermissionGroup | null> {
    const assignment = await prisma.userPermissionGroup.findUnique({
      where: { id: id.toString() },
    });

    if (!assignment) return null;

    return UserPermissionGroup.create(
      {
        id: new UniqueEntityID(assignment.id),
        userId: new UniqueEntityID(assignment.userId),
        groupId: new UniqueEntityID(assignment.groupId),
        expiresAt: assignment.expiresAt,
        grantedBy: assignment.grantedBy
          ? new UniqueEntityID(assignment.grantedBy)
          : null,
        createdAt: assignment.createdAt,
      },
      new UniqueEntityID(assignment.id),
    );
  }

  async findByUserAndGroup(
    userId: UniqueEntityID,
    groupId: UniqueEntityID,
  ): Promise<UserPermissionGroup | null> {
    const assignment = await prisma.userPermissionGroup.findUnique({
      where: {
        userId_groupId: {
          userId: userId.toString(),
          groupId: groupId.toString(),
        },
      },
    });

    if (!assignment) return null;

    return UserPermissionGroup.create(
      {
        id: new UniqueEntityID(assignment.id),
        userId: new UniqueEntityID(assignment.userId),
        groupId: new UniqueEntityID(assignment.groupId),
        expiresAt: assignment.expiresAt,
        grantedBy: assignment.grantedBy
          ? new UniqueEntityID(assignment.grantedBy)
          : null,
        createdAt: assignment.createdAt,
      },
      new UniqueEntityID(assignment.id),
    );
  }

  // LIST
  async listByUserId(
    userId: UniqueEntityID,
    params?: ListUserGroupsParams,
  ): Promise<UserPermissionGroup[]> {
    const { includeExpired = false, includeInactive = false } = params || {};

    const now = new Date();

    const assignments = await prisma.userPermissionGroup.findMany({
      where: {
        userId: userId.toString(),
        ...(includeExpired
          ? {}
          : {
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            }),
      },
      include: {
        group: true,
      },
    });

    // Filtrar grupos inativos se necessário
    const filteredAssignments = includeInactive
      ? assignments
      : assignments.filter((a) => a.group.isActive);

    return filteredAssignments.map((assignment) =>
      UserPermissionGroup.create(
        {
          id: new UniqueEntityID(assignment.id),
          userId: new UniqueEntityID(assignment.userId),
          groupId: new UniqueEntityID(assignment.groupId),
          expiresAt: assignment.expiresAt,
          grantedBy: assignment.grantedBy
            ? new UniqueEntityID(assignment.grantedBy)
            : null,
          createdAt: assignment.createdAt,
        },
        new UniqueEntityID(assignment.id),
      ),
    );
  }

  async listByGroupId(groupId: UniqueEntityID): Promise<UserPermissionGroup[]> {
    const now = new Date();

    const assignments = await prisma.userPermissionGroup.findMany({
      where: {
        groupId: groupId.toString(),
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });

    return assignments.map((assignment) =>
      UserPermissionGroup.create(
        {
          id: new UniqueEntityID(assignment.id),
          userId: new UniqueEntityID(assignment.userId),
          groupId: new UniqueEntityID(assignment.groupId),
          expiresAt: assignment.expiresAt,
          grantedBy: assignment.grantedBy
            ? new UniqueEntityID(assignment.grantedBy)
            : null,
          createdAt: assignment.createdAt,
        },
        new UniqueEntityID(assignment.id),
      ),
    );
  }

  async listByGroupIdIncludingExpired(
    groupId: UniqueEntityID,
  ): Promise<UserPermissionGroup[]> {
    const assignments = await prisma.userPermissionGroup.findMany({
      where: { groupId: groupId.toString() },
    });

    return assignments.map((assignment) =>
      UserPermissionGroup.create(
        {
          id: new UniqueEntityID(assignment.id),
          userId: new UniqueEntityID(assignment.userId),
          groupId: new UniqueEntityID(assignment.groupId),
          expiresAt: assignment.expiresAt,
          grantedBy: assignment.grantedBy
            ? new UniqueEntityID(assignment.grantedBy)
            : null,
          createdAt: assignment.createdAt,
        },
        new UniqueEntityID(assignment.id),
      ),
    );
  }

  async listActiveByUserId(
    userId: UniqueEntityID,
  ): Promise<UserPermissionGroup[]> {
    return this.listByUserId(userId, {
      includeExpired: false,
      includeInactive: false,
    });
  }

  // COMPLEX QUERIES
  async listGroupsByUserId(
    userId: UniqueEntityID,
    params?: ListUserGroupsParams,
  ): Promise<PermissionGroup[]> {
    const { includeExpired = false, includeInactive = false } = params || {};

    const now = new Date();

    const assignments = await prisma.userPermissionGroup.findMany({
      where: {
        userId: userId.toString(),
        ...(includeExpired
          ? {}
          : {
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            }),
      },
      include: {
        group: true,
      },
    });

    // Filtrar grupos inativos e deletados
    const filteredGroups = assignments
      .filter(
        (a) =>
          !a.group.deletedAt && (includeInactive ? true : a.group.isActive),
      )
      .map((a) => mapPermissionGroupPrismaToDomain(a.group));

    return filteredGroups;
  }

  async listUsersByGroupId(groupId: UniqueEntityID): Promise<UniqueEntityID[]> {
    const assignments = await prisma.userPermissionGroup.findMany({
      where: { groupId: groupId.toString() },
      select: { userId: true },
    });

    return assignments.map((a) => new UniqueEntityID(a.userId));
  }

  /**
   * Lista todas as permissões de um usuário (agregando de todos os grupos)
   * Inclui herança de grupos pais
   */
  async listUserPermissions(userId: UniqueEntityID): Promise<Permission[]> {
    // 1. Buscar todos os grupos ativos do usuário (não expirados)
    const now = new Date();

    const userGroups = await prisma.userPermissionGroup.findMany({
      where: {
        userId: userId.toString(),
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: {
        group: true,
      },
    });

    const activeGroupIds = userGroups
      .filter((ug) => ug.group && ug.group.isActive && !ug.group.deletedAt)
      .map((ug) => ug.groupId);

    if (activeGroupIds.length === 0) return [];

    // 2. Buscar todos os ancestrais (grupos pais) para herança
    const allGroupIds = new Set<string>(activeGroupIds);

    for (const groupId of activeGroupIds) {
      const ancestors = await this.getAncestorGroupIds(groupId);
      ancestors.forEach((id) => allGroupIds.add(id));
    }

    // 3. Buscar todas as permissões desses grupos
    const groupPermissions = await prisma.permissionGroupPermission.findMany({
      where: {
        groupId: { in: Array.from(allGroupIds) },
        effect: 'allow', // Apenas permissões "allow" (deny será tratado depois)
      },
      include: {
        permission: true,
      },
    });

    // 4. Remover duplicatas (mesma permissão pode estar em múltiplos grupos)
    const uniquePermissions = new Map<string, Permission>();

    for (const gp of groupPermissions) {
      if (!uniquePermissions.has(gp.permission.id)) {
        uniquePermissions.set(
          gp.permission.id,
          mapPermissionPrismaToDomain(gp.permission),
        );
      }
    }

    return Array.from(uniquePermissions.values());
  }

  /**
   * Lista permissões com seus efeitos (allow/deny) para um usuário
   * Importante para aplicar precedência de deny
   */
  async listUserPermissionsWithEffects(userId: UniqueEntityID): Promise<
    {
      permission: Permission;
      effect: string;
      groupId: UniqueEntityID;
      conditions: Prisma.JsonValue;
    }[]
  > {
    // 1. Buscar todos os grupos ativos do usuário
    const now = new Date();

    const userGroups = await prisma.userPermissionGroup.findMany({
      where: {
        userId: userId.toString(),
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: {
        group: true,
      },
    });

    const activeGroupIds = userGroups
      .filter((ug) => ug.group && ug.group.isActive && !ug.group.deletedAt)
      .map((ug) => ug.groupId);

    if (activeGroupIds.length === 0) return [];

    // 2. Incluir ancestrais para herança
    const allGroupIds = new Set<string>(activeGroupIds);

    for (const groupId of activeGroupIds) {
      const ancestors = await this.getAncestorGroupIds(groupId);
      ancestors.forEach((id) => allGroupIds.add(id));
    }

    // 3. Buscar todas as permissões com seus efeitos
    const groupPermissions = await prisma.permissionGroupPermission.findMany({
      where: {
        groupId: { in: Array.from(allGroupIds) },
      },
      include: {
        permission: true,
      },
      orderBy: {
        group: {
          priority: 'desc', // Grupos com maior prioridade primeiro
        },
      },
    });

    return groupPermissions.map((gp) => ({
      permission: mapPermissionPrismaToDomain(gp.permission),
      effect: gp.effect,
      groupId: new UniqueEntityID(gp.groupId),
      conditions: gp.conditions,
    }));
  }

  // UTILITY
  async exists(
    userId: UniqueEntityID,
    groupId: UniqueEntityID,
  ): Promise<boolean> {
    const assignment = await prisma.userPermissionGroup.findUnique({
      where: {
        userId_groupId: {
          userId: userId.toString(),
          groupId: groupId.toString(),
        },
      },
      select: { id: true },
    });

    return !!assignment;
  }

  async countByUserId(userId: UniqueEntityID): Promise<number> {
    return await prisma.userPermissionGroup.count({
      where: { userId: userId.toString() },
    });
  }

  async countByGroupId(groupId: UniqueEntityID): Promise<number> {
    return await prisma.userPermissionGroup.count({
      where: { groupId: groupId.toString() },
    });
  }

  async countUsersInGroup(groupId: UniqueEntityID): Promise<number> {
    const assignments = await prisma.userPermissionGroup.findMany({
      where: { groupId: groupId.toString() },
      select: { userId: true },
      distinct: ['userId'],
    });

    return assignments.length;
  }

  // HELPER: Buscar IDs de grupos ancestrais (para herança)
  private async getAncestorGroupIds(groupId: string): Promise<string[]> {
    const ancestors: string[] = [];
    let currentId: string | null = groupId;

    while (currentId) {
      const group: {
        parentId: string | null;
      } | null = await prisma.permissionGroup.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

      if (!group || !group.parentId) break;

      ancestors.push(group.parentId);
      currentId = group.parentId;
    }

    return ancestors;
  }
}
