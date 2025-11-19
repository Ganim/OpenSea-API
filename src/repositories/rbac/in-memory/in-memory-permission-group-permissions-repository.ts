import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { PermissionGroupPermission } from '@/entities/rbac/permission-group-permission';
import { PermissionEffect } from '@/entities/rbac/value-objects/permission-effect';
import type {
  AddPermissionToGroupSchema,
  PermissionGroupPermissionsRepository,
  UpdateGroupPermissionSchema,
} from '../permission-group-permissions-repository';

export class InMemoryPermissionGroupPermissionsRepository
  implements PermissionGroupPermissionsRepository
{
  public items: PermissionGroupPermission[] = [];
  public permissions: Permission[] = []; // Para listPermissionsByGroupIds

  async add(
    data: AddPermissionToGroupSchema,
  ): Promise<PermissionGroupPermission> {
    const permission = PermissionGroupPermission.create({
      id: new UniqueEntityID(),
      groupId: data.groupId,
      permissionId: data.permissionId,
      effect: data.effect,
      conditions: data.conditions,
    });

    this.items.push(permission);
    return permission;
  }

  async addMany(data: AddPermissionToGroupSchema[]): Promise<void> {
    const permissions = data.map((item) =>
      PermissionGroupPermission.create({
        id: new UniqueEntityID(),
        groupId: item.groupId,
        permissionId: item.permissionId,
        effect: item.effect,
        conditions: item.conditions,
      }),
    );

    this.items.push(...permissions);
  }

  async update(
    data: UpdateGroupPermissionSchema,
  ): Promise<PermissionGroupPermission | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));

    if (index === -1) return null;

    const permission = this.items[index];
    const updated = PermissionGroupPermission.create(
      {
        id: permission.id,
        groupId: permission.groupId,
        permissionId: permission.permissionId,
        effect: data.effect ?? permission.effect,
        conditions:
          data.conditions !== undefined
            ? data.conditions
            : permission.conditions,
      },
      permission.id,
    );

    this.items[index] = updated;
    return updated;
  }

  async remove(
    groupId: UniqueEntityID,
    permissionId: UniqueEntityID,
  ): Promise<void> {
    const index = this.items.findIndex(
      (item) =>
        item.groupId.equals(groupId) && item.permissionId.equals(permissionId),
    );

    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  async removeAllFromGroup(groupId: UniqueEntityID): Promise<void> {
    this.items = this.items.filter((item) => !item.groupId.equals(groupId));
  }

  async findById(
    id: UniqueEntityID,
  ): Promise<PermissionGroupPermission | null> {
    return this.items.find((item) => item.id.equals(id)) ?? null;
  }

  async findByGroupAndPermission(
    groupId: UniqueEntityID,
    permissionId: UniqueEntityID,
  ): Promise<PermissionGroupPermission | null> {
    return (
      this.items.find(
        (item) =>
          item.groupId.equals(groupId) &&
          item.permissionId.equals(permissionId),
      ) ?? null
    );
  }

  async listByGroupId(
    groupId: UniqueEntityID,
  ): Promise<PermissionGroupPermission[]> {
    return this.items.filter((item) => item.groupId.equals(groupId));
  }

  async listByPermissionId(
    permissionId: UniqueEntityID,
  ): Promise<PermissionGroupPermission[]> {
    return this.items.filter((item) => item.permissionId.equals(permissionId));
  }

  async listPermissionsByGroupId(
    groupId: UniqueEntityID,
  ): Promise<Permission[]> {
    const groupPermissions = this.items.filter((item) =>
      item.groupId.equals(groupId),
    );

    const permissionIds = groupPermissions.map((gp) => gp.permissionId);

    return this.permissions.filter((p) =>
      permissionIds.some((id) => id.equals(p.id)),
    );
  }

  async listPermissionsByGroupIds(
    groupIds: UniqueEntityID[],
  ): Promise<Permission[]> {
    const groupPermissions = this.items.filter((item) =>
      groupIds.some((id) => id.equals(item.groupId)),
    );

    const permissionIds = groupPermissions.map((gp) => gp.permissionId);

    return this.permissions.filter((p) =>
      permissionIds.some((id) => id.equals(p.id)),
    );
  }

  async listPermissionsWithEffect(
    groupId: UniqueEntityID,
  ): Promise<{ permission: Permission; effect: PermissionEffect }[]> {
    const groupPermissions = this.items.filter((item) =>
      item.groupId.equals(groupId),
    );

    return groupPermissions
      .map((gp) => {
        const permission = this.permissions.find((p) =>
          p.id.equals(gp.permissionId),
        );
        return permission ? { permission, effect: gp.effect } : null;
      })
      .filter(
        (item): item is { permission: Permission; effect: PermissionEffect } =>
          item !== null,
      );
  }

  async listPermissionsWithEffects(groupId: UniqueEntityID): Promise<
    {
      permission: Permission;
      effect: string;
      conditions: Record<string, unknown> | null;
    }[]
  > {
    const groupPermissions = this.items.filter((item) =>
      item.groupId.equals(groupId),
    );

    const results: {
      permission: Permission;
      effect: string;
      conditions: Record<string, unknown> | null;
    }[] = [];

    for (const gp of groupPermissions) {
      const permission = this.permissions.find((p) =>
        p.id.equals(gp.permissionId),
      );
      if (permission) {
        results.push({
          permission,
          effect: gp.effect.value,
          conditions: gp.conditions,
        });
      }
    }

    return results;
  }

  async exists(
    groupId: UniqueEntityID,
    permissionId: UniqueEntityID,
  ): Promise<boolean> {
    return this.items.some(
      (item) =>
        item.groupId.equals(groupId) && item.permissionId.equals(permissionId),
    );
  }

  async countByGroupId(groupId: UniqueEntityID): Promise<number> {
    return this.items.filter((item) => item.groupId.equals(groupId)).length;
  }
}
