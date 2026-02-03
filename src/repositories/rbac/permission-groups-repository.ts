import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionGroup } from '@/entities/rbac/permission-group';

export interface CreatePermissionGroupSchema {
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
  color: string | null;
  priority: number;
  parentId: UniqueEntityID | null;
  tenantId?: UniqueEntityID | null;
}

export interface UpdatePermissionGroupSchema {
  id: UniqueEntityID;
  name?: string;
  slug?: string;
  description?: string | null;
  isActive?: boolean;
  color?: string | null;
  priority?: number;
  parentId?: UniqueEntityID | null;
  deletedAt?: Date | null;
}

export interface ListPermissionGroupsParams {
  isActive?: boolean;
  isSystem?: boolean;
  includeDeleted?: boolean;
  parentId?: UniqueEntityID | null;
  page?: number;
  limit?: number;
}

export interface PermissionGroupsRepository {
  // CREATE
  create(data: CreatePermissionGroupSchema): Promise<PermissionGroup>;

  // UPDATE
  update(data: UpdatePermissionGroupSchema): Promise<PermissionGroup | null>;

  // DELETE (soft delete)
  delete(id: UniqueEntityID): Promise<void>;
  restore(id: UniqueEntityID): Promise<PermissionGroup | null>;

  // RETRIEVE
  findById(
    id: UniqueEntityID,
    includeDeleted?: boolean,
  ): Promise<PermissionGroup | null>;
  findBySlug(
    slug: string,
    includeDeleted?: boolean,
  ): Promise<PermissionGroup | null>;
  findByName(name: string): Promise<PermissionGroup | null>;
  findManyByIds(ids: UniqueEntityID[]): Promise<PermissionGroup[]>;

  // LIST
  listAll(params?: ListPermissionGroupsParams): Promise<PermissionGroup[]>;
  listActive(): Promise<PermissionGroup[]>;
  listByParentId(parentId: UniqueEntityID): Promise<PermissionGroup[]>;
  listSystemGroups(): Promise<PermissionGroup[]>;

  // HIERARCHY
  findParent(id: UniqueEntityID): Promise<PermissionGroup | null>;
  findChildren(id: UniqueEntityID): Promise<PermissionGroup[]>;
  findAncestors(id: UniqueEntityID): Promise<PermissionGroup[]>; // Para herança

  // TENANT-SCOPED
  findBySlugAndTenantId(
    slug: string,
    tenantId: UniqueEntityID,
    includeDeleted?: boolean,
  ): Promise<PermissionGroup | null>;
  listByTenantId(tenantId: UniqueEntityID): Promise<PermissionGroup[]>;

  // UTILITY
  exists(slug: string): Promise<boolean>;
  count(): Promise<number>;
}
