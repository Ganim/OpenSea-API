import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { Slug } from '@/entities/stock/value-objects/slug';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryItemMovementsRepository } from '@/repositories/stock/in-memory/in-memory-item-movements-repository';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { BatchTransferItemsUseCase } from './batch-transfer-items';

let itemsRepository: InMemoryItemsRepository;
let binsRepository: InMemoryBinsRepository;
let itemMovementsRepository: InMemoryItemMovementsRepository;
let sut: BatchTransferItemsUseCase;

describe('BatchTransferItemsUseCase', () => {
  beforeEach(() => {
    itemsRepository = new InMemoryItemsRepository();
    binsRepository = new InMemoryBinsRepository();
    itemMovementsRepository = new InMemoryItemMovementsRepository();
    sut = new BatchTransferItemsUseCase(
      itemsRepository,
      binsRepository,
      itemMovementsRepository,
    );
  });

  it('should transfer items to destination bin', async () => {
    const zoneId = new UniqueEntityID();

    const originBin = await binsRepository.create({
      tenantId: 'tenant-1',
      zoneId,
      address: 'FAB-EST-01-01-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
    });

    const destBin = await binsRepository.create({
      tenantId: 'tenant-1',
      zoneId,
      address: 'FAB-EST-01-02-B',
      aisle: 1,
      shelf: 2,
      position: 'B',
    });

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
      binId: originBin.binId,
      lastKnownAddress: 'FAB-EST-01-01-A',
      initialQuantity: 10,
      currentQuantity: 10,
      unitCost: 100,
      status: ItemStatus.create('AVAILABLE'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      itemIds: [item.id.toString()],
      destinationBinId: destBin.binId.toString(),
      userId: new UniqueEntityID().toString(),
    });

    expect(result.transferred).toBe(1);
    expect(result.movements).toHaveLength(1);
    expect(result.movements[0].movementType).toBe('TRANSFER');

    const updatedItem = await itemsRepository.findById(item.id, 'tenant-1');
    expect(updatedItem!.binId!.equals(destBin.binId)).toBe(true);
    expect(updatedItem!.lastKnownAddress).toBe('FAB-EST-01-02-B');
  });

  it('should throw BadRequestError when itemIds is empty', async () => {
    const zoneId = new UniqueEntityID();

    const destBin = await binsRepository.create({
      tenantId: 'tenant-1',
      zoneId,
      address: 'FAB-EST-01-01-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        itemIds: [],
        destinationBinId: destBin.binId.toString(),
        userId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when more than 100 items', async () => {
    const zoneId = new UniqueEntityID();

    const destBin = await binsRepository.create({
      tenantId: 'tenant-1',
      zoneId,
      address: 'FAB-EST-01-01-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
    });

    const itemIds = Array.from({ length: 101 }, () =>
      new UniqueEntityID().toString(),
    );

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        itemIds,
        destinationBinId: destBin.binId.toString(),
        userId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw ResourceNotFoundError when destination bin not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        itemIds: [new UniqueEntityID().toString()],
        destinationBinId: new UniqueEntityID().toString(),
        userId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw BadRequestError when destination bin is blocked', async () => {
    const zoneId = new UniqueEntityID();

    const destBin = await binsRepository.create({
      tenantId: 'tenant-1',
      zoneId,
      address: 'FAB-EST-01-01-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
      isBlocked: true,
      blockReason: 'Maintenance',
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        itemIds: [new UniqueEntityID().toString()],
        destinationBinId: destBin.binId.toString(),
        userId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw ResourceNotFoundError when item not found', async () => {
    const zoneId = new UniqueEntityID();

    const destBin = await binsRepository.create({
      tenantId: 'tenant-1',
      zoneId,
      address: 'FAB-EST-01-01-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        itemIds: [new UniqueEntityID().toString()],
        destinationBinId: destBin.binId.toString(),
        userId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should skip items already in destination bin', async () => {
    const zoneId = new UniqueEntityID();

    const destBin = await binsRepository.create({
      tenantId: 'tenant-1',
      zoneId,
      address: 'FAB-EST-01-01-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
    });

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
      binId: destBin.binId,
      lastKnownAddress: 'FAB-EST-01-01-A',
      initialQuantity: 10,
      currentQuantity: 10,
      unitCost: 100,
      status: ItemStatus.create('AVAILABLE'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      itemIds: [item.id.toString()],
      destinationBinId: destBin.binId.toString(),
      userId: new UniqueEntityID().toString(),
    });

    expect(result.transferred).toBe(0);
    expect(result.movements).toHaveLength(0);
  });
});
