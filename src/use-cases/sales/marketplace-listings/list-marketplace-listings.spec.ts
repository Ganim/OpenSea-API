import { InMemoryMarketplaceListingsRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-listings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListMarketplaceListingsUseCase } from './list-marketplace-listings';

let listingsRepository: InMemoryMarketplaceListingsRepository;
let sut: ListMarketplaceListingsUseCase;

describe('ListMarketplaceListingsUseCase', () => {
  beforeEach(() => {
    listingsRepository = new InMemoryMarketplaceListingsRepository();
    sut = new ListMarketplaceListingsUseCase(listingsRepository);
  });

  it('should list listings for a connection', async () => {
    await listingsRepository.create({
      tenantId: 'tenant-1',
      connectionId: 'conn-1',
      variantId: 'variant-1',
      externalListingId: 'MLB-001',
      status: 'ACTIVE',
    });
    await listingsRepository.create({
      tenantId: 'tenant-1',
      connectionId: 'conn-1',
      variantId: 'variant-2',
      externalListingId: 'MLB-002',
      status: 'ACTIVE',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      connectionId: 'conn-1',
    });

    expect(result.listings).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(1);
  });

  it('should paginate listings', async () => {
    for (let i = 0; i < 5; i++) {
      await listingsRepository.create({
        tenantId: 'tenant-1',
        connectionId: 'conn-1',
        variantId: `variant-${i}`,
        externalListingId: `MLB-${i}`,
        status: 'ACTIVE',
      });
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      connectionId: 'conn-1',
      page: 1,
      perPage: 2,
    });

    expect(result.listings).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(3);
  });

  it('should not return listings from other connections', async () => {
    await listingsRepository.create({
      tenantId: 'tenant-1',
      connectionId: 'conn-1',
      variantId: 'variant-1',
      externalListingId: 'MLB-100',
      status: 'ACTIVE',
    });
    await listingsRepository.create({
      tenantId: 'tenant-1',
      connectionId: 'conn-2',
      variantId: 'variant-2',
      externalListingId: 'MLB-200',
      status: 'ACTIVE',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      connectionId: 'conn-1',
    });

    expect(result.listings).toHaveLength(1);
  });
});
