import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CentralUser } from '@/entities/core/central-user';
import type { CentralUsersRepository } from '@/repositories/core/central-users-repository';
import { ELEVATED_ROLES, isValidCentralUserRole } from './central-user-roles';

interface UpdateCentralUserRoleUseCaseRequest {
  userId: string;
  newRole: string;
  updatedBy: string;
}

interface UpdateCentralUserRoleUseCaseResponse {
  centralUser: CentralUser;
}

export class UpdateCentralUserRoleUseCase {
  constructor(private centralUsersRepository: CentralUsersRepository) {}

  async execute({
    userId,
    newRole,
    updatedBy,
  }: UpdateCentralUserRoleUseCaseRequest): Promise<UpdateCentralUserRoleUseCaseResponse> {
    if (!isValidCentralUserRole(newRole)) {
      throw new BadRequestError(
        `Invalid role "${newRole}". Valid roles are: OWNER, ADMIN, SUPPORT, FINANCE, VIEWER`,
      );
    }

    const centralUser = await this.centralUsersRepository.findByUserId(userId);

    if (!centralUser) {
      throw new ResourceNotFoundError('Central user not found');
    }

    // Only OWNER can promote to OWNER or ADMIN
    if (ELEVATED_ROLES.includes(newRole as (typeof ELEVATED_ROLES)[number])) {
      const updater = await this.centralUsersRepository.findByUserId(updatedBy);

      if (!updater || updater.role !== 'OWNER') {
        throw new ForbiddenError(
          'Only an OWNER can promote users to OWNER or ADMIN roles',
        );
      }
    }

    // Cannot demote yourself if you're the last OWNER
    if (
      userId === updatedBy &&
      centralUser.role === 'OWNER' &&
      newRole !== 'OWNER'
    ) {
      const allOwners = await this.centralUsersRepository.findByRole('OWNER');

      if (allOwners.length <= 1) {
        throw new BadRequestError(
          'Cannot demote yourself — you are the last OWNER',
        );
      }
    }

    centralUser.role = newRole;
    await this.centralUsersRepository.save(centralUser);

    return { centralUser };
  }
}
