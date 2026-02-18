import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { User } from '@/entities/core/user';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Permission } from '@/entities/rbac/permission';
import { PermissionGroup } from '@/entities/rbac/permission-group';
import { UsersRepository } from '@/repositories/core/users-repository';
import { PermissionGroupPermissionsRepository } from '@/repositories/rbac/permission-group-permissions-repository';
import { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';
import { UserPermissionGroupsRepository } from '@/repositories/rbac/user-permission-groups-repository';

interface GetPermissionGroupByIdRequest {
  id: string;
  tenantId?: string;
}

export interface UserWithAssignment {
  user: User;
  assignedAt: Date;
  expiresAt: Date | null;
}

interface GetPermissionGroupByIdResponse {
  group: PermissionGroup;
  users: UserWithAssignment[];
  permissions: Array<{
    permission: Permission;
    effect: string;
    conditions: Record<string, unknown> | null;
  }>;
}

export class GetPermissionGroupByIdUseCase {
  constructor(
    private permissionGroupsRepository: PermissionGroupsRepository,
    private userPermissionGroupsRepository: UserPermissionGroupsRepository,
    private permissionGroupPermissionsRepository: PermissionGroupPermissionsRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    id,
    tenantId,
  }: GetPermissionGroupByIdRequest): Promise<GetPermissionGroupByIdResponse> {
    const group = await this.permissionGroupsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!group) {
      throw new ResourceNotFoundError('Permission group not found');
    }

    // If tenantId is provided, verify the group belongs to the tenant or is a system/global group
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

    // Buscar usuários do grupo com metadados de atribuição
    const assignments = await this.userPermissionGroupsRepository.listByGroupId(
      group.id,
    );
    const userIds = assignments.map((a) => a.userId);
    const users = await this.usersRepository.findManyByIds(userIds);

    const assignmentMap = new Map(
      assignments.map((a) => [a.userId.toString(), a]),
    );

    const usersWithAssignment: UserWithAssignment[] = users.map((user) => {
      const assignment = assignmentMap.get(user.id.toString());
      return {
        user,
        assignedAt: assignment?.createdAt ?? new Date(),
        expiresAt: assignment?.expiresAt ?? null,
      };
    });

    // Buscar permissões do grupo com efeitos
    const groupPermissions =
      await this.permissionGroupPermissionsRepository.listPermissionsWithEffects(
        group.id,
      );

    return {
      group,
      users: usersWithAssignment,
      permissions: groupPermissions,
    };
  }
}
