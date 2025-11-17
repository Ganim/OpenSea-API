import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { PermissionGroupPermission } from '@/entities/rbac/permission-group-permission';
import { PermissionEffect } from '@/entities/rbac/value-objects/permission-effect';

export interface AddPermissionToGroupSchema {
  groupId: UniqueEntityID;
  permissionId: UniqueEntityID;
  effect: PermissionEffect;
  conditions: Record<string, unknown> | null;
}

export interface UpdateGroupPermissionSchema {
  id: UniqueEntityID;
  effect?: PermissionEffect;
  conditions?: Record<string, unknown> | null;
}

export interface PermissionGroupPermissionsRepository {
  // CREATE
  add(data: AddPermissionToGroupSchema): Promise<PermissionGroupPermission>;
  addMany(data: AddPermissionToGroupSchema[]): Promise<void>;

  // UPDATE
  update(
    data: UpdateGroupPermissionSchema,
  ): Promise<PermissionGroupPermission | null>;

  // DELETE
  remove(groupId: UniqueEntityID, permissionId: UniqueEntityID): Promise<void>;
  removeAllFromGroup(groupId: UniqueEntityID): Promise<void>;

  // RETRIEVE
  findById(id: UniqueEntityID): Promise<PermissionGroupPermission | null>;
  findByGroupAndPermission(
    groupId: UniqueEntityID,
    permissionId: UniqueEntityID,
  ): Promise<PermissionGroupPermission | null>;

  // LIST
  listByGroupId(groupId: UniqueEntityID): Promise<PermissionGroupPermission[]>;
  listByPermissionId(
    permissionId: UniqueEntityID,
  ): Promise<PermissionGroupPermission[]>;

  // COMPLEX QUERIES
  listPermissionsByGroupId(groupId: UniqueEntityID): Promise<Permission[]>;
  listPermissionsByGroupIds(groupIds: UniqueEntityID[]): Promise<Permission[]>;
  listPermissionsWithEffect(
    groupId: UniqueEntityID,
  ): Promise<{ permission: Permission; effect: PermissionEffect }[]>;
  listPermissionsWithEffects(groupId: UniqueEntityID): Promise<
    {
      permission: Permission;
      effect: string;
      conditions: Record<string, unknown> | null;
    }[]
  >;

  // UTILITY
  exists(
    groupId: UniqueEntityID,
    permissionId: UniqueEntityID,
  ): Promise<boolean>;
  countByGroupId(groupId: UniqueEntityID): Promise<number>;
}
