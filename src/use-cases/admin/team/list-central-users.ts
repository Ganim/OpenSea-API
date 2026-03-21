import type { CentralUser } from '@/entities/core/central-user';
import type { CentralUsersRepository } from '@/repositories/core/central-users-repository';

interface ListCentralUsersUseCaseRequest {
  role?: string;
}

interface ListCentralUsersUseCaseResponse {
  users: CentralUser[];
}

export class ListCentralUsersUseCase {
  constructor(private centralUsersRepository: CentralUsersRepository) {}

  async execute({
    role,
  }: ListCentralUsersUseCaseRequest): Promise<ListCentralUsersUseCaseResponse> {
    const centralUsers = role
      ? await this.centralUsersRepository.findByRole(role)
      : await this.centralUsersRepository.findAll();

    return { users: centralUsers };
  }
}
