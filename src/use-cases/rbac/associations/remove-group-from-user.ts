import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UsersRepository } from '@/repositories/core/users-repository';
import { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';
import { UserPermissionGroupsRepository } from '@/repositories/rbac/user-permission-groups-repository';

interface RemoveGroupFromUserRequest {
  userId: string;
  groupId: string;
  tenantId?: string;
}

interface RemoveGroupFromUserResponse {
  success: boolean;
}

export class RemoveGroupFromUserUseCase {
  constructor(
    private userPermissionGroupsRepository: UserPermissionGroupsRepository,
    private usersRepository: UsersRepository,
    private permissionGroupsRepository: PermissionGroupsRepository,
  ) {}

  async execute({
    userId,
    groupId,
    tenantId,
  }: RemoveGroupFromUserRequest): Promise<RemoveGroupFromUserResponse> {
    const userIdEntity = new UniqueEntityID(userId);
    const groupIdEntity = new UniqueEntityID(groupId);

    // Verificar se o usuário existe
    const user = await this.usersRepository.findById(userIdEntity);

    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    // Verificar se o grupo existe
    const group = await this.permissionGroupsRepository.findById(groupIdEntity);

    if (!group) {
      throw new ResourceNotFoundError('Permission group not found');
    }

    // Verify tenant ownership if tenantId provided
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

    // Remover a associação
    await this.userPermissionGroupsRepository.remove(
      userIdEntity,
      groupIdEntity,
    );

    return { success: true };
  }
}
