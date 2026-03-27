import { InMemoryCustomerPortalAccessesRepository } from '@/repositories/finance/in-memory/in-memory-customer-portal-accesses-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListCustomerPortalAccessesUseCase } from './list-customer-portal-accesses';

let repository: InMemoryCustomerPortalAccessesRepository;
let sut: ListCustomerPortalAccessesUseCase;

describe('ListCustomerPortalAccessesUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCustomerPortalAccessesRepository();
    sut = new ListCustomerPortalAccessesUseCase(repository);
  });

  it('should list all accesses for a tenant', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      customerName: 'Acme Corporation',
      accessToken: 'cpt_a',
    });

    await repository.create({
      tenantId: 'tenant-1',
      customerId: 'customer-2',
      customerName: 'Beta Inc',
      accessToken: 'cpt_b',
    });

    await repository.create({
      tenantId: 'tenant-2',
      customerId: 'customer-3',
      customerName: 'Gamma Ltd',
      accessToken: 'cpt_c',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.accesses).toHaveLength(2);
    expect(result.accesses[0].customerId).toBeDefined();
  });

  it('should return empty array when no accesses exist', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });
    expect(result.accesses).toHaveLength(0);
  });
});
