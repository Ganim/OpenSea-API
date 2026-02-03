import type { User } from '@/entities/core/user';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Permission } from '@/entities/rbac/permission';
import type { PermissionGroup } from '@/entities/rbac/permission-group';
import { UsersRepository } from '@/repositories/core/users-repository';
import { PermissionGroupPermissionsRepository } from '@/repositories/rbac/permission-group-permissions-repository';
import { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';
import { PermissionsRepository } from '@/repositories/rbac/permissions-repository';
import { UserPermissionGroupsRepository } from '@/repositories/rbac/user-permission-groups-repository';

interface ListPermissionGroupsRequest {
  tenantId?: string;
  isActive?: boolean;
  isSystem?: boolean;
  parentId?: string | null;
}

interface GroupWithDetails {
  group: PermissionGroup;
  users: User[];
  permissions: Array<{
    permission: Permission;
    effect: string;
    conditions: Record<string, unknown> | null;
  }>;
}

interface ListPermissionGroupsResponse {
  groups: GroupWithDetails[];
}

export class ListPermissionGroupsUseCase {
  constructor(
    private permissionGroupsRepository: PermissionGroupsRepository,
    private userPermissionGroupsRepository: UserPermissionGroupsRepository,
    private permissionGroupPermissionsRepository: PermissionGroupPermissionsRepository,
    private usersRepository: UsersRepository,
    private permissionsRepository: PermissionsRepository,
  ) {}

  async execute({
    tenantId,
    isActive,
    isSystem,
    parentId,
  }: ListPermissionGroupsRequest): Promise<ListPermissionGroupsResponse> {
    let groups: PermissionGroup[];

    const tenantIdEntity = tenantId ? new UniqueEntityID(tenantId) : undefined;

    // Listar grupos de sistema
    if (isSystem === true) {
      groups = await this.permissionGroupsRepository.listSystemGroups();
    }
    // Listar por pai específico
    else if (parentId) {
      const parentIdEntity = new UniqueEntityID(parentId);
      groups =
        await this.permissionGroupsRepository.listByParentId(parentIdEntity);
    }
    // Listar com escopo de tenant (tenant groups + system/global groups)
    else if (tenantIdEntity) {
      const tenantGroups =
        await this.permissionGroupsRepository.listByTenantId(tenantIdEntity);
      const systemGroups =
        await this.permissionGroupsRepository.listSystemGroups();

      // Merge tenant-specific groups with system (global) groups, avoiding duplicates
      const groupIds = new Set(tenantGroups.map((g) => g.id.toString()));
      const mergedGroups = [...tenantGroups];
      for (const sysGroup of systemGroups) {
        if (!groupIds.has(sysGroup.id.toString())) {
          mergedGroups.push(sysGroup);
        }
      }
      groups = mergedGroups;
    }
    // Listar todos (sem escopo de tenant - para super admin ou contexto sem tenant)
    else {
      groups = await this.permissionGroupsRepository.listAll();
    }

    // Filtrar por isActive e isSystem=false se fornecidos
    if (isActive !== undefined) {
      groups = groups.filter((group) => group.isActive === isActive);
    }

    if (isSystem === false) {
      groups = groups.filter((group) => !group.isSystem);
    }

    // Enriquecer cada grupo com dados de usuários e permissões
    const groupsWithDetails = await Promise.all(
      groups.map(async (group) => {
        // Buscar usuários associados ao grupo
        const userPermissionGroups =
          await this.userPermissionGroupsRepository.listByGroupId(group.id);
        const userIds = userPermissionGroups.map((upg) => upg.userId);
        const users = userIds.length
          ? await this.usersRepository.findManyByIds(userIds)
          : [];

        // Buscar permissões associadas ao grupo
        const permissionGroupPerms =
          await this.permissionGroupPermissionsRepository.listByGroupId(
            group.id,
          );

        const permissions = (
          await Promise.all(
            permissionGroupPerms.map(async (pgp) => {
              const permission = await this.permissionsRepository.findById(
                pgp.permissionId,
              );
              if (!permission) return null;
              return {
                permission,
                effect:
                  typeof pgp.effect === 'object'
                    ? String(pgp.effect)
                    : pgp.effect,
                conditions: pgp.conditions,
              };
            }),
          )
        ).filter((p) => p !== null) as Array<{
          permission: Permission;
          effect: string;
          conditions: Record<string, unknown> | null;
        }>;

        return {
          group,
          users,
          permissions,
        };
      }),
    );

    return { groups: groupsWithDetails };
  }
}
