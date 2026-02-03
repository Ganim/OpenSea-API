import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionGroup } from '@/entities/rbac/permission-group';
import type { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';

interface CreatePermissionGroupRequest {
  name: string;
  slug: string;
  description: string | null;
  isSystem?: boolean;
  isActive?: boolean;
  color?: string | null;
  priority?: number;
  parentId?: string | null;
  tenantId?: string | null;
}

interface CreatePermissionGroupResponse {
  group: PermissionGroup;
}

export class CreatePermissionGroupUseCase {
  constructor(private permissionGroupsRepository: PermissionGroupsRepository) {}

  async execute(
    request: CreatePermissionGroupRequest,
  ): Promise<CreatePermissionGroupResponse> {
    const {
      name,
      slug,
      description,
      isSystem = false,
      isActive = true,
      color,
      priority = 0,
      parentId,
      tenantId,
    } = request;

    const tenantIdEntity = tenantId ? new UniqueEntityID(tenantId) : null;

    // Verificar se slug já existe dentro do mesmo tenant (ou global)
    if (tenantIdEntity) {
      const existingBySlugInTenant =
        await this.permissionGroupsRepository.findBySlugAndTenantId(
          slug,
          tenantIdEntity,
        );

      if (existingBySlugInTenant) {
        throw new BadRequestError(`Group with slug '${slug}' already exists`);
      }
    } else {
      const groupExists = await this.permissionGroupsRepository.exists(slug);

      if (groupExists) {
        throw new BadRequestError(`Group with slug '${slug}' already exists`);
      }
    }

    // Verificar se nome já existe
    const groupWithNameExists =
      await this.permissionGroupsRepository.findByName(name);

    if (groupWithNameExists) {
      throw new BadRequestError(`Group with name '${name}' already exists`);
    }

    // Validar parentId se fornecido
    let parentIdEntity: UniqueEntityID | null = null;

    if (parentId) {
      parentIdEntity = new UniqueEntityID(parentId);

      const parentGroup =
        await this.permissionGroupsRepository.findById(parentIdEntity);

      if (!parentGroup) {
        throw new BadRequestError(
          `Parent group with ID '${parentId}' not found`,
        );
      }

      if (!parentGroup.isActive || parentGroup.deletedAt) {
        throw new BadRequestError(
          'Parent group must be active and not deleted',
        );
      }
    }

    // Criar grupo
    const group = await this.permissionGroupsRepository.create({
      name,
      slug,
      description,
      isSystem,
      isActive,
      color: color ?? null,
      priority,
      parentId: parentIdEntity,
      tenantId: tenantIdEntity,
    });

    return {
      group,
    };
  }
}
