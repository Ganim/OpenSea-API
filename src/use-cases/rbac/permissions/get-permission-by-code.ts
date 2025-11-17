import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { Permission } from '@/entities/rbac/permission';
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import type { PermissionsRepository } from '@/repositories/rbac/permissions-repository';

interface GetPermissionByCodeRequest {
  code: string;
}

interface GetPermissionByCodeResponse {
  permission: Permission;
}

export class GetPermissionByCodeUseCase {
  constructor(private permissionsRepository: PermissionsRepository) {}

  async execute(
    request: GetPermissionByCodeRequest,
  ): Promise<GetPermissionByCodeResponse> {
    const { code } = request;

    const permissionCode = PermissionCode.create(code);
    const permission =
      await this.permissionsRepository.findByCode(permissionCode);

    if (!permission) {
      throw new ResourceNotFoundError('Permission not found');
    }

    return {
      permission,
    };
  }
}
