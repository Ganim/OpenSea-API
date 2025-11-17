import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionGroup } from '@/entities/rbac/permission-group';
import { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';

interface GetPermissionGroupByIdRequest {
  id: string;
}

interface GetPermissionGroupByIdResponse {
  group: PermissionGroup;
}

export class GetPermissionGroupByIdUseCase {
  constructor(private permissionGroupsRepository: PermissionGroupsRepository) {}

  async execute({
    id,
  }: GetPermissionGroupByIdRequest): Promise<GetPermissionGroupByIdResponse> {
    const group = await this.permissionGroupsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!group) {
      throw new ResourceNotFoundError('Permission group not found');
    }

    return { group };
  }
}
