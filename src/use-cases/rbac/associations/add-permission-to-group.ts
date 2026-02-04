import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionGroupPermission } from '@/entities/rbac/permission-group-permission';
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import { PermissionEffect } from '@/entities/rbac/value-objects/permission-effect';
import type { PermissionGroupPermissionsRepository } from '@/repositories/rbac/permission-group-permissions-repository';
import type { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';
import type { PermissionsRepository } from '@/repositories/rbac/permissions-repository';

interface AddPermissionToGroupRequest {
  groupId: string;
  permissionCode: string;
  effect: 'allow' | 'deny';
  conditions?: Record<string, unknown> | null;
  tenantId?: string;
}

interface AddPermissionToGroupResponse {
  groupPermission: PermissionGroupPermission;
}

export class AddPermissionToGroupUseCase {
  constructor(
    private permissionGroupsRepository: PermissionGroupsRepository,
    private permissionsRepository: PermissionsRepository,
    private permissionGroupPermissionsRepository: PermissionGroupPermissionsRepository,
  ) {}

  async execute(
    request: AddPermissionToGroupRequest,
  ): Promise<AddPermissionToGroupResponse> {
    const {
      groupId,
      permissionCode,
      effect,
      conditions = null,
      tenantId,
    } = request;

    // Validar grupo existe
    const groupIdEntity = new UniqueEntityID(groupId);
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

    if (!group.isActive || group.deletedAt) {
      throw new BadRequestError('Group must be active and not deleted');
    }

    // Validar permissão existe
    const permissionCodeEntity = PermissionCode.create(permissionCode);
    const permission =
      await this.permissionsRepository.findByCode(permissionCodeEntity);

    if (!permission) {
      throw new ResourceNotFoundError('Permission not found');
    }

    // Verificar se já existe essa permissão no grupo
    const alreadyExists =
      await this.permissionGroupPermissionsRepository.exists(
        groupIdEntity,
        permission.id,
      );

    if (alreadyExists) {
      throw new BadRequestError(
        'This permission is already assigned to this group',
      );
    }

    // Adicionar permissão ao grupo
    const groupPermission = await this.permissionGroupPermissionsRepository.add(
      {
        groupId: groupIdEntity,
        permissionId: permission.id,
        effect: PermissionEffect.create(effect),
        conditions,
      },
    );

    return {
      groupPermission,
    };
  }
}
