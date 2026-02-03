import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { Slug } from '@/entities/stock/value-objects/slug';
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
    const binId = new UniqueEntityID();

    await itemsRepository.create({
      tenantId: 'tenant-1',
      uniqueCode: 'ITEM-001',
      slug: Slug.createFromText('item-001'),
      fullCode: '001.001.0001.001-00001',
      sequentialCode: 1,
      barcode: 'BC000001',
      eanCode: 'EAN0000000001',
      upcCode: 'UPC000000001',
      variantId,
      binId,
      initialQuantity: 100,
      currentQuantity: 100,
      status: ItemStatus.create('AVAILABLE'),
    });

    await itemsRepository.create({
      tenantId: 'tenant-1',
      uniqueCode: 'ITEM-002',
      slug: Slug.createFromText('item-002'),
      fullCode: '001.001.0001.001-00002',
      sequentialCode: 2,
      barcode: 'BC000002',
      eanCode: 'EAN0000000002',
      upcCode: 'UPC000000002',
      variantId,
      binId,
      initialQuantity: 50,
      currentQuantity: 50,
      status: ItemStatus.create('AVAILABLE'),
    });

    const result = await listItemsByVariantId.execute({
      tenantId: 'tenant-1',
      variantId: variantId.toString(),
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].uniqueCode).toBe('ITEM-001');
    expect(result.items[1].uniqueCode).toBe('ITEM-002');
  });

  it('should return empty array when variant has no items', async () => {
    const variantId = new UniqueEntityID().toString();

    const result = await listItemsByVariantId.execute({
      tenantId: 'tenant-1',
      variantId,
    });

    expect(result.items).toHaveLength(0);
  });
});
