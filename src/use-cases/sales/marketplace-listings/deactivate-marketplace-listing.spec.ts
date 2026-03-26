import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryMarketplaceListingsRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-listings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeactivateMarketplaceListingUseCase } from './deactivate-marketplace-listing';

let listingsRepository: InMemoryMarketplaceListingsRepository;
let sut: DeactivateMarketplaceListingUseCase;

describe('DeactivateMarketplaceListingUseCase', () => {
  beforeEach(() => {
    listingsRepository = new InMemoryMarketplaceListingsRepository();
    sut = new DeactivateMarketplaceListingUseCase(listingsRepository);
  });

  it('should deactivate a listing', async () => {
    const listing = await listingsRepository.create({
      tenantId: 'tenant-1',
      connectionId: 'conn-1',
      variantId: 'variant-1',
      externalListingId: 'MLB-123',
      status: 'ACTIVE',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: listing.id.toString(),
    });

    expect(result.message).toBe('Listing deactivated successfully.');

    const updated = await listingsRepository.findById(listing.id, 'tenant-1');
    expect(updated?.status).toBe('PAUSED');
  });

  it('should throw when listing is not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
