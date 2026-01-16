import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionCode } from '@/entities/rbac/value-objects/permission-code';
import { PermissionEffect } from '@/entities/rbac/value-objects/permission-effect';
import type { PermissionGroupPermissionsRepository } from '@/repositories/rbac/permission-group-permissions-repository';
import type { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';
import type { PermissionsRepository } from '@/repositories/rbac/permissions-repository';

interface PermissionInput {
  permissionCode: string;
  effect: 'allow' | 'deny';
  conditions?: Record<string, unknown> | null;
}

interface BulkAddPermissionsToGroupRequest {
  groupId: string;
  permissions: PermissionInput[];
}

interface BulkAddPermissionsToGroupResponse {
  added: number;
  skipped: number;
  errors: { code: string; reason: string }[];
}

export class BulkAddPermissionsToGroupUseCase {
  constructor(
    private permissionGroupsRepository: PermissionGroupsRepository,
    private permissionsRepository: PermissionsRepository,
    private permissionGroupPermissionsRepository: PermissionGroupPermissionsRepository,
  ) {}

  async execute(
    request: BulkAddPermissionsToGroupRequest,
  ): Promise<BulkAddPermissionsToGroupResponse> {
    const { groupId, permissions } = request;

    // Validar grupo existe
    const groupIdEntity = new UniqueEntityID(groupId);
    const group = await this.permissionGroupsRepository.findById(groupIdEntity);

    if (!group) {
      throw new ResourceNotFoundError('Permission group not found');
    }

    if (!group.isActive || group.deletedAt) {
      throw new BadRequestError('Group must be active and not deleted');
    }

    const errors: { code: string; reason: string }[] = [];
    const validPermissions: {
      groupId: UniqueEntityID;
      permissionId: UniqueEntityID;
      effect: PermissionEffect;
      conditions: Record<string, unknown> | null;
    }[] = [];

    // Buscar todas as permissões existentes no grupo para evitar duplicatas
    const existingAssignments =
      await this.permissionGroupPermissionsRepository.listByGroupId(
        groupIdEntity,
      );
    const existingPermissionIds = new Set(
      existingAssignments.map((a) => a.permissionId.toString()),
    );

    // Processar cada permissão
    for (const input of permissions) {
      try {
        // Validar código da permissão
        const permissionCodeEntity = PermissionCode.create(input.permissionCode);

        // Buscar permissão no banco
        const permission =
          await this.permissionsRepository.findByCode(permissionCodeEntity);

        if (!permission) {
          errors.push({
            code: input.permissionCode,
            reason: 'Permission not found',
          });
          continue;
        }

        // Verificar se já existe no grupo
        if (existingPermissionIds.has(permission.id.toString())) {
          // Não é erro, apenas skip
          continue;
        }

        // Adicionar à lista de válidos
        validPermissions.push({
          groupId: groupIdEntity,
          permissionId: permission.id,
          effect: PermissionEffect.create(input.effect),
          conditions: input.conditions ?? null,
        });

        // Marcar como adicionado para evitar duplicatas na mesma requisição
        existingPermissionIds.add(permission.id.toString());
      } catch (error) {
        errors.push({
          code: input.permissionCode,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Adicionar todas as permissões válidas de uma vez
    if (validPermissions.length > 0) {
      await this.permissionGroupPermissionsRepository.addMany(validPermissions);
    }

    const skipped =
      permissions.length - validPermissions.length - errors.length;

    return {
      added: validPermissions.length,
      skipped,
      errors,
    };
  }
}
