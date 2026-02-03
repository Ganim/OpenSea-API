import type { User } from '@/entities/core/user';
import type { Permission } from '@/entities/rbac/permission';
import type { PermissionGroup } from '@/entities/rbac/permission-group';

export class PermissionGroupPresenter {
  static toHTTP(group: PermissionGroup) {
    return {
      id: group.id.toString(),
      name: group.name,
      slug: group.slug,
      description: group.description,
      color: group.color,
      priority: group.priority,
      isActive: group.isActive,
      isSystem: group.isSystem,
      parentId: group.parentId?.toString() ?? null,
      tenantId: group.tenantId?.toString() ?? null,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      deletedAt: group.deletedAt,
    };
  }

  static toHTTPMany(groups: PermissionGroup[]) {
    return groups.map((group) => this.toHTTP(group));
  }

  static toHTTPWithDetails(data: {
    group: PermissionGroup;
    users: User[];
    permissions: Array<{
      permission: Permission;
      effect: string;
      conditions: Record<string, unknown> | null;
    }>;
  }) {
    const groupData = this.toHTTP(data.group);

    return {
      id: groupData.id,
      name: groupData.name,
      slug: groupData.slug,
      description: groupData.description,
      color: groupData.color,
      priority: groupData.priority,
      isActive: groupData.isActive,
      isSystem: groupData.isSystem,
      parentId: groupData.parentId,
      tenantId: groupData.tenantId,
      createdAt: groupData.createdAt,
      updatedAt: groupData.updatedAt,
      deletedAt: groupData.deletedAt,
      users: data.users.map((user) => ({
        id: user.id.toString(),
        username: user.username.value,
        email: user.email.value,
      })),
      usersCount: data.users.length,
      permissions: data.permissions.map((item) => ({
        id: item.permission.id.toString(),
        code: item.permission.code.value,
        name: item.permission.name,
        description: item.permission.description,
        module: item.permission.module,
        resource: item.permission.resource,
        action: item.permission.action,
        effect: item.effect as 'allow' | 'deny',
        conditions: item.conditions,
      })),
      permissionsCount: data.permissions.length,
    };
  }
}
