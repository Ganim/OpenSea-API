import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { Pin } from '@/entities/core/value-objects/pin';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { UsersRepository } from '@/repositories/core/users-repository';

interface VerifyActionPinUseCaseRequest {
  userId: string;
  actionPin: string;
}

interface VerifyActionPinUseCaseResponse {
  valid: boolean;
}

export class VerifyActionPinUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    userId,
    actionPin,
  }: VerifyActionPinUseCaseRequest): Promise<VerifyActionPinUseCaseResponse> {
    const validId = new UniqueEntityID(userId);
    const existingUser = await this.usersRepository.findById(validId);

    if (!existingUser || existingUser.deletedAt) {
      throw new ResourceNotFoundError('User not found');
    }

    if (!existingUser.actionPin) {
      throw new BadRequestError('Action PIN not configured');
    }

    const valid = await Pin.compare(actionPin, existingUser.actionPin.value);

    return { valid };
  }
}
