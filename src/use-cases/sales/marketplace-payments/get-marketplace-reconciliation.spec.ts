import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MarketplacePayment } from '@/entities/sales/marketplace-payment';
import { InMemoryMarketplaceConnectionsRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-connections-repository';
import { InMemoryMarketplacePaymentsRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-payments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetMarketplaceReconciliationUseCase } from './get-marketplace-reconciliation';

let connectionsRepository: InMemoryMarketplaceConnectionsRepository;
let paymentsRepository: InMemoryMarketplacePaymentsRepository;
let sut: GetMarketplaceReconciliationUseCase;

describe('GetMarketplaceReconciliationUseCase', () => {
  beforeEach(() => {
    connectionsRepository = new InMemoryMarketplaceConnectionsRepository();
    paymentsRepository = new InMemoryMarketplacePaymentsRepository();
    sut = new GetMarketplaceReconciliationUseCase(
      connectionsRepository,
      paymentsRepository,
    );
  });

  it('should return reconciliation data for a connection', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'MERCADO_LIVRE',
      name: 'ML Store',
    });

    const connectionId = connection.id.toString();

    paymentsRepository.items.push(
      MarketplacePayment.create({
        tenantId: new UniqueEntityID('tenant-1'),
        connectionId: connection.id,
        type: 'SALE',
        grossAmount: 100,
        feeAmount: 14,
        netAmount: 86,
        currency: 'BRL',
        status: 'SETTLED',
      }),
    );
    paymentsRepository.items.push(
      MarketplacePayment.create({
        tenantId: new UniqueEntityID('tenant-1'),
        connectionId: connection.id,
        type: 'SALE',
        grossAmount: 200,
        feeAmount: 28,
        netAmount: 172,
        currency: 'BRL',
        status: 'PENDING',
      }),
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      connectionId,
    });

    expect(result.connectionName).toBe('ML Store');
    expect(result.marketplace).toBe('MERCADO_LIVRE');
    expect(result.totalGross).toBe(300);
    expect(result.totalFees).toBe(42);
    expect(result.totalNet).toBe(258);
    expect(result.pendingCount).toBe(1);
    expect(result.settledCount).toBe(1);
  });

  it('should throw when connection is not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        connectionId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should return zeroes when no payments exist', async () => {
    const connection = await connectionsRepository.create({
      tenantId: 'tenant-1',
      marketplace: 'SHOPEE',
      name: 'Shopee Store',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id.toString(),
    });

    expect(result.totalGross).toBe(0);
    expect(result.totalFees).toBe(0);
    expect(result.totalNet).toBe(0);
    expect(result.pendingCount).toBe(0);
    expect(result.settledCount).toBe(0);
  });
});
