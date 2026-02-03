import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';
import { UserPermissionGroupsRepository } from '@/repositories/rbac/user-permission-groups-repository';

interface DeletePermissionGroupRequest {
  groupId: string;
  tenantId?: string;
  force?: boolean; // Força exclusão mesmo se em uso
}

interface DeletePermissionGroupResponse {
  success: boolean;
}

export class DeletePermissionGroupUseCase {
  constructor(
    private permissionGroupsRepository: PermissionGroupsRepository,
    private userPermissionGroupsRepository: UserPermissionGroupsRepository,
  ) {}

  async execute({
    groupId,
    tenantId,
    force = false,
  }: DeletePermissionGroupRequest): Promise<DeletePermissionGroupResponse> {
    const id = new UniqueEntityID(groupId);

    // Verificar se o grupo existe
    const group = await this.permissionGroupsRepository.findById(id);

    if (!group) {
      throw new ResourceNotFoundError('Permission group not found');
    }

    // If tenantId is provided, verify the group belongs to the tenant
    // System/global groups (tenantId = null) cannot be deleted by tenants
    if (tenantId) {
      const tenantIdEntity = new UniqueEntityID(tenantId);
      const isOwnedByTenant = group.tenantId?.equals(tenantIdEntity);

      if (!isOwnedByTenant) {
        if (group.tenantId === null) {
          throw new ForbiddenError(
            'System groups cannot be deleted by tenants',
          );
        }
        throw new ForbiddenError(
          'Permission group does not belong to your tenant',
        );
      }
    }

    // Não permitir deletar grupos de sistema
    if (group.isSystem) {
      throw new BadRequestError('Cannot delete system permission groups');
    }

    // Verificar se há grupos filhos
    const children = await this.permissionGroupsRepository.findChildren(id);

    if (children.length > 0) {
      throw new BadRequestError(
        'Cannot delete group with child groups. Remove children first.',
      );
    }

    // Verificar se está em uso por usuários (a menos que force=true)
    if (!force) {
      const usersCount =
        await this.userPermissionGroupsRepository.countUsersInGroup(id);

      if (usersCount > 0) {
        throw new BadRequestError(
          `Cannot delete group assigned to ${usersCount} user(s). Use force=true to delete anyway.`,
        );
      }
    }

    // Soft delete do grupo
    await this.permissionGroupsRepository.delete(id);

    // Se force=true, remover também as atribuições de usuários
    if (force) {
      await this.userPermissionGroupsRepository.removeAllUsersFromGroup(id);
    }

    return { success: true };
  }
}
