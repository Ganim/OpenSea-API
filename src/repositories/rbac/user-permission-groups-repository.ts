import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { PermissionGroup } from '@/entities/rbac/permission-group';
import { UserPermissionGroup } from '@/entities/rbac/user-permission-group';
import { Prisma } from '@prisma/client';

export interface AssignGroupToUserSchema {
  userId: UniqueEntityID;
  groupId: UniqueEntityID;
  expiresAt: Date | null;
  grantedBy: UniqueEntityID | null;
}

export interface UpdateUserGroupSchema {
  id: UniqueEntityID;
  expiresAt?: Date | null;
}

export interface ListUserGroupsParams {
  includeExpired?: boolean;
  includeInactive?: boolean;
}

export interface UserPermissionGroupsRepository {
  // CREATE
  assign(data: AssignGroupToUserSchema): Promise<UserPermissionGroup>;
  assignMany(data: AssignGroupToUserSchema[]): Promise<void>;

  // UPDATE
  update(data: UpdateUserGroupSchema): Promise<UserPermissionGroup | null>;

  // DELETE
  remove(userId: UniqueEntityID, groupId: UniqueEntityID): Promise<void>;
  removeAllFromUser(userId: UniqueEntityID): Promise<void>;
  removeAllUsersFromGroup(groupId: UniqueEntityID): Promise<void>;
  removeExpired(): Promise<number>; // Retorna quantidade removida

  // RETRIEVE
  findById(id: UniqueEntityID): Promise<UserPermissionGroup | null>;
  findByUserAndGroup(
    userId: UniqueEntityID,
    groupId: UniqueEntityID,
  ): Promise<UserPermissionGroup | null>;

  // LIST
  listByUserId(
    userId: UniqueEntityID,
    params?: ListUserGroupsParams,
  ): Promise<UserPermissionGroup[]>;
  listByGroupId(groupId: UniqueEntityID): Promise<UserPermissionGroup[]>;
  listByGroupIdIncludingExpired(
    groupId: UniqueEntityID,
  ): Promise<UserPermissionGroup[]>;
  listActiveByUserId(userId: UniqueEntityID): Promise<UserPermissionGroup[]>;

  // COMPLEX QUERIES
  listGroupsByUserId(
    userId: UniqueEntityID,
    params?: ListUserGroupsParams,
  ): Promise<PermissionGroup[]>;
  listUsersByGroupId(groupId: UniqueEntityID): Promise<UniqueEntityID[]>;

  /**
   * Lista todas as permissões de um usuário (agregando de todos os grupos)
   * Inclui herança de grupos pais
   */
  listUserPermissions(userId: UniqueEntityID): Promise<Permission[]>;

  /**
   * Lista permissões com seus efeitos (allow/deny) para um usuário
   * Importante para aplicar precedência de deny
   */
  listUserPermissionsWithEffects(userId: UniqueEntityID): Promise<
    {
      permission: Permission;
      effect: string;
      groupId: UniqueEntityID;
      conditions: Record<string, unknown> | null;
    }[]
  >;

  // UTILITY
  exists(userId: UniqueEntityID, groupId: UniqueEntityID): Promise<boolean>;
  countByUserId(userId: UniqueEntityID): Promise<number>;
  countByGroupId(groupId: UniqueEntityID): Promise<number>;
  countUsersInGroup(groupId: UniqueEntityID): Promise<number>; // Alias mais claro
}
