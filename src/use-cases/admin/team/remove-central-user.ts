import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { CentralUsersRepository } from '@/repositories/core/central-users-repository';

interface RemoveCentralUserUseCaseRequest {
  userId: string;
}

interface RemoveCentralUserUseCaseResponse {
  success: boolean;
}

export class RemoveCentralUserUseCase {
  constructor(private centralUsersRepository: CentralUsersRepository) {}

  async execute({
    userId,
  }: RemoveCentralUserUseCaseRequest): Promise<RemoveCentralUserUseCaseResponse> {
    const centralUser = await this.centralUsersRepository.findByUserId(userId);

    if (!centralUser) {
      throw new ResourceNotFoundError('Central user not found');
    }

    // Cannot remove the last OWNER
    if (centralUser.role === 'OWNER') {
      const allOwners = await this.centralUsersRepository.findByRole('OWNER');

      if (allOwners.length <= 1) {
        throw new BadRequestError(
          'Cannot remove the last OWNER from the Central team',
        );
      }
    }

    await this.centralUsersRepository.delete(centralUser.id.toString());

    return { success: true };
  }
}
