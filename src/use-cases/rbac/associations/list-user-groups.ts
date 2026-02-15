import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionGroup } from '@/entities/rbac/permission-group';
import { UsersRepository } from '@/repositories/core/users-repository';
import { UserPermissionGroupsRepository } from '@/repositories/rbac/user-permission-groups-repository';

interface ListUserGroupsRequest {
  userId: string;
  includeExpired?: boolean;
  includeInactive?: boolean;
  tenantId?: string;
}

interface ListUserGroupsResponse {
  groups: PermissionGroup[];
}

export class ListUserGroupsUseCase {
  constructor(
    private userPermissionGroupsRepository: UserPermissionGroupsRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    userId,
    includeExpired = false,
    includeInactive = false,
    tenantId,
  }: ListUserGroupsRequest): Promise<ListUserGroupsResponse> {
    const userIdEntity = new UniqueEntityID(userId);

    // Verificar se o usuário existe
    const user = await this.usersRepository.findById(userIdEntity);

    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    // Buscar grupos do usuário
    let groups = await this.userPermissionGroupsRepository.listGroupsByUserId(
      userIdEntity,
      {
        includeExpired,
        includeInactive,
      },
    );

    // Filter groups by tenant - only show groups that belong to user's tenant
    if (tenantId) {
      const tenantIdEntity = new UniqueEntityID(tenantId);
      groups = groups.filter(
        (group) => group.tenantId && group.tenantId.equals(tenantIdEntity),
      );
    }

    return { groups };
  }
}
