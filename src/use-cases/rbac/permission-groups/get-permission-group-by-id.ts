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
  }: GetPermissionGroupByIdRequest): Promise<GetPermissionGroupByIdResponse> {
    const group = await this.permissionGroupsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!group) {
      throw new ResourceNotFoundError('Permission group not found');
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
