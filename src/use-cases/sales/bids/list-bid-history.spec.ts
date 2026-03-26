import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BidHistory } from '@/entities/sales/bid-history';
import { InMemoryBidHistoryRepository } from '@/repositories/sales/in-memory/in-memory-bid-history-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListBidHistoryUseCase } from './list-bid-history';

let bidHistoryRepository: InMemoryBidHistoryRepository;
let sut: ListBidHistoryUseCase;

const TENANT_ID = 'tenant-1';
const BID_ID = 'bid-1';

function createTestHistory(overrides?: Partial<{ bidId: string }>): BidHistory {
  return BidHistory.create({
    bidId: new UniqueEntityID(overrides?.bidId ?? BID_ID),
    tenantId: new UniqueEntityID(TENANT_ID),
    action: 'BID_CREATED',
    description: 'Licitacao cadastrada',
  });
}

describe('ListBidHistoryUseCase', () => {
  beforeEach(() => {
    bidHistoryRepository = new InMemoryBidHistoryRepository();
    sut = new ListBidHistoryUseCase(bidHistoryRepository);
  });

  it('should list history for a specific bid', async () => {
    bidHistoryRepository.items.push(createTestHistory());
    bidHistoryRepository.items.push(createTestHistory());
    bidHistoryRepository.items.push(createTestHistory({ bidId: 'bid-other' }));

    const result = await sut.execute({
      tenantId: TENANT_ID,
      bidId: BID_ID,
      page: 1,
      limit: 20,
    });

    expect(result.history).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should paginate history entries', async () => {
    for (let i = 0; i < 5; i++) {
      bidHistoryRepository.items.push(createTestHistory());
    }

    const result = await sut.execute({
      tenantId: TENANT_ID,
      bidId: BID_ID,
      page: 1,
      limit: 2,
    });

    expect(result.history).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(3);
  });

  it('should return empty when no history exists', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      bidId: 'empty-bid',
      page: 1,
      limit: 20,
    });

    expect(result.history).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
