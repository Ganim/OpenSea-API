import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryCustomerPortalAccessesRepository } from '@/repositories/finance/in-memory/in-memory-customer-portal-accesses-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RevokeCustomerPortalAccessUseCase } from './revoke-customer-portal-access';

let repository: InMemoryCustomerPortalAccessesRepository;
let sut: RevokeCustomerPortalAccessUseCase;

describe('RevokeCustomerPortalAccessUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCustomerPortalAccessesRepository();
    sut = new RevokeCustomerPortalAccessUseCase(repository);
  });

  it('should deactivate an existing access', async () => {
    const access = await repository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
      accessToken: 'cpt_token',
    });

    await sut.execute({ tenantId: 'tenant-1', id: access.id });

    const updated = await repository.findById(access.id, 'tenant-1');
    expect(updated?.isActive).toBe(false);
  });

  it('should throw when access does not exist', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', id: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
