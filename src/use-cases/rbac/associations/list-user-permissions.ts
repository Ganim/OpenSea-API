import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { UsersRepository } from '@/repositories/core/users-repository';
import { UserPermissionGroupsRepository } from '@/repositories/rbac/user-permission-groups-repository';

interface PermissionWithEffect {
  permission: Permission;
  effect: string;
  groupId: UniqueEntityID;
  conditions: any;
}

interface ListUserPermissionsRequest {
  userId: string;
  module?: string;
  resource?: string;
  action?: string;
}

interface ListUserPermissionsResponse {
  permissions: PermissionWithEffect[];
}

export class ListUserPermissionsUseCase {
  constructor(
    private userPermissionGroupsRepository: UserPermissionGroupsRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    userId,
    module,
    resource,
    action,
  }: ListUserPermissionsRequest): Promise<ListUserPermissionsResponse> {
    const userIdEntity = new UniqueEntityID(userId);

    // Verificar se o usuário existe
    const user = await this.usersRepository.findById(userIdEntity);

    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    // Buscar permissões efetivas do usuário (de todos os grupos)
    const permissionsWithEffects =
      await this.userPermissionGroupsRepository.listUserPermissionsWithEffects(
        userIdEntity,
      );

    let permissions: PermissionWithEffect[] = permissionsWithEffects.map(
      (item) => ({
        permission: item.permission,
        effect: item.effect,
        groupId: item.groupId,
        conditions: item.conditions,
      }),
    );

    // Aplicar filtros se fornecidos
    if (module) {
      permissions = permissions.filter(
        (item) => item.permission.module === module,
      );
    }
    if (resource) {
      permissions = permissions.filter(
        (item) => item.permission.resource === resource,
      );
    }
    if (action) {
      permissions = permissions.filter(
        (item) => item.permission.action === action,
      );
    }

    return { permissions };
  }
}
