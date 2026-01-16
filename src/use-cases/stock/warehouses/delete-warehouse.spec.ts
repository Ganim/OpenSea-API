import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteWarehouseUseCase } from './delete-warehouse';

let warehousesRepository: InMemoryWarehousesRepository;
let sut: DeleteWarehouseUseCase;

describe('DeleteWarehouseUseCase', () => {
  beforeEach(() => {
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new DeleteWarehouseUseCase(warehousesRepository);
  });

  async function createTestWarehouse() {
    return warehousesRepository.create({
      code: 'FAB',
      name: 'Fábrica Principal',
    });
  }

  it('should delete a warehouse without zones', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      id: warehouse.warehouseId.toString(),
    });

    expect(result.success).toBe(true);

    const deletedWarehouse = await warehousesRepository.findById(
      warehouse.warehouseId,
    );
    expect(deletedWarehouse).toBeNull();
  });

  it('should fail when warehouse is not found', async () => {
    await expect(() =>
      sut.execute({
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should fail when warehouse has zones', async () => {
    const warehouse = await createTestWarehouse();

    // Mock countZones to return 1
    vi.spyOn(warehousesRepository, 'countZones').mockResolvedValue(1);

    await expect(() =>
      sut.execute({
        id: warehouse.warehouseId.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail with message including zone count', async () => {
    const warehouse = await createTestWarehouse();

    vi.spyOn(warehousesRepository, 'countZones').mockResolvedValue(5);

    try {
      await sut.execute({
        id: warehouse.warehouseId.toString(),
      });
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestError);
      expect((error as BadRequestError).message).toContain('5 zone(s)');
    }
  });

  it('should soft delete warehouse', async () => {
    const warehouse = await createTestWarehouse();

    await sut.execute({
      id: warehouse.warehouseId.toString(),
    });

    // Warehouse should still exist in the array but be marked as deleted
    const warehouseInArray = warehousesRepository.warehouses.find((w) =>
      w.warehouseId.equals(warehouse.warehouseId),
    );
    expect(warehouseInArray).toBeDefined();
    expect(warehouseInArray?.deletedAt).not.toBeNull();
  });
});
