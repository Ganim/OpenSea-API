import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import { Slug } from '@/entities/stock/value-objects/slug';
import { InMemoryItemMovementsRepository } from '@/repositories/stock/in-memory/in-memory-item-movements-repository';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetItemLocationHistoryUseCase } from './get-item-location-history';

let itemsRepository: InMemoryItemsRepository;
let itemMovementsRepository: InMemoryItemMovementsRepository;
let sut: GetItemLocationHistoryUseCase;

describe('GetItemLocationHistoryUseCase', () => {
  beforeEach(() => {
    itemsRepository = new InMemoryItemsRepository();
    itemMovementsRepository = new InMemoryItemMovementsRepository();
    sut = new GetItemLocationHistoryUseCase(
      itemsRepository,
      itemMovementsRepository,
    );
  });

  it('should return location history for an item', async () => {
    const item = await itemsRepository.create({
      tenantId: 'tenant-1',
      uniqueCode: 'ITEM-001',
      slug: Slug.createFromText('item-001'),
      fullCode: 'ITEM-001',
      sequentialCode: 1,
      barcode: 'BC000001',
      eanCode: 'EAN0000000001',
      upcCode: 'UPC000000001',
      variantId: new UniqueEntityID(),
      binId: new UniqueEntityID(),
      lastKnownAddress: 'FAB-EST-01-01-A',
      initialQuantity: 10,
      currentQuantity: 10,
      unitCost: 100,
      status: ItemStatus.create('AVAILABLE'),
    });

    await itemMovementsRepository.create({
      tenantId: 'tenant-1',
      itemId: item.id,
      userId: new UniqueEntityID(),
      quantity: 10,
      quantityBefore: 10,
      quantityAfter: 10,
      movementType: MovementType.create('TRANSFER'),
      originRef: 'Bin: FAB-EST-01-01-A',
      destinationRef: 'Bin: FAB-EST-01-02-B',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      itemId: item.id.toString(),
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].type).toBe('TRANSFER');
    expect(result.data[0].from).toBe('Bin: FAB-EST-01-01-A');
    expect(result.data[0].to).toBe('Bin: FAB-EST-01-02-B');
  });

  it('should throw ResourceNotFoundError when item not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        itemId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should filter to only location-related movement types', async () => {
    const item = await itemsRepository.create({
      tenantId: 'tenant-1',
      uniqueCode: 'ITEM-002',
      slug: Slug.createFromText('item-002'),
      fullCode: 'ITEM-002',
      sequentialCode: 2,
      barcode: 'BC000002',
      eanCode: 'EAN0000000002',
      upcCode: 'UPC000000002',
      variantId: new UniqueEntityID(),
      binId: new UniqueEntityID(),
      lastKnownAddress: 'FAB-EST-01-01-A',
      initialQuantity: 10,
      currentQuantity: 10,
      unitCost: 100,
      status: ItemStatus.create('AVAILABLE'),
    });

    // Location-related movement (TRANSFER)
    await itemMovementsRepository.create({
      tenantId: 'tenant-1',
      itemId: item.id,
      userId: new UniqueEntityID(),
      quantity: 10,
      quantityBefore: 10,
      quantityAfter: 10,
      movementType: MovementType.create('TRANSFER'),
      originRef: 'Bin: A',
      destinationRef: 'Bin: B',
    });

    // Location-related movement (ZONE_RECONFIGURE)
    await itemMovementsRepository.create({
      tenantId: 'tenant-1',
      itemId: item.id,
      userId: new UniqueEntityID(),
      quantity: 10,
      quantityBefore: 10,
      quantityAfter: 10,
      movementType: MovementType.create('ZONE_RECONFIGURE'),
      originRef: 'Bin: B',
    });

    // Location-related movement (INVENTORY_ADJUSTMENT)
    await itemMovementsRepository.create({
      tenantId: 'tenant-1',
      itemId: item.id,
      userId: new UniqueEntityID(),
      quantity: 10,
      quantityBefore: 10,
      quantityAfter: 10,
      movementType: MovementType.create('INVENTORY_ADJUSTMENT'),
      originRef: 'Bin: C',
      destinationRef: 'Bin: D',
    });

    // Non-location movement (PURCHASE) - should be filtered out
    await itemMovementsRepository.create({
      tenantId: 'tenant-1',
      itemId: item.id,
      userId: new UniqueEntityID(),
      quantity: 5,
      quantityBefore: 10,
      quantityAfter: 15,
      movementType: MovementType.create('PURCHASE'),
    });

    // Non-location movement (SALE) - should be filtered out
    await itemMovementsRepository.create({
      tenantId: 'tenant-1',
      itemId: item.id,
      userId: new UniqueEntityID(),
      quantity: 3,
      quantityBefore: 15,
      quantityAfter: 12,
      movementType: MovementType.create('SALE'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      itemId: item.id.toString(),
    });

    expect(result.data).toHaveLength(3);
    const types = result.data.map((entry) => entry.type);
    expect(types).toContain('TRANSFER');
    expect(types).toContain('ZONE_RECONFIGURE');
    expect(types).toContain('INVENTORY_ADJUSTMENT');
    expect(types).not.toContain('PURCHASE');
    expect(types).not.toContain('SALE');
  });

  it('should return empty data when no location movements exist', async () => {
    const item = await itemsRepository.create({
      tenantId: 'tenant-1',
      uniqueCode: 'ITEM-003',
      slug: Slug.createFromText('item-003'),
      fullCode: 'ITEM-003',
      sequentialCode: 3,
      barcode: 'BC000003',
      eanCode: 'EAN0000000003',
      upcCode: 'UPC000000003',
      variantId: new UniqueEntityID(),
      binId: new UniqueEntityID(),
      lastKnownAddress: 'FAB-EST-01-01-A',
      initialQuantity: 10,
      currentQuantity: 10,
      unitCost: 100,
      status: ItemStatus.create('AVAILABLE'),
    });

    // Only non-location movement
    await itemMovementsRepository.create({
      tenantId: 'tenant-1',
      itemId: item.id,
      userId: new UniqueEntityID(),
      quantity: 10,
      quantityBefore: 0,
      quantityAfter: 10,
      movementType: MovementType.create('PURCHASE'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      itemId: item.id.toString(),
    });

    expect(result.data).toHaveLength(0);
  });
});
