import type { User } from '@/entities/core/user';
import type { Permission } from '@/entities/rbac/permission';
import type { PermissionGroup } from '@/entities/rbac/permission-group';
import type { UserWithAssignment } from '@/use-cases/rbac/permission-groups/get-permission-group-by-id';

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
    users: UserWithAssignment[] | User[];
    permissions: Array<{
      permission: Permission;
      effect: string;
      conditions: Record<string, unknown> | null;
    }>;
  }) {
    const groupData = this.toHTTP(data.group);

    return {
      ...groupData,
      users: data.users.map((item) => {
        if ('user' in item) {
          // UserWithAssignment (from get-by-id)
          return {
            id: item.user.id.toString(),
            username: item.user.username.value,
            email: item.user.email.value,
            assignedAt: item.assignedAt,
            expiresAt: item.expiresAt,
          };
        }
        // Plain User (from list)
        return {
          id: item.id.toString(),
          username: item.username.value,
          email: item.email.value,
          assignedAt: new Date(),
          expiresAt: null,
        };
      }),
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
