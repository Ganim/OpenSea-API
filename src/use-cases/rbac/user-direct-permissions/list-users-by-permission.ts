import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TenantUsersRepository } from '@/repositories/core/tenant-users-repository';
import type { PermissionsRepository } from '@/repositories/rbac/permissions-repository';
import type { UserDirectPermissionsRepository } from '@/repositories/rbac/user-direct-permissions-repository';

interface ListUsersByPermissionRequest {
  permissionId: string;
  tenantId?: string;
}

interface ListUsersByPermissionResponse {
  userIds: string[];
}

export class ListUsersByPermissionUseCase {
  constructor(
    private permissionsRepository: PermissionsRepository,
    private userDirectPermissionsRepository: UserDirectPermissionsRepository,
    private tenantUsersRepository?: TenantUsersRepository,
  ) {}

  async execute(
    request: ListUsersByPermissionRequest,
  ): Promise<ListUsersByPermissionResponse> {
    const { permissionId, tenantId } = request;

    // Validar permissão existe
    const permissionIdEntity = new UniqueEntityID(permissionId);
    const permission =
      await this.permissionsRepository.findById(permissionIdEntity);

    if (!permission) {
      throw new ResourceNotFoundError('Permission not found');
    }

    // Buscar usuários que possuem esta permissão diretamente
    let userIds =
      await this.userDirectPermissionsRepository.listUsersByPermissionId(
        permissionIdEntity,
      );

    // Filter by tenant if tenantId provided
    if (tenantId && this.tenantUsersRepository) {
      const tenantIdEntity = new UniqueEntityID(tenantId);
      const tenantUsers =
        await this.tenantUsersRepository.findByTenant(tenantIdEntity);
      const tenantUserIdSet = new Set(
        tenantUsers.map((tu) => tu.userId.toString()),
      );
      userIds = userIds.filter((userId) =>
        tenantUserIdSet.has(userId.toString()),
      );
    }

    return {
      userIds: userIds.map((id) => id.toString()),
    };
  }
}
