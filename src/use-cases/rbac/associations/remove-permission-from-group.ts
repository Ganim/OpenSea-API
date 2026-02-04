import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionGroupPermissionsRepository } from '@/repositories/rbac/permission-group-permissions-repository';
import { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';
import { PermissionsRepository } from '@/repositories/rbac/permissions-repository';

interface RemovePermissionFromGroupRequest {
  groupId: string;
  permissionId: string;
  tenantId?: string;
}

interface RemovePermissionFromGroupResponse {
  success: boolean;
}

export class RemovePermissionFromGroupUseCase {
  constructor(
    private permissionGroupPermissionsRepository: PermissionGroupPermissionsRepository,
    private permissionsRepository: PermissionsRepository,
    private permissionGroupsRepository: PermissionGroupsRepository,
  ) {}

  async execute({
    groupId,
    permissionId,
    tenantId,
  }: RemovePermissionFromGroupRequest): Promise<RemovePermissionFromGroupResponse> {
    const groupIdEntity = new UniqueEntityID(groupId);
    const permissionIdEntity = new UniqueEntityID(permissionId);

    // Verificar se o grupo existe
    const group = await this.permissionGroupsRepository.findById(groupIdEntity);

    if (!group) {
      throw new ResourceNotFoundError('Permission group not found');
    }

    // Verify tenant ownership if tenantId provided
    if (tenantId) {
      const tenantIdEntity = new UniqueEntityID(tenantId);
      const isOwnedByTenant = group.tenantId?.equals(tenantIdEntity);
      const isGlobalGroup = group.tenantId === null;

      if (!isOwnedByTenant && !isGlobalGroup) {
        throw new ForbiddenError(
          'Permission group does not belong to your tenant',
        );
      }
    }

    // Verificar se a permissão existe
    const permission =
      await this.permissionsRepository.findById(permissionIdEntity);

    if (!permission) {
      throw new ResourceNotFoundError('Permission not found');
    }

    // Remover a associação
    await this.permissionGroupPermissionsRepository.remove(
      groupIdEntity,
      permissionIdEntity,
    );

    return { success: true };
  }
}
