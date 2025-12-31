import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UserDirectPermission } from '@/entities/rbac/user-direct-permission';
import type { UserDirectPermissionsRepository } from '@/repositories/rbac/user-direct-permissions-repository';

interface UpdateDirectPermissionRequest {
  id: string;
  effect?: 'allow' | 'deny';
  conditions?: Record<string, unknown> | null;
  expiresAt?: Date | null;
}

interface UpdateDirectPermissionResponse {
  directPermission: UserDirectPermission;
}

export class UpdateDirectPermissionUseCase {
  constructor(
    private userDirectPermissionsRepository: UserDirectPermissionsRepository,
  ) {}

  async execute(
    request: UpdateDirectPermissionRequest,
  ): Promise<UpdateDirectPermissionResponse> {
    const { id, effect, conditions, expiresAt } = request;

    const idEntity = new UniqueEntityID(id);

    // Verificar se a permissão direta existe
    const existingPermission =
      await this.userDirectPermissionsRepository.findById(idEntity);

    if (!existingPermission) {
      throw new ResourceNotFoundError('Direct permission not found');
    }

    // Atualizar permissão
    const updatedPermission = await this.userDirectPermissionsRepository.update(
      {
        id: idEntity,
        effect,
        conditions,
        expiresAt,
      },
    );

    if (!updatedPermission) {
      throw new ResourceNotFoundError('Failed to update direct permission');
    }

    return {
      directPermission: updatedPermission,
    };
  }
}
