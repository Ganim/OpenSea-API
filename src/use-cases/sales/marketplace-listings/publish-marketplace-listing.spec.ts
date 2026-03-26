import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryMarketplaceConnectionsRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-connections-repository';
import { InMemoryMarketplaceListingsRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-listings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { PublishMarketplaceListingUseCase } from './publish-marketplace-listing';

let connectionsRepository: InMemoryMarketplaceConnectionsRepository;
let listingsRepository: InMemoryMarketplaceListingsRepository;
let sut: PublishMarketplaceListingUseCase;

describe('PublishMarketplaceListingUseCase', () => {
  beforeEach(() => {
    connectionsRepository = new InMemoryMarketplaceConnectionsRepository();
    listingsRepository = new InMemoryMarketplaceListingsRepository();
    sut = new PublishMarketplaceListingUseCase(
      connectionsRepository,
      listingsRepository,
    );
  });

  it('should publish a listing successfully', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
      commissionPercent: 14,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      variantId: 'variant-1',
      externalListingId: 'MLB-123456',
      publishedPrice: 99.9,
      publishedStock: 50,
    });

    expect(result.listing).toBeDefined();
    expect(result.listing.externalListingId).toBe('MLB-123456');
    expect(result.listing.status).toBe('PENDING');
    expect(result.listing.publishedPrice).toBe(99.9);
    expect(listingsRepository.items).toHaveLength(1);
  });

  it('should calculate commission when price and commission percent are set', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
      commissionPercent: 10,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      variantId: 'variant-1',
      externalListingId: 'MLB-789',
      publishedPrice: 200,
    });

    expect(result.listing.commissionAmount).toBe(20);
    expect(result.listing.netPrice).toBe(180);
  });

  it('should throw when connection is not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        connectionId: 'non-existent',
        variantId: 'variant-1',
        externalListingId: 'MLB-999',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when connection is not active', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'SHOPEE',
      name: 'Shopee',
      status: 'PAUSED',
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        connectionId: connection.id.toString(),
        variantId: 'variant-1',
        externalListingId: 'SHOPEE-123',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when external listing ID is empty', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'AMAZON',
      name: 'Amazon',
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        connectionId: connection.id.toString(),
        variantId: 'variant-1',
        externalListingId: '   ',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when duplicate external listing ID exists', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
      variantId: 'variant-1',
      externalListingId: 'MLB-DUP',
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        connectionId: connection.id.toString(),
        variantId: 'variant-2',
        externalListingId: 'MLB-DUP',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
