import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { User } from '@/entities/core/user';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { PermissionGroup } from '@/entities/rbac/permission-group';
import { UsersRepository } from '@/repositories/core/users-repository';
import { PermissionGroupPermissionsRepository } from '@/repositories/rbac/permission-group-permissions-repository';
import { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';
import { UserPermissionGroupsRepository } from '@/repositories/rbac/user-permission-groups-repository';

interface GetPermissionGroupByIdRequest {
  id: string;
  tenantId?: string;
}

interface GetPermissionGroupByIdResponse {
  group: PermissionGroup;
  users: User[];
  permissions: Array<{
    permission: Permission;
    effect: string;
    conditions: Record<string, unknown> | null;
  }>;
}

export class GetPermissionGroupByIdUseCase {
  constructor(
    private permissionGroupsRepository: PermissionGroupsRepository,
    private userPermissionGroupsRepository: UserPermissionGroupsRepository,
    private permissionGroupPermissionsRepository: PermissionGroupPermissionsRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    id,
    tenantId,
  }: GetPermissionGroupByIdRequest): Promise<GetPermissionGroupByIdResponse> {
    const group = await this.permissionGroupsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!group) {
      throw new ResourceNotFoundError('Permission group not found');
    }

    // If tenantId is provided, verify the group belongs to the tenant or is a system/global group
    if (tenantId) {
      const tenantIdEntity = new UniqueEntityID(tenantId);
      const isOwnedByTenant = group.tenantId?.equals(tenantIdEntity);
      const isGlobalGroup = group.tenantId === null;

      if (!isOwnedByTenant && !isGlobalGroup) {
        throw new ForbiddenError(
          'Permission group does not belong to your tenant',
        );
      }
    }

    // Buscar usuários do grupo
    const userIds =
      await this.userPermissionGroupsRepository.listUsersByGroupId(group.id);
    const users = await this.usersRepository.findManyByIds(userIds);

    // Buscar permissões do grupo com efeitos
    const groupPermissions =
      await this.permissionGroupPermissionsRepository.listPermissionsWithEffects(
        group.id,
      );

    return {
      group,
      users,
      permissions: groupPermissions,
    };
  }
}
