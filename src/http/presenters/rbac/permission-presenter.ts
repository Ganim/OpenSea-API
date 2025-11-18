import type { Permission } from '@/entities/rbac/permission';

export class PermissionPresenter {
  static toHTTP(permission: Permission) {
    return {
      id: permission.id.toString(),
      code: permission.code.value,
      name: permission.name,
      description: permission.description,
      module: permission.module,
      resource: permission.resource,
      action: permission.action,
      isSystem: permission.isSystem,
      metadata: permission.metadata,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
  }

  static toHTTPMany(permissions: Permission[]) {
    return permissions.map((permission) => this.toHTTP(permission));
  }
}
