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
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      deletedAt: group.deletedAt,
    };
  }

  static toHTTPMany(groups: PermissionGroup[]) {
    return groups.map((group) => this.toHTTP(group));
  }
}
