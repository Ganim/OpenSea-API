import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionGroup } from '@/entities/rbac/permission-group';
import type {
  CreatePermissionGroupSchema,
  ListPermissionGroupsParams,
  PermissionGroupsRepository,
  UpdatePermissionGroupSchema,
} from '../permission-groups-repository';

export class InMemoryPermissionGroupsRepository
  implements PermissionGroupsRepository
{
  public items: PermissionGroup[] = [];

  async create(data: CreatePermissionGroupSchema): Promise<PermissionGroup> {
    const group = PermissionGroup.create({
      id: new UniqueEntityID(),
      name: data.name,
      slug: data.slug,
      description: data.description,
      isSystem: data.isSystem,
      isActive: data.isActive,
      color: data.color,
      priority: data.priority,
      parentId: data.parentId,
      tenantId: data.tenantId,
      deletedAt: null,
      createdAt: new Date(),
    });

    this.items.push(group);
    return group;
  }

  async update(
    data: UpdatePermissionGroupSchema,
  ): Promise<PermissionGroup | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));

    if (index === -1) return null;

    const group = this.items[index];
    const updated = PermissionGroup.create(
      {
        id: group.id,
        name: data.name ?? group.name,
        slug: data.slug ?? group.slug,
        description: data.description ?? group.description,
        isSystem: group.isSystem,
        isActive: data.isActive ?? group.isActive,
        color: data.color ?? group.color,
        priority: data.priority ?? group.priority,
        parentId: data.parentId !== undefined ? data.parentId : group.parentId,
        tenantId: group.tenantId,
        deletedAt:
          data.deletedAt !== undefined ? data.deletedAt : group.deletedAt,
        createdAt: group.createdAt,
      },
      group.id,
    );

    this.items[index] = updated;
    return updated;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));

    if (index !== -1) {
      const group = this.items[index];
      const deleted = PermissionGroup.create(
        {
          id: group.id,
          name: group.name,
          slug: group.slug,
          description: group.description,
          isSystem: group.isSystem,
          isActive: group.isActive,
          color: group.color,
          priority: group.priority,
          parentId: group.parentId,
          tenantId: group.tenantId,
          deletedAt: new Date(),
          createdAt: group.createdAt,
        },
        group.id,
      );

      this.items[index] = deleted;
    }
  }

  async restore(id: UniqueEntityID): Promise<PermissionGroup | null> {
    const index = this.items.findIndex((item) => item.id.equals(id));

    if (index === -1) return null;

    const group = this.items[index];
    const restored = PermissionGroup.create(
      {
        id: group.id,
        name: group.name,
        slug: group.slug,
        description: group.description,
        isSystem: group.isSystem,
        isActive: group.isActive,
        color: group.color,
        priority: group.priority,
        parentId: group.parentId,
        tenantId: group.tenantId,
        deletedAt: null,
        createdAt: group.createdAt,
      },
      group.id,
    );

    this.items[index] = restored;
    return restored;
  }

  async findById(
    id: UniqueEntityID,
    includeDeleted = false,
  ): Promise<PermissionGroup | null> {
    const group = this.items.find((item) => item.id.equals(id));

    if (!group) return null;
    if (!includeDeleted && group.deletedAt) return null;

    return group;
  }

  async findBySlug(
    slug: string,
    includeDeleted = false,
  ): Promise<PermissionGroup | null> {
    const group = this.items.find((item) => item.slug === slug);

    if (!group) return null;
    if (!includeDeleted && group.deletedAt) return null;

    return group;
  }

  async findByName(name: string): Promise<PermissionGroup | null> {
    return (
      this.items.find((item) => item.name === name && !item.deletedAt) ?? null
    );
  }

  async findManyByIds(ids: UniqueEntityID[]): Promise<PermissionGroup[]> {
    return this.items.filter(
      (item) => ids.some((id) => id.equals(item.id)) && !item.deletedAt,
    );
  }

  async listAll(
    params?: ListPermissionGroupsParams,
  ): Promise<PermissionGroup[]> {
    const {
      isActive,
      isSystem,
      includeDeleted = false,
      parentId,
      page = 1,
      limit = 100,
    } = params || {};

    let filtered = this.items;

    if (!includeDeleted) {
      filtered = filtered.filter((item) => !item.deletedAt);
    }

    if (isActive !== undefined) {
      filtered = filtered.filter((item) => item.isActive === isActive);
    }

    if (isSystem !== undefined) {
      filtered = filtered.filter((item) => item.isSystem === isSystem);
    }

    if (parentId) {
      filtered = filtered.filter((item) => item.parentId?.equals(parentId));
    }

    filtered.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.name.localeCompare(b.name);
    });

    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }

  async listActive(): Promise<PermissionGroup[]> {
    return this.items
      .filter((item) => item.isActive && !item.deletedAt)
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.name.localeCompare(b.name);
      });
  }

  async listByParentId(parentId: UniqueEntityID): Promise<PermissionGroup[]> {
    return this.items
      .filter((item) => item.parentId?.equals(parentId) && !item.deletedAt)
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.name.localeCompare(b.name);
      });
  }

  async listSystemGroups(): Promise<PermissionGroup[]> {
    return this.items
      .filter((item) => item.isSystem && !item.deletedAt)
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.name.localeCompare(b.name);
      });
  }

  async findParent(id: UniqueEntityID): Promise<PermissionGroup | null> {
    const group = this.items.find((item) => item.id.equals(id));

    if (!group || !group.parentId) return null;

    return this.items.find((item) => item.id.equals(group.parentId!)) ?? null;
  }

  async findChildren(id: UniqueEntityID): Promise<PermissionGroup[]> {
    return this.items
      .filter((item) => item.parentId?.equals(id) && !item.deletedAt)
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.name.localeCompare(b.name);
      });
  }

  async findAncestors(id: UniqueEntityID): Promise<PermissionGroup[]> {
    const ancestors: PermissionGroup[] = [];
    let currentId: UniqueEntityID | null = id;

    while (currentId) {
      const group = this.items.find((item) => item.id.equals(currentId!));

      if (!group || !group.parentId) break;

      const parent = this.items.find((item) => item.id.equals(group.parentId!));

      if (parent) {
        ancestors.push(parent);
        currentId = parent.parentId;
      } else {
        break;
      }
    }

    return ancestors;
  }

  async findBySlugAndTenantId(
    slug: string,
    tenantId: UniqueEntityID,
    includeDeleted = false,
  ): Promise<PermissionGroup | null> {
    const group = this.items.find(
      (item) =>
        item.slug === slug &&
        item.tenantId?.equals(tenantId) &&
        (includeDeleted || !item.deletedAt),
    );

    return group ?? null;
  }

  async listByTenantId(tenantId: UniqueEntityID): Promise<PermissionGroup[]> {
    return this.items
      .filter((item) => item.tenantId?.equals(tenantId) && !item.deletedAt)
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.name.localeCompare(b.name);
      });
  }

  async exists(slug: string): Promise<boolean> {
    return this.items.some((item) => item.slug === slug && !item.deletedAt);
  }

  async count(): Promise<number> {
    return this.items.filter((item) => !item.deletedAt).length;
  }
}
