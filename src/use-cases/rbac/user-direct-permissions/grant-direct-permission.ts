import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UserDirectPermission } from '@/entities/rbac/user-direct-permission';
import type { UsersRepository } from '@/repositories/core/users-repository';
import type { PermissionsRepository } from '@/repositories/rbac/permissions-repository';
import type { UserDirectPermissionsRepository } from '@/repositories/rbac/user-direct-permissions-repository';

interface GrantDirectPermissionRequest {
  userId: string;
  permissionId: string;
  effect?: 'allow' | 'deny';
  conditions?: Record<string, unknown> | null;
  expiresAt?: Date | null;
  grantedBy?: string | null;
}

interface GrantDirectPermissionResponse {
  directPermission: UserDirectPermission;
}

export class GrantDirectPermissionUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private permissionsRepository: PermissionsRepository,
    private userDirectPermissionsRepository: UserDirectPermissionsRepository,
  ) {}

  async execute(
    request: GrantDirectPermissionRequest,
  ): Promise<GrantDirectPermissionResponse> {
    const {
      userId,
      permissionId,
      effect = 'allow',
      conditions = null,
      expiresAt = null,
      grantedBy = null,
    } = request;

    // Validar usuário existe
    const userIdEntity = new UniqueEntityID(userId);
    const user = await this.usersRepository.findById(userIdEntity);

    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    if (user.isBlocked) {
      throw new BadRequestError('Cannot grant permission to blocked user');
    }

    // Validar permissão existe
    const permissionIdEntity = new UniqueEntityID(permissionId);
    const permission =
      await this.permissionsRepository.findById(permissionIdEntity);

    if (!permission) {
      throw new ResourceNotFoundError('Permission not found');
    }

    // Verificar se já existe
    const exists = await this.userDirectPermissionsRepository.exists(
      userIdEntity,
      permissionIdEntity,
    );

    if (exists) {
      throw new BadRequestError('User already has this permission assigned');
    }

    // Validar grantedBy se fornecido
    let grantedByEntity: UniqueEntityID | null = null;

    if (grantedBy) {
      grantedByEntity = new UniqueEntityID(grantedBy);
      const granterUser = await this.usersRepository.findById(grantedByEntity);

      if (!granterUser) {
        throw new ResourceNotFoundError('Granter user not found');
      }
    }

    // Conceder permissão ao usuário
    const directPermission = await this.userDirectPermissionsRepository.grant({
      userId: userIdEntity,
      permissionId: permissionIdEntity,
      effect,
      conditions,
      expiresAt,
      grantedBy: grantedByEntity,
    });

    return {
      directPermission,
    };
  }
}
