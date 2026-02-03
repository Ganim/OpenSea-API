import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionGroup } from '@/entities/rbac/permission-group';
import type { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';

interface UpdatePermissionGroupRequest {
  groupId: string;
  tenantId?: string;
  name?: string;
  description?: string | null;
  color?: string | null;
  priority?: number;
  parentId?: string | null;
  isActive?: boolean;
}

interface UpdatePermissionGroupResponse {
  group: PermissionGroup;
}

export class UpdatePermissionGroupUseCase {
  constructor(private permissionGroupsRepository: PermissionGroupsRepository) {}

  async execute(
    request: UpdatePermissionGroupRequest,
  ): Promise<UpdatePermissionGroupResponse> {
    const {
      groupId,
      tenantId,
      name,
      description,
      color,
      priority,
      parentId,
      isActive,
    } = request;

    const id = new UniqueEntityID(groupId);
    const group = await this.permissionGroupsRepository.findById(id);

    if (!group) {
      throw new ResourceNotFoundError('Permission group not found');
    }

    // If tenantId is provided, verify the group belongs to the tenant
    // System/global groups (tenantId = null) cannot be edited by tenants
    if (tenantId) {
      const tenantIdEntity = new UniqueEntityID(tenantId);
      const isOwnedByTenant = group.tenantId?.equals(tenantIdEntity);

      if (!isOwnedByTenant) {
        if (group.tenantId === null) {
          throw new ForbiddenError('System groups cannot be edited by tenants');
        }
        throw new ForbiddenError(
          'Permission group does not belong to your tenant',
        );
      }
    }

    // Validar slug se o nome mudou
    let newSlug: string | undefined;
    if (name && name !== group.name) {
      newSlug = name.toLowerCase().replace(/\s+/g, '-');
      const existingBySlug =
        await this.permissionGroupsRepository.findBySlug(newSlug);

      if (existingBySlug && !existingBySlug.id.equals(id)) {
        throw new BadRequestError('A group with this name already exists');
      }
    }

    // Validar parent se mudou
    let parentIdEntity: UniqueEntityID | null = null;
    if (parentId !== undefined) {
      if (parentId) {
        parentIdEntity = new UniqueEntityID(parentId);

        // Não pode ser pai de si mesmo
        if (parentIdEntity.equals(id)) {
          throw new BadRequestError('Group cannot be its own parent');
        }

        const parent =
          await this.permissionGroupsRepository.findById(parentIdEntity);

        if (!parent) {
          throw new ResourceNotFoundError('Parent group not found');
        }

        if (!parent.isActive || parent.deletedAt) {
          throw new BadRequestError('Parent group must be active');
        }

        // Evitar loop circular: verificar se o novo pai é descendente do grupo atual
        const descendants = await this.getAllDescendants(id);
        if (
          descendants.some((descendant) =>
            descendant.id.equals(parentIdEntity!),
          )
        ) {
          throw new BadRequestError(
            'Cannot create circular reference in group hierarchy',
          );
        }
      }
    }

    const updated = await this.permissionGroupsRepository.update({
      id,
      name,
      slug: newSlug,
      description,
      color,
      priority,
      parentId: parentId !== undefined ? (parentIdEntity ?? null) : undefined,
      isActive,
    });

    if (!updated) {
      throw new ResourceNotFoundError('Permission group not found');
    }

    return {
      group: updated,
    };
  }

  private async getAllDescendants(
    groupId: UniqueEntityID,
  ): Promise<PermissionGroup[]> {
    const descendants: PermissionGroup[] = [];
    const children =
      await this.permissionGroupsRepository.findChildren(groupId);

    for (const child of children) {
      descendants.push(child);
      const childDescendants = await this.getAllDescendants(child.id);
      descendants.push(...childDescendants);
    }

    return descendants;
  }
}
