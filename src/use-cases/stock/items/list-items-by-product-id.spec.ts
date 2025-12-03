import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListItemsByProductIdUseCase } from './list-items-by-product-id';

let itemsRepository: InMemoryItemsRepository;
let listItemsByProductId: ListItemsByProductIdUseCase;

describe('ListItemsByProductIdUseCase', () => {
  beforeEach(() => {
    itemsRepository = new InMemoryItemsRepository();
    listItemsByProductId = new ListItemsByProductIdUseCase(itemsRepository);
  });

  it('should return empty array when product has no items', async () => {
    const productId = new UniqueEntityID().toString();

    const result = await listItemsByProductId.execute({
      productId,
    });

    expect(result.items).toHaveLength(0);
  });
});
