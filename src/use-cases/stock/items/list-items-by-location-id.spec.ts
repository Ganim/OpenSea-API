import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListItemsByLocationIdUseCase } from './list-items-by-location-id';

let itemsRepository: InMemoryItemsRepository;
let listItemsByLocationId: ListItemsByLocationIdUseCase;

describe('ListItemsByLocationIdUseCase', () => {
  beforeEach(() => {
    itemsRepository = new InMemoryItemsRepository();
    listItemsByLocationId = new ListItemsByLocationIdUseCase(itemsRepository);
  });

  it('should be able to list items by location id', async () => {
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

    const result = await listItemsByLocationId.execute({
      locationId: locationId.toString(),
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].uniqueCode).toBe('ITEM-001');
    expect(result.items[1].uniqueCode).toBe('ITEM-002');
  });

  it('should return empty array when location has no items', async () => {
    const locationId = new UniqueEntityID().toString();

    const result = await listItemsByLocationId.execute({
      locationId,
    });

    expect(result.items).toHaveLength(0);
  });
});
