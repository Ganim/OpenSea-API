import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { PermissionGroupPermissionsRepository } from '@/repositories/rbac/permission-group-permissions-repository';
import { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';

interface PermissionWithEffect {
  permission: Permission;
  effect: string;
  conditions: Record<string, unknown> | null;
}

interface ListGroupPermissionsRequest {
  groupId: string;
  tenantId?: string;
}

interface ListGroupPermissionsResponse {
  permissions: PermissionWithEffect[];
}

export class ListGroupPermissionsUseCase {
  constructor(
    private permissionGroupPermissionsRepository: PermissionGroupPermissionsRepository,
    private permissionGroupsRepository: PermissionGroupsRepository,
  ) {}

  async execute({
    groupId,
    tenantId,
  }: ListGroupPermissionsRequest): Promise<ListGroupPermissionsResponse> {
    const id = new UniqueEntityID(groupId);

    // Verificar se o grupo existe
    const group = await this.permissionGroupsRepository.findById(id);

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

    // Buscar permissões com efeitos
    const permissionsWithEffects =
      await this.permissionGroupPermissionsRepository.listPermissionsWithEffects(
        id,
      );

    const permissions: PermissionWithEffect[] = permissionsWithEffects.map(
      (item) => ({
        permission: item.permission,
        effect: item.effect,
        conditions: item.conditions,
      }),
    );

    return { permissions };
  }
}
