import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { Password } from '@/entities/core/value-objects/password';
import { Pin } from '@/entities/core/value-objects/pin';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UserDTO, userToDTO } from '@/mappers/core/user/user-to-dto';
import type { UsersRepository } from '@/repositories/core/users-repository';

interface SetAccessPinUseCaseRequest {
  userId: string;
  currentPassword?: string;
  newAccessPin: string;
}

interface SetAccessPinUseCaseResponse {
  user: UserDTO;
}

export class SetAccessPinUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
    currentPassword,
    newAccessPin,
  }: SetAccessPinUseCaseRequest): Promise<SetAccessPinUseCaseResponse> {
    const validId = new UniqueEntityID(userId);
    const existingUser = await this.usersRepository.findById(validId);

    if (!existingUser || existingUser.deletedAt) {
      throw new ResourceNotFoundError('User not found');
    }

    // Skip password verification during forced first-time setup
    // (user already authenticated via login to reach this point)
    const isFirstTimeSetup = existingUser.forceAccessPinSetup;

    if (!isFirstTimeSetup) {
      if (!currentPassword) {
        throw new BadRequestError('Password is required');
      }

      const doesPasswordMatch = await Password.compare(
        currentPassword,
        existingUser.password.toString(),
      );

      if (!doesPasswordMatch) {
        throw new BadRequestError('Invalid password');
      }
    }

    const pin = await Pin.create(newAccessPin, 'access');

    const updatedUser = await this.usersRepository.update({
      id: existingUser.id,
      accessPinHash: pin,
      forceAccessPinSetup: false,
    });

    if (!updatedUser) {
      throw new BadRequestError('Failed to set access PIN');
    }

    return { user: userToDTO(updatedUser) };
  }
}
