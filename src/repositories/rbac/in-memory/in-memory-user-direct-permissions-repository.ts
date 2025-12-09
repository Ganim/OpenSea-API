import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { UserDirectPermission } from '@/entities/rbac/user-direct-permission';
import type { PermissionsRepository } from '../permissions-repository';
import type {
  GrantDirectPermissionSchema,
  ListUserDirectPermissionsParams,
  UpdateDirectPermissionSchema,
  UserDirectPermissionsRepository,
} from '../user-direct-permissions-repository';

export class InMemoryUserDirectPermissionsRepository
  implements UserDirectPermissionsRepository
{
  public items: UserDirectPermission[] = [];

  constructor(private permissionsRepository?: PermissionsRepository) {}

  async grant(
    data: GrantDirectPermissionSchema,
  ): Promise<UserDirectPermission> {
    const directPermission = UserDirectPermission.create({
      id: new UniqueEntityID(),
      userId: data.userId,
      permissionId: data.permissionId,
      effect: data.effect ?? 'allow',
      conditions: data.conditions ?? null,
      expiresAt: data.expiresAt ?? null,
      grantedBy: data.grantedBy ?? null,
    });

    this.items.push(directPermission);
    return directPermission;
  }

  async grantMany(data: GrantDirectPermissionSchema[]): Promise<void> {
    const directPermissions = data.map((item) =>
      UserDirectPermission.create({
        id: new UniqueEntityID(),
        userId: item.userId,
        permissionId: item.permissionId,
        effect: item.effect ?? 'allow',
        conditions: item.conditions ?? null,
        expiresAt: item.expiresAt ?? null,
        grantedBy: item.grantedBy ?? null,
      }),
    );

    this.items.push(...directPermissions);
  }

  async update(
    data: UpdateDirectPermissionSchema,
  ): Promise<UserDirectPermission | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));

    if (index === -1) return null;

    const directPermission = this.items[index];
    const updated = UserDirectPermission.create(
      {
        id: directPermission.id,
        userId: directPermission.userId,
        permissionId: directPermission.permissionId,
        effect: data.effect ?? directPermission.effect,
        conditions:
          data.conditions !== undefined
            ? data.conditions
            : directPermission.conditions,
        expiresAt:
          data.expiresAt !== undefined
            ? data.expiresAt
            : directPermission.expiresAt,
        grantedBy: directPermission.grantedBy,
        createdAt: directPermission.createdAt,
      },
      directPermission.id,
    );

    this.items[index] = updated;
    return updated;
  }

  async revoke(
    userId: UniqueEntityID,
    permissionId: UniqueEntityID,
  ): Promise<void> {
    const index = this.items.findIndex(
      (item) =>
        item.userId.equals(userId) && item.permissionId.equals(permissionId),
    );

    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  async revokeAllFromUser(userId: UniqueEntityID): Promise<void> {
    this.items = this.items.filter((item) => !item.userId.equals(userId));
  }

  async revokePermissionFromAllUsers(permissionId: UniqueEntityID): Promise<void> {
    this.items = this.items.filter(
      (item) => !item.permissionId.equals(permissionId),
    );
  }

  async revokeExpired(): Promise<number> {
    const now = new Date();
    const beforeCount = this.items.length;

    this.items = this.items.filter(
      (item) => !item.expiresAt || item.expiresAt > now,
    );

    return beforeCount - this.items.length;
  }

  async findById(id: UniqueEntityID): Promise<UserDirectPermission | null> {
    return this.items.find((item) => item.id.equals(id)) ?? null;
  }

  async findByUserAndPermission(
    userId: UniqueEntityID,
    permissionId: UniqueEntityID,
  ): Promise<UserDirectPermission | null> {
    return (
      this.items.find(
        (item) =>
          item.userId.equals(userId) && item.permissionId.equals(permissionId),
      ) ?? null
    );
  }

  async listByUserId(
    userId: UniqueEntityID,
    params?: ListUserDirectPermissionsParams,
  ): Promise<UserDirectPermission[]> {
    const { includeExpired = false, effect } = params || {};
    const now = new Date();

    return this.items.filter((item) => {
      if (!item.userId.equals(userId)) return false;
      if (effect && item.effect !== effect) return false;
      if (!includeExpired && item.expiresAt && item.expiresAt <= now)
        return false;

      return true;
    });
  }

  async listByPermissionId(
    permissionId: UniqueEntityID,
  ): Promise<UserDirectPermission[]> {
    const now = new Date();

    return this.items.filter(
      (item) =>
        item.permissionId.equals(permissionId) &&
        (!item.expiresAt || item.expiresAt > now),
    );
  }

  async listActiveByUserId(
    userId: UniqueEntityID,
  ): Promise<UserDirectPermission[]> {
    return this.listByUserId(userId, { includeExpired: false });
  }

  async listPermissionsByUserId(
    userId: UniqueEntityID,
    params?: ListUserDirectPermissionsParams,
  ): Promise<Permission[]> {
    if (!this.permissionsRepository) {
      throw new Error('PermissionsRepository not provided');
    }

    const directPermissions = await this.listByUserId(userId, params);
    const permissionIds = directPermissions.map((dp) => dp.permissionId);

    const permissions: Permission[] = [];
    for (const permissionId of permissionIds) {
      const permission =
        await this.permissionsRepository.findById(permissionId);
      if (permission) {
        permissions.push(permission);
      }
    }

    return permissions;
  }

  async listUsersByPermissionId(
    permissionId: UniqueEntityID,
  ): Promise<UniqueEntityID[]> {
    const directPermissions = await this.listByPermissionId(permissionId);
    const userIds = new Set<string>();

    directPermissions.forEach((dp) => {
      userIds.add(dp.userId.toString());
    });

    return Array.from(userIds).map((id) => new UniqueEntityID(id));
  }

  async listUserPermissionsWithEffects(userId: UniqueEntityID): Promise<
    {
      permission: Permission;
      effect: string;
      conditions: Record<string, unknown> | null;
    }[]
  > {
    if (!this.permissionsRepository) {
      throw new Error('PermissionsRepository not provided');
    }

    const directPermissions = await this.listActiveByUserId(userId);
    const result: {
      permission: Permission;
      effect: string;
      conditions: Record<string, unknown> | null;
    }[] = [];

    for (const dp of directPermissions) {
      const permission = await this.permissionsRepository.findById(
        dp.permissionId,
      );
      if (permission) {
        result.push({
          permission,
          effect: dp.effect,
          conditions: dp.conditions,
        });
      }
    }

    return result;
  }

  async exists(
    userId: UniqueEntityID,
    permissionId: UniqueEntityID,
  ): Promise<boolean> {
    return this.items.some(
      (item) =>
        item.userId.equals(userId) && item.permissionId.equals(permissionId),
    );
  }

  async countByUserId(userId: UniqueEntityID): Promise<number> {
    return this.items.filter((item) => item.userId.equals(userId)).length;
  }

  async countByPermissionId(permissionId: UniqueEntityID): Promise<number> {
    return this.items.filter((item) => item.permissionId.equals(permissionId))
      .length;
  }

  async countUsersWithPermission(permissionId: UniqueEntityID): Promise<number> {
    const userIds = await this.listUsersByPermissionId(permissionId);
    return userIds.length;
  }
}
