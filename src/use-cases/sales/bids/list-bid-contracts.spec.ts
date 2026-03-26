import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BidContract } from '@/entities/sales/bid-contract';
import { InMemoryBidContractsRepository } from '@/repositories/sales/in-memory/in-memory-bid-contracts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListBidContractsUseCase } from './list-bid-contracts';

let bidContractsRepository: InMemoryBidContractsRepository;
let sut: ListBidContractsUseCase;

const TENANT_ID = 'tenant-1';

function createTestContract(
  overrides?: Partial<{ bidId: string; status: string }>,
): BidContract {
  return BidContract.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    bidId: new UniqueEntityID(overrides?.bidId ?? 'bid-1'),
    contractNumber: `CT-${Math.random().toString(36).substring(7)}/2026`,
    startDate: new Date('2026-05-01'),
    endDate: new Date('2027-05-01'),
    totalValue: 500000,
    remainingValue: 500000,
    customerId: new UniqueEntityID('customer-1'),
    status: (overrides?.status as BidContract['status']) ?? undefined,
  });
}

describe('ListBidContractsUseCase', () => {
  beforeEach(() => {
    bidContractsRepository = new InMemoryBidContractsRepository();
    sut = new ListBidContractsUseCase(bidContractsRepository);
  });

  it('should list contracts with pagination', async () => {
    for (let i = 0; i < 5; i++) {
      bidContractsRepository.items.push(createTestContract());
    }

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 2,
    });

    expect(result.contracts).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(3);
  });

  it('should filter contracts by bid ID', async () => {
    bidContractsRepository.items.push(createTestContract({ bidId: 'bid-1' }));
    bidContractsRepository.items.push(createTestContract({ bidId: 'bid-2' }));
    bidContractsRepository.items.push(createTestContract({ bidId: 'bid-1' }));

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      bidId: 'bid-1',
    });

    expect(result.contracts).toHaveLength(2);
  });

  it('should return empty when no contracts exist', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
    });

    expect(result.contracts).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
