import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UserDTO, userToDTO } from '@/mappers/core/user/user-to-dto';
import type { UsersRepository } from '@/repositories/core/users-repository';

interface ListAllUserUseCaseRequest {
  tenantId?: string;
}

interface ListAllUserUseCaseResponse {
  users: UserDTO[];
}

export class ListAllUserUseCase {
  constructor(private userRespository: UsersRepository) {}

  async execute(
    request?: ListAllUserUseCaseRequest,
  ): Promise<ListAllUserUseCaseResponse> {
    let existingUsers;

    // If tenantId is provided, filter by tenant
    if (request?.tenantId) {
      const tenantIdEntity = new UniqueEntityID(request.tenantId);
      existingUsers = await this.userRespository.listByTenantId(tenantIdEntity);
    } else {
      // Fallback to listAll (for super admins or system operations)
      existingUsers = await this.userRespository.listAll();
    }

    if (!existingUsers || existingUsers.length === 0) {
      throw new ResourceNotFoundError('No users found.');
    }

    const users = existingUsers
      .filter((user) => !user.deletedAt)
      .map((user) => userToDTO(user));

    return { users };
  }
}
