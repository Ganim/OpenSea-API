import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { CentralUser } from '@/entities/core/central-user';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CentralUsersRepository } from '@/repositories/core/central-users-repository';
import type { UsersRepository } from '@/repositories/core/users-repository';
import { isValidCentralUserRole } from './central-user-roles';

interface InviteCentralUserUseCaseRequest {
  userId: string;
  role: string;
  invitedBy: string;
}

interface InviteCentralUserUseCaseResponse {
  centralUser: CentralUser;
}

export class InviteCentralUserUseCase {
  constructor(
    private centralUsersRepository: CentralUsersRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute({
    userId,
    role,
    invitedBy,
  }: InviteCentralUserUseCaseRequest): Promise<InviteCentralUserUseCaseResponse> {
    if (!isValidCentralUserRole(role)) {
      throw new BadRequestError(
        `Invalid role "${role}". Valid roles are: OWNER, ADMIN, SUPPORT, FINANCE, VIEWER`,
      );
    }

    const userExists = await this.usersRepository.findById(
      new UniqueEntityID(userId),
    );

    if (!userExists) {
      throw new ResourceNotFoundError('User not found');
    }

    const existingCentralUser =
      await this.centralUsersRepository.findByUserId(userId);

    if (existingCentralUser) {
      throw new ConflictError('User is already a Central team member');
    }

    const centralUser = CentralUser.create({
      userId,
      role,
      invitedBy,
      isActive: true,
    });

    await this.centralUsersRepository.create(centralUser);

    return { centralUser };
  }
}
