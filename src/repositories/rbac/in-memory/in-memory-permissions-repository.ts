import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import type {
  CreatePermissionSchema,
  ListPermissionsParams,
  PermissionsRepository,
  UpdatePermissionSchema,
} from '../permissions-repository';

export class InMemoryPermissionsRepository implements PermissionsRepository {
  public items: Permission[] = [];

  async create(data: CreatePermissionSchema): Promise<Permission> {
    const permission = Permission.create({
      id: new UniqueEntityID(),
      code: data.code,
      name: data.name,
      description: data.description,
      module: data.module,
      resource: data.resource,
      action: data.action,
      isSystem: data.isSystem,
      metadata: data.metadata,
      createdAt: new Date(),
    });

    this.items.push(permission);
    return permission;
  }

  async update(data: UpdatePermissionSchema): Promise<Permission | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));

    if (index === -1) return null;

    const permission = this.items[index];
    const updated = Permission.create(
      {
        id: permission.id,
        code: permission.code, // imutável
        name: data.name ?? permission.name,
        description:
          data.description !== undefined
            ? data.description
            : permission.description,
        module: permission.module, // imutável
        resource: permission.resource, // imutável
        action: permission.action, // imutável
        isSystem: permission.isSystem, // imutável
        metadata: data.metadata ?? permission.metadata,
        createdAt: permission.createdAt,
      },
      permission.id,
    );

    this.items[index] = updated;
    return updated;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    this.items = this.items.filter((item) => !item.id.equals(id));
  }

  async findById(id: UniqueEntityID): Promise<Permission | null> {
    return this.items.find((item) => item.id.equals(id)) ?? null;
  }

  async findByCode(code: PermissionCode): Promise<Permission | null> {
    return this.items.find((item) => item.code.equals(code)) ?? null;
  }

  async findManyByIds(ids: UniqueEntityID[]): Promise<Permission[]> {
    return this.items.filter((item) => ids.some((id) => id.equals(item.id)));
  }

  async findManyByCodes(codes: PermissionCode[]): Promise<Permission[]> {
    return this.items.filter((item) =>
      codes.some((code) => item.code.equals(code)),
    );
  }

  async listAll(params?: ListPermissionsParams): Promise<Permission[]> {
    const {
      module,
      resource,
      action,
      isSystem,
      page = 1,
      limit = 100,
    } = params || {};

    let filtered = this.items;

    if (module) {
      filtered = filtered.filter((item) => item.module === module);
    }

    if (resource) {
      filtered = filtered.filter((item) => item.resource === resource);
    }

    if (action) {
      filtered = filtered.filter((item) => item.action === action);
    }

    if (isSystem !== undefined) {
      filtered = filtered.filter((item) => item.isSystem === isSystem);
    }

    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }

  async listByModule(module: string): Promise<Permission[]> {
    return this.items.filter((item) => item.module === module);
  }

  async listByResource(resource: string): Promise<Permission[]> {
    return this.items.filter((item) => item.resource === resource);
  }

  async listByAction(action: string): Promise<Permission[]> {
    return this.items.filter((item) => item.action === action);
  }

  async listSystemPermissions(): Promise<Permission[]> {
    return this.items.filter((item) => item.isSystem);
  }

  async exists(code: PermissionCode): Promise<boolean> {
    return this.items.some((item) => item.code.equals(code));
  }

  async count(params?: ListPermissionsParams): Promise<number> {
    const { module, resource, action, isSystem } = params || {};

    let filtered = this.items;

    if (module) {
      filtered = filtered.filter((item) => item.module === module);
    }

    if (resource) {
      filtered = filtered.filter((item) => item.resource === resource);
    }

    if (action) {
      filtered = filtered.filter((item) => item.action === action);
    }

    if (isSystem !== undefined) {
      filtered = filtered.filter((item) => item.isSystem === isSystem);
    }

    return filtered.length;
  }
}
