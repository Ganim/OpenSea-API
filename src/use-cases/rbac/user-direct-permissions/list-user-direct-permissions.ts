import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import type { UsersRepository } from '@/repositories/core/users-repository';
import type { PermissionsRepository } from '@/repositories/rbac/permissions-repository';
import type { UserDirectPermissionsRepository } from '@/repositories/rbac/user-direct-permissions-repository';

interface PermissionWithEffect {
  permission: Permission;
  effect: string;
  conditions: Record<string, unknown> | null;
}

interface ListUserDirectPermissionsRequest {
  userId: string;
  includeExpired?: boolean;
  effect?: 'allow' | 'deny';
}

interface ListUserDirectPermissionsResponse {
  permissions: PermissionWithEffect[];
}

export class ListUserDirectPermissionsUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private permissionsRepository: PermissionsRepository,
    private userDirectPermissionsRepository: UserDirectPermissionsRepository,
  ) {}

  async execute(
    request: ListUserDirectPermissionsRequest,
  ): Promise<ListUserDirectPermissionsResponse> {
    const { userId, includeExpired = false, effect } = request;

    // Validar usuário existe
    const userIdEntity = new UniqueEntityID(userId);
    const user = await this.usersRepository.findById(userIdEntity);

    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    // Buscar permissões diretas
    const directPermissions = await this.userDirectPermissionsRepository.listByUserId(
      userIdEntity,
      { includeExpired, effect },
    );

    // Buscar detalhes das permissões
    const permissionsWithEffects: PermissionWithEffect[] = [];

    for (const dp of directPermissions) {
      const permission = await this.permissionsRepository.findById(dp.permissionId);
      if (permission) {
        permissionsWithEffects.push({
          permission,
          effect: dp.effect,
          conditions: dp.conditions,
        });
      }
    }

    return {
      permissions: permissionsWithEffects,
    };
  }
}
