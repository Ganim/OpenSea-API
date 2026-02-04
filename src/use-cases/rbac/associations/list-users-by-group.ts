import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';
import { UserPermissionGroupsRepository } from '@/repositories/rbac/user-permission-groups-repository';

interface ListUsersByGroupRequest {
  groupId: string;
  includeExpired?: boolean;
  tenantId?: string;
}

interface ListUsersByGroupResponse {
  userIds: string[];
}

export class ListUsersByGroupUseCase {
  constructor(
    private userPermissionGroupsRepository: UserPermissionGroupsRepository,
    private permissionGroupsRepository: PermissionGroupsRepository,
  ) {}

  async execute({
    groupId,
    includeExpired = false,
    tenantId,
  }: ListUsersByGroupRequest): Promise<ListUsersByGroupResponse> {
    const groupIdEntity = new UniqueEntityID(groupId);

    // Verificar se o grupo existe
    const group = await this.permissionGroupsRepository.findById(groupIdEntity);

    if (!group) {
      throw new ResourceNotFoundError('Permission group not found');
    }

    // Verify tenant access - group must belong to user's tenant or be a global group
    if (tenantId && group.tenantId) {
      const tenantIdEntity = new UniqueEntityID(tenantId);
      if (!group.tenantId.equals(tenantIdEntity)) {
        throw new ResourceNotFoundError('Permission group not found');
      }
    }

    // Buscar assignments do grupo
    const assignments = includeExpired
      ? await this.userPermissionGroupsRepository.listByGroupIdIncludingExpired(
          groupIdEntity,
        )
      : await this.userPermissionGroupsRepository.listByGroupId(groupIdEntity);

    // Extrair IDs únicos dos usuários
    const userIds = [
      ...new Set(assignments.map((assignment) => assignment.userId.toString())),
    ];

    return { userIds };
  }
}
