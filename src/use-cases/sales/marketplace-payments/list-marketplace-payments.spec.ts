import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MarketplacePayment } from '@/entities/sales/marketplace-payment';
import { InMemoryMarketplacePaymentsRepository } from '@/repositories/sales/in-memory/in-memory-marketplace-payments-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListMarketplacePaymentsUseCase } from './list-marketplace-payments';

let paymentsRepository: InMemoryMarketplacePaymentsRepository;
let sut: ListMarketplacePaymentsUseCase;

function createTestPayment(
  overrides?: Partial<{ connectionId: string; tenantId: string }>,
): MarketplacePayment {
  return MarketplacePayment.create({
    tenantId: new UniqueEntityID(overrides?.tenantId ?? 'tenant-1'),
    connectionId: new UniqueEntityID(overrides?.connectionId ?? 'conn-1'),
    type: 'SALE',
    grossAmount: 100,
    feeAmount: 14,
    netAmount: 86,
    currency: 'BRL',
    status: 'PENDING',
  });
}

describe('ListMarketplacePaymentsUseCase', () => {
  beforeEach(() => {
    paymentsRepository = new InMemoryMarketplacePaymentsRepository();
    sut = new ListMarketplacePaymentsUseCase(paymentsRepository);
  });

  it('should list payments for a tenant', async () => {
    paymentsRepository.items.push(createTestPayment());
    paymentsRepository.items.push(createTestPayment());

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.payments).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter payments by connection', async () => {
    paymentsRepository.items.push(
      createTestPayment({ connectionId: 'conn-1' }),
    );
    paymentsRepository.items.push(
      createTestPayment({ connectionId: 'conn-2' }),
    );

    const result = await sut.execute({
      tenantId: 'tenant-1',
      connectionId: 'conn-1',
    });

    expect(result.payments).toHaveLength(1);
  });

  it('should paginate payments', async () => {
    for (let i = 0; i < 5; i++) {
      paymentsRepository.items.push(createTestPayment());
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 2,
    });

    expect(result.payments).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(3);
  });
});
