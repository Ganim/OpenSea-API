import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { PermissionGroupPermission } from '@/entities/rbac/permission-group-permission';
import { PermissionEffect } from '@/entities/rbac/value-objects/permission-effect';
import { prisma } from '@/lib/prisma';
import { mapPermissionPrismaToDomain } from '@/mappers/rbac/permission-prisma-to-domain';
import type {
  AddPermissionToGroupSchema,
  PermissionGroupPermissionsRepository,
  UpdateGroupPermissionSchema,
} from '../permission-group-permissions-repository';

export class PrismaPermissionGroupPermissionsRepository
  implements PermissionGroupPermissionsRepository
{
  // CREATE
  async add(
    data: AddPermissionToGroupSchema,
  ): Promise<PermissionGroupPermission> {
    const assignment = await prisma.permissionGroupPermission.create({
      data: {
        groupId: data.groupId.toString(),
        permissionId: data.permissionId.toString(),
        effect: data.effect.value,
        conditions: (data.conditions as never) ?? null,
      },
    });

    return PermissionGroupPermission.create(
      {
        id: new UniqueEntityID(assignment.id),
        groupId: new UniqueEntityID(assignment.groupId),
        permissionId: new UniqueEntityID(assignment.permissionId),
        effect: PermissionEffect.create(assignment.effect),
        conditions: assignment.conditions as Record<string, unknown> | null,
        createdAt: assignment.createdAt,
      },
      new UniqueEntityID(assignment.id),
    );
  }

  async addMany(data: AddPermissionToGroupSchema[]): Promise<void> {
    await prisma.permissionGroupPermission.createMany({
      data: data.map((d) => ({
        groupId: d.groupId.toString(),
        permissionId: d.permissionId.toString(),
        effect: d.effect.value,
        conditions: (d.conditions as never) ?? null,
      })),
      skipDuplicates: true,
    });
  }

  // UPDATE
  async update(
    data: UpdateGroupPermissionSchema,
  ): Promise<PermissionGroupPermission | null> {
    try {
      const assignment = await prisma.permissionGroupPermission.update({
        where: { id: data.id.toString() },
        data: {
          effect: data.effect?.value,
          conditions: (data.conditions as never) ?? undefined,
        },
      });

      return PermissionGroupPermission.create(
        {
          id: new UniqueEntityID(assignment.id),
          groupId: new UniqueEntityID(assignment.groupId),
          permissionId: new UniqueEntityID(assignment.permissionId),
          effect: PermissionEffect.create(assignment.effect),
          conditions: assignment.conditions as Record<string, unknown> | null,
          createdAt: assignment.createdAt,
        },
        new UniqueEntityID(assignment.id),
      );
    } catch {
      return null;
    }
  }

  // DELETE
  async remove(
    groupId: UniqueEntityID,
    permissionId: UniqueEntityID,
  ): Promise<void> {
    await prisma.permissionGroupPermission.deleteMany({
      where: {
        groupId: groupId.toString(),
        permissionId: permissionId.toString(),
      },
    });
  }

  async removeAllFromGroup(groupId: UniqueEntityID): Promise<void> {
    await prisma.permissionGroupPermission.deleteMany({
      where: { groupId: groupId.toString() },
    });
  }

  async removeAllFromPermission(permissionId: UniqueEntityID): Promise<void> {
    await prisma.permissionGroupPermission.deleteMany({
      where: { permissionId: permissionId.toString() },
    });
  }

  // RETRIEVE
  async findById(
    id: UniqueEntityID,
  ): Promise<PermissionGroupPermission | null> {
    const assignment = await prisma.permissionGroupPermission.findUnique({
      where: { id: id.toString() },
    });

    if (!assignment) return null;

    return PermissionGroupPermission.create(
      {
        id: new UniqueEntityID(assignment.id),
        groupId: new UniqueEntityID(assignment.groupId),
        permissionId: new UniqueEntityID(assignment.permissionId),
        effect: PermissionEffect.create(assignment.effect),
        conditions: assignment.conditions as Record<string, unknown> | null,
        createdAt: assignment.createdAt,
      },
      new UniqueEntityID(assignment.id),
    );
  }

  async findByGroupAndPermission(
    groupId: UniqueEntityID,
    permissionId: UniqueEntityID,
  ): Promise<PermissionGroupPermission | null> {
    const assignment = await prisma.permissionGroupPermission.findUnique({
      where: {
        groupId_permissionId: {
          groupId: groupId.toString(),
          permissionId: permissionId.toString(),
        },
      },
    });

    if (!assignment) return null;

    return PermissionGroupPermission.create(
      {
        id: new UniqueEntityID(assignment.id),
        groupId: new UniqueEntityID(assignment.groupId),
        permissionId: new UniqueEntityID(assignment.permissionId),
        effect: PermissionEffect.create(assignment.effect),
        conditions: assignment.conditions as Record<string, unknown> | null,
        createdAt: assignment.createdAt,
      },
      new UniqueEntityID(assignment.id),
    );
  }

  // LIST
  async listByGroupId(
    groupId: UniqueEntityID,
  ): Promise<PermissionGroupPermission[]> {
    const assignments = await prisma.permissionGroupPermission.findMany({
      where: { groupId: groupId.toString() },
    });

    return assignments.map((assignment) =>
      PermissionGroupPermission.create(
        {
          id: new UniqueEntityID(assignment.id),
          groupId: new UniqueEntityID(assignment.groupId),
          permissionId: new UniqueEntityID(assignment.permissionId),
          effect: PermissionEffect.create(assignment.effect),
          conditions: assignment.conditions as Record<string, unknown> | null,
          createdAt: assignment.createdAt,
        },
        new UniqueEntityID(assignment.id),
      ),
    );
  }

  async listByPermissionId(
    permissionId: UniqueEntityID,
  ): Promise<PermissionGroupPermission[]> {
    const assignments = await prisma.permissionGroupPermission.findMany({
      where: { permissionId: permissionId.toString() },
    });

    return assignments.map((assignment) =>
      PermissionGroupPermission.create(
        {
          id: new UniqueEntityID(assignment.id),
          groupId: new UniqueEntityID(assignment.groupId),
          permissionId: new UniqueEntityID(assignment.permissionId),
          effect: PermissionEffect.create(assignment.effect),
          conditions: assignment.conditions as Record<string, unknown> | null,
          createdAt: assignment.createdAt,
        },
        new UniqueEntityID(assignment.id),
      ),
    );
  }

  /**
   * Lista permissões de um grupo com seus efeitos (allow/deny)
   */
  async listPermissionsByGroupId(
    groupId: UniqueEntityID,
  ): Promise<Permission[]> {
    const assignments = await prisma.permissionGroupPermission.findMany({
      where: { groupId: groupId.toString() },
      include: {
        permission: true,
      },
    });

    return assignments.map((a) => mapPermissionPrismaToDomain(a.permission));
  }

  /**
   * Lista permissões de múltiplos grupos (útil para agregar permissões)
   */
  async listPermissionsByGroupIds(
    groupIds: UniqueEntityID[],
  ): Promise<Permission[]> {
    const assignments = await prisma.permissionGroupPermission.findMany({
      where: {
        groupId: { in: groupIds.map((id) => id.toString()) },
      },
      include: {
        permission: true,
      },
    });

    // Remover duplicatas
    const uniquePermissions = new Map<string, Permission>();

    for (const a of assignments) {
      if (!uniquePermissions.has(a.permission.id)) {
        uniquePermissions.set(
          a.permission.id,
          mapPermissionPrismaToDomain(a.permission),
        );
      }
    }

    return Array.from(uniquePermissions.values());
  }

  /**
   * Lista permissões com efeitos (útil para exibir allow/deny na UI)
   */
  async listPermissionsWithEffect(
    groupId: UniqueEntityID,
  ): Promise<{ permission: Permission; effect: PermissionEffect }[]> {
    const assignments = await prisma.permissionGroupPermission.findMany({
      where: { groupId: groupId.toString() },
      include: {
        permission: true,
      },
    });

    return assignments.map((a) => ({
      permission: mapPermissionPrismaToDomain(a.permission),
      effect: PermissionEffect.create(a.effect),
    }));
  }

  /**
   * Lista permissões com efeitos e condições (usado por PermissionService)
   */
  async listPermissionsWithEffects(groupId: UniqueEntityID): Promise<
    {
      permission: Permission;
      effect: string;
      conditions: Record<string, unknown> | null;
    }[]
  > {
    const assignments = await prisma.permissionGroupPermission.findMany({
      where: { groupId: groupId.toString() },
      include: {
        permission: true,
      },
    });

    return assignments.map((a) => ({
      permission: mapPermissionPrismaToDomain(a.permission),
      effect: a.effect,
      conditions: a.conditions as Record<string, unknown> | null,
    }));
  }

  // UTILITY
  async exists(
    groupId: UniqueEntityID,
    permissionId: UniqueEntityID,
  ): Promise<boolean> {
    const assignment = await prisma.permissionGroupPermission.findUnique({
      where: {
        groupId_permissionId: {
          groupId: groupId.toString(),
          permissionId: permissionId.toString(),
        },
      },
      select: { id: true },
    });

    return !!assignment;
  }

  async countByGroupId(groupId: UniqueEntityID): Promise<number> {
    return await prisma.permissionGroupPermission.count({
      where: { groupId: groupId.toString() },
    });
  }

  async countByPermissionId(permissionId: UniqueEntityID): Promise<number> {
    return await prisma.permissionGroupPermission.count({
      where: { permissionId: permissionId.toString() },
    });
  }
}
