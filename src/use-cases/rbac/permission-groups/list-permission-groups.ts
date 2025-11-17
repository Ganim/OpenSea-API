import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionGroup } from '@/entities/rbac/permission-group';
import { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';

interface ListPermissionGroupsRequest {
  isActive?: boolean;
  isSystem?: boolean;
  parentId?: string | null;
}

interface ListPermissionGroupsResponse {
  groups: PermissionGroup[];
}

export class ListPermissionGroupsUseCase {
  constructor(private permissionGroupsRepository: PermissionGroupsRepository) {}

  async execute({
    isActive,
    isSystem,
    parentId,
  }: ListPermissionGroupsRequest): Promise<ListPermissionGroupsResponse> {
    let groups: PermissionGroup[];

    // Listar grupos de sistema
    if (isSystem === true) {
      groups = await this.permissionGroupsRepository.listSystemGroups();
    }
    // Listar por pai específico
    else if (parentId) {
      const parentIdEntity = new UniqueEntityID(parentId);
      groups =
        await this.permissionGroupsRepository.listByParentId(parentIdEntity);
    }
    // Listar todos
    else {
      groups = await this.permissionGroupsRepository.listAll();
    }

    // Filtrar por isActive e isSystem=false se fornecidos
    if (isActive !== undefined) {
      groups = groups.filter((group) => group.isActive === isActive);
    }

    if (isSystem === false) {
      groups = groups.filter((group) => !group.isSystem);
    }

    return { groups };
  }
}
