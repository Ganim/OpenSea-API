import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import type { PermissionsRepository } from '@/repositories/rbac/permissions-repository';

interface UpdatePermissionRequest {
  permissionId: string;
  name?: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
}

interface UpdatePermissionResponse {
  permission: Permission;
}

export class UpdatePermissionUseCase {
  constructor(private permissionsRepository: PermissionsRepository) {}

  async execute(
    request: UpdatePermissionRequest,
  ): Promise<UpdatePermissionResponse> {
    const { permissionId, name, description, metadata } = request;

    const id = new UniqueEntityID(permissionId);
    const permission = await this.permissionsRepository.findById(id);

    if (!permission) {
      throw new ResourceNotFoundError('Permission not found');
    }

    const updated = await this.permissionsRepository.update({
      id,
      name,
      description,
      metadata,
    });

    if (!updated) {
      throw new ResourceNotFoundError('Permission not found');
    }

    return {
      permission: updated,
    };
  }
}
