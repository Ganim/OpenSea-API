import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryTenantUsersRepository } from '@/repositories/core/in-memory/in-memory-tenant-users-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RemoveUserFromTenantUseCase } from './remove-user-from-tenant';

let tenantUsersRepository: InMemoryTenantUsersRepository;
let sut: RemoveUserFromTenantUseCase;

describe('RemoveUserFromTenantUseCase', () => {
  beforeEach(() => {
    tenantUsersRepository = new InMemoryTenantUsersRepository();
    sut = new RemoveUserFromTenantUseCase(tenantUsersRepository);
  });

  it('should remove a member from a tenant', async () => {
    const tenantId = new UniqueEntityID();
    const userId = new UniqueEntityID();
    await tenantUsersRepository.create({ tenantId, userId, role: 'member' });
    await sut.execute({
      tenantId: tenantId.toString(),
      userId: userId.toString(),
    });
    const membership = await tenantUsersRepository.findByTenantAndUser(
      tenantId,
      userId,
    );
    expect(membership).toBeNull();
  });

  it('should throw ResourceNotFoundError when not a member', async () => {
    await expect(() =>
      sut.execute({ tenantId: 't1', userId: 'u1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError when removing owner', async () => {
    const tenantId = new UniqueEntityID();
    const ownerId = new UniqueEntityID();
    await tenantUsersRepository.create({
      tenantId,
      userId: ownerId,
      role: 'owner',
    });
    await expect(() =>
      sut.execute({
        tenantId: tenantId.toString(),
        userId: ownerId.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
