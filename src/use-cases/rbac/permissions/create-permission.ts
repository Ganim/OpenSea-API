import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { Permission } from '@/entities/rbac/permission';
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import type { PermissionsRepository } from '@/repositories/rbac/permissions-repository';

interface CreatePermissionRequest {
  code: string;
  name: string;
  description: string | null;
  module: string;
  resource: string;
  action: string;
  isSystem?: boolean;
  metadata?: Record<string, unknown>;
}

interface CreatePermissionResponse {
  permission: Permission;
}

export class CreatePermissionUseCase {
  constructor(private permissionsRepository: PermissionsRepository) {}

  async execute(
    request: CreatePermissionRequest,
  ): Promise<CreatePermissionResponse> {
    const {
      code,
      name,
      description,
      module,
      resource,
      action,
      isSystem = false,
      metadata = {},
    } = request;

    // Validar código da permissão
    const permissionCode = PermissionCode.create(code);

    // Verificar se permissão já existe
    const permissionExists =
      await this.permissionsRepository.exists(permissionCode);

    if (permissionExists) {
      throw new BadRequestError(
        `Permission with code '${code}' already exists`,
      );
    }

    // Criar permissão
    const permission = await this.permissionsRepository.create({
      code: permissionCode,
      name,
      description,
      module,
      resource,
      action,
      isSystem,
      metadata,
    });

    return {
      permission,
    };
  }
}
