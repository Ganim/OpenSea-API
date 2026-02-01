import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TenantUsersRepository } from '@/repositories/core/tenant-users-repository';

interface RemoveUserFromTenantUseCaseRequest {
  tenantId: string;
  userId: string;
}

export class RemoveUserFromTenantUseCase {
  constructor(private tenantUsersRepository: TenantUsersRepository) {}

  async execute({
    tenantId,
    userId,
  }: RemoveUserFromTenantUseCaseRequest): Promise<void> {
    const membership = await this.tenantUsersRepository.findByTenantAndUser(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(userId),
    );

    if (!membership) {
      throw new ResourceNotFoundError('User is not a member of this tenant');
    }

    if (membership.role === 'owner') {
      throw new BadRequestError('Cannot remove the owner of a tenant');
    }

    await this.tenantUsersRepository.delete(
      new UniqueEntityID(tenantId),
      new UniqueEntityID(userId),
    );
  }
}
