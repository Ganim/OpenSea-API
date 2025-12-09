import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { UsersRepository } from '@/repositories/core/users-repository';
import type { PermissionsRepository } from '@/repositories/rbac/permissions-repository';
import type { UserDirectPermissionsRepository } from '@/repositories/rbac/user-direct-permissions-repository';

interface RevokeDirectPermissionRequest {
  userId: string;
  permissionId: string;
}

interface RevokeDirectPermissionResponse {
  success: boolean;
}

export class RevokeDirectPermissionUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private permissionsRepository: PermissionsRepository,
    private userDirectPermissionsRepository: UserDirectPermissionsRepository,
  ) {}

  async execute(
    request: RevokeDirectPermissionRequest,
  ): Promise<RevokeDirectPermissionResponse> {
    const { userId, permissionId } = request;

    // Validar usuário existe
    const userIdEntity = new UniqueEntityID(userId);
    const user = await this.usersRepository.findById(userIdEntity);

    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    // Validar permissão existe
    const permissionIdEntity = new UniqueEntityID(permissionId);
    const permission =
      await this.permissionsRepository.findById(permissionIdEntity);

    if (!permission) {
      throw new ResourceNotFoundError('Permission not found');
    }

    // Verificar se a permissão está atribuída ao usuário
    const exists = await this.userDirectPermissionsRepository.exists(
      userIdEntity,
      permissionIdEntity,
    );

    if (!exists) {
      throw new ResourceNotFoundError(
        'User does not have this permission assigned',
      );
    }

    // Revogar permissão
    await this.userDirectPermissionsRepository.revoke(
      userIdEntity,
      permissionIdEntity,
    );

    return {
      success: true,
    };
  }
}
