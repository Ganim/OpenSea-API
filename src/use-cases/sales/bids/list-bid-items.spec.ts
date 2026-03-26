import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BidItem } from '@/entities/sales/bid-item';
import { InMemoryBidItemsRepository } from '@/repositories/sales/in-memory/in-memory-bid-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListBidItemsUseCase } from './list-bid-items';

let bidItemsRepository: InMemoryBidItemsRepository;
let sut: ListBidItemsUseCase;

const TENANT_ID = 'tenant-1';
const BID_ID = 'bid-1';

function createTestBidItem(
  overrides?: Partial<{ bidId: string; status: string }>,
): BidItem {
  return BidItem.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    bidId: new UniqueEntityID(overrides?.bidId ?? BID_ID),
    itemNumber: Math.floor(Math.random() * 1000),
    description: 'Resma de papel A4',
    quantity: 100,
    unit: 'UN',
    estimatedUnitPrice: 25.5,
    status: (overrides?.status as BidItem['status']) ?? undefined,
  });
}

describe('ListBidItemsUseCase', () => {
  beforeEach(() => {
    bidItemsRepository = new InMemoryBidItemsRepository();
    sut = new ListBidItemsUseCase(bidItemsRepository);
  });

  it('should list items for a specific bid', async () => {
    bidItemsRepository.items.push(createTestBidItem());
    bidItemsRepository.items.push(createTestBidItem());
    bidItemsRepository.items.push(createTestBidItem({ bidId: 'bid-other' }));

    const result = await sut.execute({
      tenantId: TENANT_ID,
      bidId: BID_ID,
      page: 1,
      limit: 20,
    });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should paginate bid items', async () => {
    for (let i = 0; i < 5; i++) {
      bidItemsRepository.items.push(createTestBidItem());
    }

    const result = await sut.execute({
      tenantId: TENANT_ID,
      bidId: BID_ID,
      page: 1,
      limit: 2,
    });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(3);
  });

  it('should return empty when no items exist for bid', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      bidId: 'empty-bid',
      page: 1,
      limit: 20,
    });

    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
