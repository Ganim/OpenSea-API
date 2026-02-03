import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { Slug } from '@/entities/stock/value-objects/slug';
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

    const result = await listItems.execute({
      tenantId: 'tenant-1',
      variantId: variantId.toString(),
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].uniqueCode).toBe('ITEM-001');
    expect(result.items[1].uniqueCode).toBe('ITEM-002');
  });

  it('should be able to list items by bin', async () => {
    const variantId = new UniqueEntityID();
    const binIdA = new UniqueEntityID();
    const binIdB = new UniqueEntityID();

    await itemsRepository.create({
      tenantId: 'tenant-1',
      uniqueCode: 'ITEM-003',
      slug: Slug.createFromText('item-003'),
      fullCode: '001.001.0001.001-00003',
      sequentialCode: 3,
      barcode: 'BC000003',
      eanCode: 'EAN0000000003',
      upcCode: 'UPC000000003',
      variantId,
      binId: binIdA,
      initialQuantity: 100,
      currentQuantity: 100,
      status: ItemStatus.create('AVAILABLE'),
    });

    await itemsRepository.create({
      tenantId: 'tenant-1',
      uniqueCode: 'ITEM-004',
      slug: Slug.createFromText('item-004'),
      fullCode: '001.001.0001.001-00004',
      sequentialCode: 4,
      barcode: 'BC000004',
      eanCode: 'EAN0000000004',
      upcCode: 'UPC000000004',
      variantId,
      binId: binIdB,
      initialQuantity: 50,
      currentQuantity: 50,
      status: ItemStatus.create('AVAILABLE'),
    });

    const result = await listItems.execute({
      tenantId: 'tenant-1',
      binId: binIdA.toString(),
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].uniqueCode).toBe('ITEM-003');
  });

  it('should return all items when no filters provided', async () => {
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

    const result = await listItems.execute({ tenantId: 'tenant-1' });

    expect(result.items).toHaveLength(2);
  });
});
