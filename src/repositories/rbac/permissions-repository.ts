import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';

export interface CreatePermissionSchema {
  code: PermissionCode;
  name: string;
  description: string | null;
  module: string;
  resource: string;
  action: string;
  isSystem: boolean;
  metadata: Record<string, unknown>;
}

export interface UpdatePermissionSchema {
  id: UniqueEntityID;
  name?: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ListPermissionsParams {
  module?: string;
  resource?: string;
  action?: string;
  isSystem?: boolean;
  page?: number;
  limit?: number;
}

export interface PermissionsRepository {
  // CREATE
  create(data: CreatePermissionSchema): Promise<Permission>;

  // UPDATE
  update(data: UpdatePermissionSchema): Promise<Permission | null>;

  // DELETE
  delete(id: UniqueEntityID): Promise<void>;

  // RETRIEVE
  findById(id: UniqueEntityID): Promise<Permission | null>;
  findByCode(code: PermissionCode): Promise<Permission | null>;
  findManyByIds(ids: UniqueEntityID[]): Promise<Permission[]>;
  findManyByCodes(codes: PermissionCode[]): Promise<Permission[]>;

  // LIST
  listAll(params?: ListPermissionsParams): Promise<Permission[]>;
  listByModule(module: string): Promise<Permission[]>;
  listByResource(resource: string): Promise<Permission[]>;
  listSystemPermissions(): Promise<Permission[]>;

  // UTILITY
  exists(code: PermissionCode): Promise<boolean>;
  count(): Promise<number>;
}
