import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PermissionGroupPermissionsRepository } from '@/repositories/rbac/permission-group-permissions-repository';
import type { PermissionsRepository } from '@/repositories/rbac/permissions-repository';

interface DeletePermissionRequest {
  permissionId: string;
  force?: boolean; // Se true, deleta mesmo se estiver em uso
}

interface DeletePermissionResponse {
  success: true;
}

export class DeletePermissionUseCase {
  constructor(
    private permissionsRepository: PermissionsRepository,
    private permissionGroupPermissionsRepository: PermissionGroupPermissionsRepository,
  ) {}

  async execute(
    request: DeletePermissionRequest,
  ): Promise<DeletePermissionResponse> {
    const { permissionId, force = false } = request;

    const id = new UniqueEntityID(permissionId);
    const permission = await this.permissionsRepository.findById(id);

    if (!permission) {
      throw new ResourceNotFoundError('Permission not found');
    }

    // Verificar se a permissão está em uso
    const usages =
      await this.permissionGroupPermissionsRepository.listByPermissionId(id);

    if (usages.length > 0 && !force) {
      throw new BadRequestError(
        `Cannot delete permission. It is assigned to ${usages.length} group(s). Use force=true to delete anyway.`,
      );
    }

    // Remover todas as associações se force=true
    if (force && usages.length > 0) {
      for (const usage of usages) {
        await this.permissionGroupPermissionsRepository.remove(
          usage.groupId,
          usage.permissionId,
        );
      }
    }

    // Deletar a permissão
    await this.permissionsRepository.delete(id);

    return {
      success: true,
    };
  }
}
