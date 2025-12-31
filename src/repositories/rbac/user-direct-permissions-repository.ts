import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { UserDirectPermission } from '@/entities/rbac/user-direct-permission';

export interface GrantDirectPermissionSchema {
  userId: UniqueEntityID;
  permissionId: UniqueEntityID;
  effect?: 'allow' | 'deny';
  conditions?: Record<string, unknown> | null;
  expiresAt?: Date | null;
  grantedBy?: UniqueEntityID | null;
}

export interface UpdateDirectPermissionSchema {
  id: UniqueEntityID;
  effect?: 'allow' | 'deny';
  conditions?: Record<string, unknown> | null;
  expiresAt?: Date | null;
}

export interface ListUserDirectPermissionsParams {
  includeExpired?: boolean;
  effect?: 'allow' | 'deny';
}

export interface UserDirectPermissionsRepository {
  // CREATE
  grant(data: GrantDirectPermissionSchema): Promise<UserDirectPermission>;
  grantMany(data: GrantDirectPermissionSchema[]): Promise<void>;

  // UPDATE
  update(
    data: UpdateDirectPermissionSchema,
  ): Promise<UserDirectPermission | null>;

  // DELETE
  revoke(userId: UniqueEntityID, permissionId: UniqueEntityID): Promise<void>;
  revokeAllFromUser(userId: UniqueEntityID): Promise<void>;
  revokePermissionFromAllUsers(permissionId: UniqueEntityID): Promise<void>;
  revokeExpired(): Promise<number>; // Retorna quantidade removida

  // RETRIEVE
  findById(id: UniqueEntityID): Promise<UserDirectPermission | null>;
  findByUserAndPermission(
    userId: UniqueEntityID,
    permissionId: UniqueEntityID,
  ): Promise<UserDirectPermission | null>;

  // LIST
  listByUserId(
    userId: UniqueEntityID,
    params?: ListUserDirectPermissionsParams,
  ): Promise<UserDirectPermission[]>;
  listByPermissionId(
    permissionId: UniqueEntityID,
  ): Promise<UserDirectPermission[]>;
  listActiveByUserId(userId: UniqueEntityID): Promise<UserDirectPermission[]>;

  // COMPLEX QUERIES
  listPermissionsByUserId(
    userId: UniqueEntityID,
    params?: ListUserDirectPermissionsParams,
  ): Promise<Permission[]>;
  listUsersByPermissionId(
    permissionId: UniqueEntityID,
  ): Promise<UniqueEntityID[]>;

  /**
   * Lista permissões com seus efeitos (allow/deny) para um usuário
   * Importante para aplicar precedência de deny
   */
  listUserPermissionsWithEffects(userId: UniqueEntityID): Promise<
    {
      permission: Permission;
      effect: string;
      conditions: Record<string, unknown> | null;
    }[]
  >;

  // UTILITY
  exists(
    userId: UniqueEntityID,
    permissionId: UniqueEntityID,
  ): Promise<boolean>;
  countByUserId(userId: UniqueEntityID): Promise<number>;
  countByPermissionId(permissionId: UniqueEntityID): Promise<number>;
  countUsersWithPermission(permissionId: UniqueEntityID): Promise<number>;
}
