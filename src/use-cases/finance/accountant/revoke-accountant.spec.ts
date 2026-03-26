import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryAccountantAccessesRepository } from '@/repositories/finance/in-memory/in-memory-accountant-accesses-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RevokeAccountantUseCase } from './revoke-accountant';

let repository: InMemoryAccountantAccessesRepository;
let sut: RevokeAccountantUseCase;

describe('RevokeAccountantUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryAccountantAccessesRepository();
    sut = new RevokeAccountantUseCase(repository);
  });

  it('should deactivate an existing accountant access', async () => {
    const access = await repository.create({
      tenantId: 'tenant-1',
      email: 'contador@teste.com',
      name: 'João Contador',
      accessToken: 'acc_test123',
    });

    await sut.execute({ tenantId: 'tenant-1', id: access.id });

    const updated = await repository.findById(access.id, 'tenant-1');
    expect(updated?.isActive).toBe(false);
  });

  it('should throw ResourceNotFoundError for non-existent access', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', id: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
