import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UserDTO, userToDTO } from '@/mappers/core/user/user-to-dto';
import type { UsersRepository } from '@/repositories/core/users-repository';

interface ForceAccessPinResetRequest {
  targetUserId: string;
  requestedByUserId: string;
}

interface ForceAccessPinResetResponse {
  user: UserDTO;
  message: string;
}

export class ForceAccessPinResetUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    targetUserId,
    requestedByUserId,
  }: ForceAccessPinResetRequest): Promise<ForceAccessPinResetResponse> {
    const targetId = new UniqueEntityID(targetUserId);
    const requestedById = new UniqueEntityID(requestedByUserId);

    const targetUser = await this.usersRepository.findById(targetId);
    if (!targetUser || targetUser.deletedAt) {
      throw new ResourceNotFoundError('User not found');
    }

    const requester = await this.usersRepository.findById(requestedById);
    if (!requester) {
      throw new BadRequestError('Invalid requester');
    }

    const updatedUser =
      await this.usersRepository.setForceAccessPinSetup(targetId);

    if (!updatedUser) {
      throw new BadRequestError('Failed to force access PIN reset');
    }

    return {
      user: userToDTO(updatedUser),
      message: 'Forced access PIN reset set successfully.',
    };
  }
}
