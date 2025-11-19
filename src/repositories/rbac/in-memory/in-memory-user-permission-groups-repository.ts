import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { PermissionGroup } from '@/entities/rbac/permission-group';
import { UserPermissionGroup } from '@/entities/rbac/user-permission-group';
import type { PermissionGroupPermissionsRepository } from '../permission-group-permissions-repository';
import type { PermissionGroupsRepository } from '../permission-groups-repository';
import type {
  AssignGroupToUserSchema,
  ListUserGroupsParams,
  UpdateUserGroupSchema,
  UserPermissionGroupsRepository,
} from '../user-permission-groups-repository';

export class InMemoryUserPermissionGroupsRepository
  implements UserPermissionGroupsRepository
{
  public items: UserPermissionGroup[] = [];

  constructor(
    private permissionGroupsRepository?: PermissionGroupsRepository,
    private permissionGroupPermissionsRepository?: PermissionGroupPermissionsRepository,
  ) {}

  async assign(data: AssignGroupToUserSchema): Promise<UserPermissionGroup> {
    const userGroup = UserPermissionGroup.create({
      id: new UniqueEntityID(),
      userId: data.userId,
      groupId: data.groupId,
      expiresAt: data.expiresAt,
      grantedBy: data.grantedBy,
    });

    this.items.push(userGroup);
    return userGroup;
  }

  async assignMany(data: AssignGroupToUserSchema[]): Promise<void> {
    const userGroups = data.map((item) =>
      UserPermissionGroup.create({
        id: new UniqueEntityID(),
        userId: item.userId,
        groupId: item.groupId,
        expiresAt: item.expiresAt,
        grantedBy: item.grantedBy,
      }),
    );

    this.items.push(...userGroups);
  }

  async update(
    data: UpdateUserGroupSchema,
  ): Promise<UserPermissionGroup | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));

    if (index === -1) return null;

    const userGroup = this.items[index];
    const updated = UserPermissionGroup.create(
      {
        id: userGroup.id,
        userId: userGroup.userId,
        groupId: userGroup.groupId,
        expiresAt:
          data.expiresAt !== undefined ? data.expiresAt : userGroup.expiresAt,
        grantedBy: userGroup.grantedBy,
      },
      userGroup.id,
    );

    this.items[index] = updated;
    return updated;
  }

  async remove(userId: UniqueEntityID, groupId: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.userId.equals(userId) && item.groupId.equals(groupId),
    );

    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  async removeAllFromUser(userId: UniqueEntityID): Promise<void> {
    this.items = this.items.filter((item) => !item.userId.equals(userId));
  }

  async removeAllUsersFromGroup(groupId: UniqueEntityID): Promise<void> {
    this.items = this.items.filter((item) => !item.groupId.equals(groupId));
  }

  async removeExpired(): Promise<number> {
    const now = new Date();
    const beforeCount = this.items.length;

    this.items = this.items.filter(
      (item) => !item.expiresAt || item.expiresAt > now,
    );

    return beforeCount - this.items.length;
  }

  async findById(id: UniqueEntityID): Promise<UserPermissionGroup | null> {
    return this.items.find((item) => item.id.equals(id)) ?? null;
  }

  async findByUserAndGroup(
    userId: UniqueEntityID,
    groupId: UniqueEntityID,
  ): Promise<UserPermissionGroup | null> {
    return (
      this.items.find(
        (item) => item.userId.equals(userId) && item.groupId.equals(groupId),
      ) ?? null
    );
  }

  async listByUserId(
    userId: UniqueEntityID,
    params?: ListUserGroupsParams,
  ): Promise<UserPermissionGroup[]> {
    const { includeExpired = false, includeInactive = false } = params || {};
    const now = new Date();

    let filtered = this.items.filter((item) => item.userId.equals(userId));

    if (!includeExpired) {
      filtered = filtered.filter(
        (item) => !item.expiresAt || item.expiresAt > now,
      );
    }

    if (!includeInactive && this.permissionGroupsRepository) {
      const activeGroupIds = new Set<string>();
      for (const item of filtered) {
        const group = await this.permissionGroupsRepository.findById(
          item.groupId,
        );
        if (group && group.isActive && !group.deletedAt) {
          activeGroupIds.add(item.groupId.toString());
        }
      }
      filtered = filtered.filter((item) =>
        activeGroupIds.has(item.groupId.toString()),
      );
    }

    return filtered;
  }

  async listByGroupId(groupId: UniqueEntityID): Promise<UserPermissionGroup[]> {
    const now = new Date();

    return this.items.filter(
      (item) =>
        item.groupId.equals(groupId) &&
        (!item.expiresAt || item.expiresAt > now),
    );
  }

  async listByGroupIdIncludingExpired(
    groupId: UniqueEntityID,
  ): Promise<UserPermissionGroup[]> {
    return this.items.filter((item) => item.groupId.equals(groupId));
  }

  async listActiveByUserId(
    userId: UniqueEntityID,
  ): Promise<UserPermissionGroup[]> {
    return this.listByUserId(userId, {
      includeExpired: false,
      includeInactive: false,
    });
  }

  async listGroupsByUserId(
    userId: UniqueEntityID,
    params?: ListUserGroupsParams,
  ): Promise<PermissionGroup[]> {
    if (!this.permissionGroupsRepository) return [];

    const userGroups = await this.listByUserId(userId, params);
    const groups: PermissionGroup[] = [];

    for (const ug of userGroups) {
      const group = await this.permissionGroupsRepository.findById(ug.groupId);
      if (group) {
        groups.push(group);
      }
    }

    return groups;
  }

  async listUsersByGroupId(groupId: UniqueEntityID): Promise<UniqueEntityID[]> {
    const userGroups = await this.listByGroupId(groupId);
    return [...new Set(userGroups.map((ug) => ug.userId))];
  }

  async listUserPermissions(userId: UniqueEntityID): Promise<Permission[]> {
    // Obter grupos ativos do usuário
    const userGroups = await this.listActiveByUserId(userId);
    const groupIds = userGroups.map((ug) => ug.groupId);

    // Incluir grupos ancestrais (hierarquia)
    const allGroupIds = new Set(groupIds);
    for (const groupId of groupIds) {
      const ancestors = await this.getAncestorGroupIds(groupId);
      ancestors.forEach((id) => allGroupIds.add(id));
    }

    // Buscar permissões de todos os grupos
    // Nota: Aqui seria necessário acessar o repositório de PermissionGroupPermissions
    // Para simplificar no in-memory, vamos retornar array vazio
    // Na implementação real do Prisma, isso é feito com JOIN

    return [];
  }

  async listUserPermissionsWithEffects(
    userId: UniqueEntityID,
  ): Promise<
    { permission: Permission; effect: string; groupId: UniqueEntityID }[]
  > {
    if (!this.permissionGroupPermissionsRepository) return [];

    // Obter grupos ativos do usuário
    const userGroups = await this.listActiveByUserId(userId);
    const result: {
      permission: Permission;
      effect: string;
      groupId: UniqueEntityID;
    }[] = [];

    // Para cada grupo, buscar suas permissões com efeitos
    for (const userGroup of userGroups) {
      const permissions =
        await this.permissionGroupPermissionsRepository.listPermissionsWithEffects(
          userGroup.groupId,
        );

      for (const perm of permissions) {
        result.push({
          permission: perm.permission,
          effect: perm.effect,
          groupId: userGroup.groupId,
        });
      }
    }

    return result;
  }

  async exists(
    userId: UniqueEntityID,
    groupId: UniqueEntityID,
  ): Promise<boolean> {
    return this.items.some(
      (item) => item.userId.equals(userId) && item.groupId.equals(groupId),
    );
  }

  async countByUserId(userId: UniqueEntityID): Promise<number> {
    const now = new Date();

    return this.items.filter(
      (item) =>
        item.userId.equals(userId) && (!item.expiresAt || item.expiresAt > now),
    ).length;
  }

  async countByGroupId(groupId: UniqueEntityID): Promise<number> {
    const now = new Date();

    return this.items.filter(
      (item) =>
        item.groupId.equals(groupId) &&
        (!item.expiresAt || item.expiresAt > now),
    ).length;
  }

  async countUsersInGroup(groupId: UniqueEntityID): Promise<number> {
    return this.countByGroupId(groupId); // Alias mais claro
  }

  // Método auxiliar para obter IDs dos grupos ancestrais
  private async getAncestorGroupIds(
    groupId: UniqueEntityID,
  ): Promise<UniqueEntityID[]> {
    if (!this.permissionGroupsRepository) return [];

    const ancestors: UniqueEntityID[] = [];
    let currentGroup = await this.permissionGroupsRepository.findById(groupId);

    while (currentGroup?.parentId) {
      const parent = await this.permissionGroupsRepository.findById(
        currentGroup.parentId,
      );

      if (parent) {
        ancestors.push(parent.id);
        currentGroup = parent;
      } else {
        break;
      }
    }

    return ancestors;
  }
}
