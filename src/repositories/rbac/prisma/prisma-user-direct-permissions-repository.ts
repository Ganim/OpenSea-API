import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { UserDirectPermission } from '@/entities/rbac/user-direct-permission';
import { prisma } from '@/lib/prisma';
import { mapPermissionPrismaToDomain } from '@/mappers/rbac/permission-prisma-to-domain';
import type { Prisma } from '@prisma/generated/client.js';
import type {
  GrantDirectPermissionSchema,
  ListUserDirectPermissionsParams,
  UpdateDirectPermissionSchema,
  UserDirectPermissionsRepository,
} from '../user-direct-permissions-repository';

export class PrismaUserDirectPermissionsRepository
  implements UserDirectPermissionsRepository
{
  // CREATE
  async grant(
    data: GrantDirectPermissionSchema,
  ): Promise<UserDirectPermission> {
    const directPermission = await prisma.userDirectPermission.create({
      data: {
        userId: data.userId.toString(),
        permissionId: data.permissionId.toString(),
        effect: data.effect ?? 'allow',
        conditions: (data.conditions as Prisma.InputJsonValue) ?? null,
        expiresAt: data.expiresAt ?? null,
        grantedBy: data.grantedBy?.toString() ?? null,
      },
    });

    return UserDirectPermission.create(
      {
        id: new UniqueEntityID(directPermission.id),
        userId: new UniqueEntityID(directPermission.userId),
        permissionId: new UniqueEntityID(directPermission.permissionId),
        effect: directPermission.effect as 'allow' | 'deny',
        conditions: directPermission.conditions as Record<
          string,
          unknown
        > | null,
        expiresAt: directPermission.expiresAt,
        grantedBy: directPermission.grantedBy
          ? new UniqueEntityID(directPermission.grantedBy)
          : null,
        createdAt: directPermission.createdAt,
      },
      new UniqueEntityID(directPermission.id),
    );
  }

  async grantMany(data: GrantDirectPermissionSchema[]): Promise<void> {
    await prisma.userDirectPermission.createMany({
      data: data.map((d) => ({
        userId: d.userId.toString(),
        permissionId: d.permissionId.toString(),
        effect: d.effect ?? 'allow',
        conditions: (d.conditions as Prisma.InputJsonValue) ?? null,
        expiresAt: d.expiresAt ?? null,
        grantedBy: d.grantedBy?.toString() ?? null,
      })),
      skipDuplicates: true,
    });
  }

  // UPDATE
  async update(
    data: UpdateDirectPermissionSchema,
  ): Promise<UserDirectPermission | null> {
    try {
      const directPermission = await prisma.userDirectPermission.update({
        where: { id: data.id.toString() },
        data: {
          effect: data.effect,
          conditions:
            (data.conditions as Prisma.InputJsonValue | undefined) ?? undefined,
          expiresAt: data.expiresAt ?? undefined,
        },
      });

      return UserDirectPermission.create(
        {
          id: new UniqueEntityID(directPermission.id),
          userId: new UniqueEntityID(directPermission.userId),
          permissionId: new UniqueEntityID(directPermission.permissionId),
          effect: directPermission.effect as 'allow' | 'deny',
          conditions: directPermission.conditions as Record<
            string,
            unknown
          > | null,
          expiresAt: directPermission.expiresAt,
          grantedBy: directPermission.grantedBy
            ? new UniqueEntityID(directPermission.grantedBy)
            : null,
          createdAt: directPermission.createdAt,
        },
        new UniqueEntityID(directPermission.id),
      );
    } catch {
      return null;
    }
  }

  // DELETE
  async revoke(
    userId: UniqueEntityID,
    permissionId: UniqueEntityID,
  ): Promise<void> {
    await prisma.userDirectPermission.deleteMany({
      where: {
        userId: userId.toString(),
        permissionId: permissionId.toString(),
      },
    });
  }

  async revokeAllFromUser(userId: UniqueEntityID): Promise<void> {
    await prisma.userDirectPermission.deleteMany({
      where: { userId: userId.toString() },
    });
  }

  async revokePermissionFromAllUsers(
    permissionId: UniqueEntityID,
  ): Promise<void> {
    await prisma.userDirectPermission.deleteMany({
      where: { permissionId: permissionId.toString() },
    });
  }

  async revokeExpired(): Promise<number> {
    const result = await prisma.userDirectPermission.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });

    return result.count;
  }

  // RETRIEVE
  async findById(id: UniqueEntityID): Promise<UserDirectPermission | null> {
    const directPermission = await prisma.userDirectPermission.findUnique({
      where: { id: id.toString() },
    });

    if (!directPermission) return null;

    return UserDirectPermission.create(
      {
        id: new UniqueEntityID(directPermission.id),
        userId: new UniqueEntityID(directPermission.userId),
        permissionId: new UniqueEntityID(directPermission.permissionId),
        effect: directPermission.effect as 'allow' | 'deny',
        conditions: directPermission.conditions as Record<
          string,
          unknown
        > | null,
        expiresAt: directPermission.expiresAt,
        grantedBy: directPermission.grantedBy
          ? new UniqueEntityID(directPermission.grantedBy)
          : null,
        createdAt: directPermission.createdAt,
      },
      new UniqueEntityID(directPermission.id),
    );
  }

  async findByUserAndPermission(
    userId: UniqueEntityID,
    permissionId: UniqueEntityID,
  ): Promise<UserDirectPermission | null> {
    const directPermission = await prisma.userDirectPermission.findUnique({
      where: {
        userId_permissionId: {
          userId: userId.toString(),
          permissionId: permissionId.toString(),
        },
      },
    });

    if (!directPermission) return null;

    return UserDirectPermission.create(
      {
        id: new UniqueEntityID(directPermission.id),
        userId: new UniqueEntityID(directPermission.userId),
        permissionId: new UniqueEntityID(directPermission.permissionId),
        effect: directPermission.effect as 'allow' | 'deny',
        conditions: directPermission.conditions as Record<
          string,
          unknown
        > | null,
        expiresAt: directPermission.expiresAt,
        grantedBy: directPermission.grantedBy
          ? new UniqueEntityID(directPermission.grantedBy)
          : null,
        createdAt: directPermission.createdAt,
      },
      new UniqueEntityID(directPermission.id),
    );
  }

  // LIST
  async listByUserId(
    userId: UniqueEntityID,
    params?: ListUserDirectPermissionsParams,
  ): Promise<UserDirectPermission[]> {
    const { includeExpired = false, effect } = params || {};

    const now = new Date();

    const directPermissions = await prisma.userDirectPermission.findMany({
      where: {
        userId: userId.toString(),
        ...(effect ? { effect } : {}),
        ...(includeExpired
          ? {}
          : {
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            }),
      },
    });

    return directPermissions.map((dp) =>
      UserDirectPermission.create(
        {
          id: new UniqueEntityID(dp.id),
          userId: new UniqueEntityID(dp.userId),
          permissionId: new UniqueEntityID(dp.permissionId),
          effect: dp.effect as 'allow' | 'deny',
          conditions: dp.conditions as Record<string, unknown> | null,
          expiresAt: dp.expiresAt,
          grantedBy: dp.grantedBy ? new UniqueEntityID(dp.grantedBy) : null,
          createdAt: dp.createdAt,
        },
        new UniqueEntityID(dp.id),
      ),
    );
  }

  async listByPermissionId(
    permissionId: UniqueEntityID,
  ): Promise<UserDirectPermission[]> {
    const now = new Date();

    const directPermissions = await prisma.userDirectPermission.findMany({
      where: {
        permissionId: permissionId.toString(),
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    });

    return directPermissions.map((dp) =>
      UserDirectPermission.create(
        {
          id: new UniqueEntityID(dp.id),
          userId: new UniqueEntityID(dp.userId),
          permissionId: new UniqueEntityID(dp.permissionId),
          effect: dp.effect as 'allow' | 'deny',
          conditions: dp.conditions as Record<string, unknown> | null,
          expiresAt: dp.expiresAt,
          grantedBy: dp.grantedBy ? new UniqueEntityID(dp.grantedBy) : null,
          createdAt: dp.createdAt,
        },
        new UniqueEntityID(dp.id),
      ),
    );
  }

  async listActiveByUserId(
    userId: UniqueEntityID,
  ): Promise<UserDirectPermission[]> {
    return this.listByUserId(userId, { includeExpired: false });
  }

  // COMPLEX QUERIES
  async listPermissionsByUserId(
    userId: UniqueEntityID,
    params?: ListUserDirectPermissionsParams,
  ): Promise<Permission[]> {
    const { includeExpired = false, effect } = params || {};

    const now = new Date();

    const directPermissions = await prisma.userDirectPermission.findMany({
      where: {
        userId: userId.toString(),
        ...(effect ? { effect } : {}),
        ...(includeExpired
          ? {}
          : {
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            }),
      },
      include: {
        permission: true,
      },
    });

    return directPermissions.map((dp) =>
      mapPermissionPrismaToDomain(dp.permission),
    );
  }

  async listUsersByPermissionId(
    permissionId: UniqueEntityID,
  ): Promise<UniqueEntityID[]> {
    const now = new Date();

    const directPermissions = await prisma.userDirectPermission.findMany({
      where: {
        permissionId: permissionId.toString(),
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    return directPermissions.map((dp) => new UniqueEntityID(dp.userId));
  }

  async listUserPermissionsWithEffects(userId: UniqueEntityID): Promise<
    {
      permission: Permission;
      effect: string;
      conditions: Record<string, unknown> | null;
    }[]
  > {
    const now = new Date();

    const directPermissions = await prisma.userDirectPermission.findMany({
      where: {
        userId: userId.toString(),
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: {
        permission: true,
      },
    });

    return directPermissions.map((dp) => ({
      permission: mapPermissionPrismaToDomain(dp.permission),
      effect: dp.effect,
      conditions: dp.conditions as Record<string, unknown> | null,
    }));
  }

  // UTILITY
  async exists(
    userId: UniqueEntityID,
    permissionId: UniqueEntityID,
  ): Promise<boolean> {
    const directPermission = await prisma.userDirectPermission.findUnique({
      where: {
        userId_permissionId: {
          userId: userId.toString(),
          permissionId: permissionId.toString(),
        },
      },
      select: { id: true },
    });

    return !!directPermission;
  }

  async countByUserId(userId: UniqueEntityID): Promise<number> {
    return await prisma.userDirectPermission.count({
      where: { userId: userId.toString() },
    });
  }

  async countByPermissionId(permissionId: UniqueEntityID): Promise<number> {
    return await prisma.userDirectPermission.count({
      where: { permissionId: permissionId.toString() },
    });
  }

  async countUsersWithPermission(
    permissionId: UniqueEntityID,
  ): Promise<number> {
    const directPermissions = await prisma.userDirectPermission.findMany({
      where: { permissionId: permissionId.toString() },
      select: { userId: true },
      distinct: ['userId'],
    });

    return directPermissions.length;
  }
}
