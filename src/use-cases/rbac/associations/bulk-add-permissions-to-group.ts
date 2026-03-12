import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
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
  tenantId?: string;
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
    const { groupId, permissions, tenantId } = request;

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

    const errors: { code: string; reason: string }[] = [];
    const validPermissions: {
      groupId: UniqueEntityID;
      permissionId: UniqueEntityID;
      effect: PermissionEffect;
      conditions: Record<string, unknown> | null;
    }[] = [];

    // Validar todos os códigos de permissão e criar Map input -> PermissionCode
    const validInputs: {
      input: PermissionInput;
      code: PermissionCode;
    }[] = [];

    for (const input of permissions) {
      try {
        const code = PermissionCode.create(input.permissionCode);
        validInputs.push({ input, code });
      } catch (error) {
        errors.push({
          code: input.permissionCode,
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Batch: buscar todas as permissões e assignments existentes em paralelo
    const [foundPermissions, existingAssignments] = await Promise.all([
      this.permissionsRepository.findManyByCodes(
        validInputs.map((v) => v.code),
      ),
      this.permissionGroupPermissionsRepository.listByGroupId(groupIdEntity),
    ]);

    // Indexar permissões encontradas por código
    const permissionByCode = new Map(
      foundPermissions.map((p) => [p.code.value, p]),
    );
    const existingPermissionIds = new Set(
      existingAssignments.map((a) => a.permissionId.toString()),
    );

    // Processar cada permissão validada
    for (const { input, code } of validInputs) {
      const permission = permissionByCode.get(code.value);

      if (!permission) {
        errors.push({
          code: input.permissionCode,
          reason: 'Permission not found',
        });
        continue;
      }

      // Verificar se já existe no grupo
      if (existingPermissionIds.has(permission.id.toString())) {
        continue;
      }

      validPermissions.push({
        groupId: groupIdEntity,
        permissionId: permission.id,
        effect: PermissionEffect.create(input.effect),
        conditions: input.conditions ?? null,
      });

      existingPermissionIds.add(permission.id.toString());
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
