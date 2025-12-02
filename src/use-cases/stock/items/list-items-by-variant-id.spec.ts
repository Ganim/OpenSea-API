import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListItemsByVariantIdUseCase } from './list-items-by-variant-id';

let itemsRepository: InMemoryItemsRepository;
let listItemsByVariantId: ListItemsByVariantIdUseCase;

describe('ListItemsByVariantIdUseCase', () => {
  beforeEach(() => {
    itemsRepository = new InMemoryItemsRepository();
    listItemsByVariantId = new ListItemsByVariantIdUseCase(itemsRepository);
  });

  it('should be able to list items by variant id', async () => {
    const variantId = new UniqueEntityID();
    const locationId = new UniqueEntityID();

    await itemsRepository.create({
      uniqueCode: 'ITEM-001',
      variantId,
      locationId,
      initialQuantity: 100,
      currentQuantity: 100,
      status: ItemStatus.create('AVAILABLE'),
    });

    await itemsRepository.create({
      uniqueCode: 'ITEM-002',
      variantId,
      locationId,
      initialQuantity: 50,
      currentQuantity: 50,
      status: ItemStatus.create('AVAILABLE'),
    });

    const result = await listItemsByVariantId.execute({
      variantId: variantId.toString(),
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].uniqueCode).toBe('ITEM-001');
    expect(result.items[1].uniqueCode).toBe('ITEM-002');
  });

  it('should return empty array when variant has no items', async () => {
    const variantId = new UniqueEntityID().toString();

    const result = await listItemsByVariantId.execute({
      variantId,
    });

    expect(result.items).toHaveLength(0);
  });
});
