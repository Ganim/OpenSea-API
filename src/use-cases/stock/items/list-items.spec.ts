import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListItemsUseCase } from './list-items';

let itemsRepository: InMemoryItemsRepository;
let listItems: ListItemsUseCase;

describe('ListItemsUseCase', () => {
  beforeEach(() => {
    itemsRepository = new InMemoryItemsRepository();
    listItems = new ListItemsUseCase(itemsRepository);
  });

  it('should be able to list items by variant', async () => {
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

    const result = await listItems.execute({
      variantId: variantId.toString(),
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].uniqueCode).toBe('ITEM-001');
    expect(result.items[1].uniqueCode).toBe('ITEM-002');
  });

  it('should be able to list items by location', async () => {
    const variantId = new UniqueEntityID();
    const locationIdA = new UniqueEntityID();
    const locationIdB = new UniqueEntityID();

    await itemsRepository.create({
      uniqueCode: 'ITEM-003',
      variantId,
      locationId: locationIdA,
      initialQuantity: 100,
      currentQuantity: 100,
      status: ItemStatus.create('AVAILABLE'),
    });

    await itemsRepository.create({
      uniqueCode: 'ITEM-004',
      variantId,
      locationId: locationIdB,
      initialQuantity: 50,
      currentQuantity: 50,
      status: ItemStatus.create('AVAILABLE'),
    });

    const result = await listItems.execute({
      locationId: locationIdA.toString(),
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].uniqueCode).toBe('ITEM-003');
  });

  it('should return all items when no filters provided', async () => {
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

    const result = await listItems.execute({});

    expect(result.items).toHaveLength(2);
  });
});
