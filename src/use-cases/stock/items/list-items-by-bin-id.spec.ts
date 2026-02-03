import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListItemsByBinIdUseCase } from './list-items-by-bin-id';

let itemsRepository: InMemoryItemsRepository;
let sut: ListItemsByBinIdUseCase;

describe('ListItemsByBinIdUseCase', () => {
  beforeEach(() => {
    itemsRepository = new InMemoryItemsRepository();
    sut = new ListItemsByBinIdUseCase(itemsRepository);
  });

  it('should return empty list when no items exist in the bin', async () => {
    const { items } = await sut.execute({
      tenantId: 'tenant-1',
      binId: 'empty-bin',
    });
    expect(items).toHaveLength(0);
  });
});
