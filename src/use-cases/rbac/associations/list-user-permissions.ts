import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { UsersRepository } from '@/repositories/core/users-repository';
import { UserPermissionGroupsRepository } from '@/repositories/rbac/user-permission-groups-repository';

interface PermissionWithEffect {
  permission: Permission;
  effect: string;
  groupId: UniqueEntityID;
}

interface ListUserPermissionsRequest {
  userId: string;
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

    const permissions: PermissionWithEffect[] = permissionsWithEffects.map(
      (item) => ({
        permission: item.permission,
        effect: item.effect,
        groupId: item.groupId,
      }),
    );

    return { permissions };
  }
}
