import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetWarehouseByIdUseCase } from './get-warehouse-by-id';

let warehousesRepository: InMemoryWarehousesRepository;
let sut: GetWarehouseByIdUseCase;

describe('GetWarehouseByIdUseCase', () => {
  beforeEach(() => {
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new GetWarehouseByIdUseCase(warehousesRepository);
  });

  async function createTestWarehouse() {
    return warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'FAB',
      name: 'Fábrica Principal',
      description: 'Descrição da fábrica',
      address: 'Endereço da fábrica',
    });
  }

  it('should get warehouse by id', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: warehouse.warehouseId.toString(),
    });

    expect(result.warehouse).toBeDefined();
    expect(result.warehouse.code).toBe('FAB');
    expect(result.warehouse.name).toBe('Fábrica Principal');
    expect(result.warehouse.description).toBe('Descrição da fábrica');
    expect(result.warehouse.address).toBe('Endereço da fábrica');
  });

  it('should include zone count', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: warehouse.warehouseId.toString(),
    });

    expect(result.zoneCount).toBe(0);
  });

  it('should include zone count when zones exist', async () => {
    const warehouse = await createTestWarehouse();

    vi.spyOn(warehousesRepository, 'countZones').mockResolvedValue(3);

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: warehouse.warehouseId.toString(),
    });

    expect(result.zoneCount).toBe(3);
  });

  it('should fail when warehouse is not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not find deleted warehouse', async () => {
    const warehouse = await createTestWarehouse();

    await warehousesRepository.delete(warehouse.warehouseId);

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: warehouse.warehouseId.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
