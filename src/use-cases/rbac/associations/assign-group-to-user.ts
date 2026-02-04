import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UserPermissionGroup } from '@/entities/rbac/user-permission-group';
import type { UsersRepository } from '@/repositories/core/users-repository';
import type { PermissionGroupsRepository } from '@/repositories/rbac/permission-groups-repository';
import type { UserPermissionGroupsRepository } from '@/repositories/rbac/user-permission-groups-repository';

interface AssignGroupToUserRequest {
  userId: string;
  groupId: string;
  expiresAt?: Date | null;
  grantedBy?: string | null;
  tenantId?: string;
}

interface AssignGroupToUserResponse {
  userGroup: UserPermissionGroup;
}

export class AssignGroupToUserUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private permissionGroupsRepository: PermissionGroupsRepository,
    private userPermissionGroupsRepository: UserPermissionGroupsRepository,
  ) {}

  async execute(
    request: AssignGroupToUserRequest,
  ): Promise<AssignGroupToUserResponse> {
    const {
      userId,
      groupId,
      expiresAt = null,
      grantedBy = null,
      tenantId,
    } = request;

    // Validar usuário existe
    const userIdEntity = new UniqueEntityID(userId);
    const user = await this.usersRepository.findById(userIdEntity);

    if (!user) {
      throw new ResourceNotFoundError('User not found');
    }

    if (user.isBlocked) {
      throw new BadRequestError('Cannot assign group to blocked user');
    }

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

    // Verificar se já existe
    const exists = await this.userPermissionGroupsRepository.exists(
      userIdEntity,
      groupIdEntity,
    );

    if (exists) {
      throw new BadRequestError('User already has this group assigned');
    }

    // Validar data de expiração
    if (expiresAt && expiresAt < new Date()) {
      throw new BadRequestError('Expiration date must be in the future');
    }

    // Validar grantedBy se fornecido
    let grantedByEntity: UniqueEntityID | null = null;

    if (grantedBy) {
      grantedByEntity = new UniqueEntityID(grantedBy);
      const granterUser = await this.usersRepository.findById(grantedByEntity);

      if (!granterUser) {
        throw new ResourceNotFoundError('Granter user not found');
      }
    }

    // Atribuir grupo ao usuário
    const userGroup = await this.userPermissionGroupsRepository.assign({
      userId: userIdEntity,
      groupId: groupIdEntity,
      expiresAt,
      grantedBy: grantedByEntity,
    });

    return {
      userGroup,
    };
  }
}
