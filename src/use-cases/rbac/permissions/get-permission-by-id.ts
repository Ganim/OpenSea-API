import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import type { PermissionsRepository } from '@/repositories/rbac/permissions-repository';

interface GetPermissionByIdRequest {
  id: string;
}

interface GetPermissionByIdResponse {
  permission: Permission;
}

export class GetPermissionByIdUseCase {
  constructor(private permissionsRepository: PermissionsRepository) {}

  async execute({
    id,
  }: GetPermissionByIdRequest): Promise<GetPermissionByIdResponse> {
    const permissionId = new UniqueEntityID(id);

    const permission = await this.permissionsRepository.findById(permissionId);

    if (!permission) {
      throw new ResourceNotFoundError('Permission not found');
    }

    return {
      permission,
    };
  }
}
