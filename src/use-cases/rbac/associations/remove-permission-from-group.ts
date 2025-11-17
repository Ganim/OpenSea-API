import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionGroupPermissionsRepository } from '@/repositories/rbac/permission-group-permissions-repository';
import { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';
import { PermissionsRepository } from '@/repositories/rbac/permissions-repository';

interface RemovePermissionFromGroupRequest {
  groupId: string;
  permissionId: string;
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
  }: RemovePermissionFromGroupRequest): Promise<RemovePermissionFromGroupResponse> {
    const groupIdEntity = new UniqueEntityID(groupId);
    const permissionIdEntity = new UniqueEntityID(permissionId);

    // Verificar se o grupo existe
    const group = await this.permissionGroupsRepository.findById(groupIdEntity);

    if (!group) {
      throw new ResourceNotFoundError('Permission group not found');
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
