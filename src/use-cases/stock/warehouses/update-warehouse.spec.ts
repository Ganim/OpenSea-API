import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateWarehouseUseCase } from './update-warehouse';

let warehousesRepository: InMemoryWarehousesRepository;
let sut: UpdateWarehouseUseCase;

describe('UpdateWarehouseUseCase', () => {
  beforeEach(() => {
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new UpdateWarehouseUseCase(warehousesRepository);
  });

  async function createTestWarehouse() {
    return warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'FAB',
      name: 'Fábrica Principal',
      description: 'Descrição original',
      address: 'Endereço original',
      isActive: true,
    });
  }

  it('should update warehouse name', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: warehouse.warehouseId.toString(),
      name: 'Novo Nome',
    });

    expect(result.warehouse.name).toBe('Novo Nome');
    expect(result.warehouse.code).toBe('FAB');
  });

  it('should update warehouse code', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: warehouse.warehouseId.toString(),
      code: 'WH1',
    });

    expect(result.warehouse.code).toBe('WH1');
  });

  it('should update warehouse description', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: warehouse.warehouseId.toString(),
      description: 'Nova descrição',
    });

    expect(result.warehouse.description).toBe('Nova descrição');
  });

  it('should clear warehouse description with null', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: warehouse.warehouseId.toString(),
      description: null,
    });

    expect(result.warehouse.description).toBeNull();
  });

  it('should update warehouse address', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: warehouse.warehouseId.toString(),
      address: 'Novo endereço',
    });

    expect(result.warehouse.address).toBe('Novo endereço');
  });

  it('should clear warehouse address with null', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: warehouse.warehouseId.toString(),
      address: null,
    });

    expect(result.warehouse.address).toBeNull();
  });

  it('should update warehouse active status', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: warehouse.warehouseId.toString(),
      isActive: false,
    });

    expect(result.warehouse.isActive).toBe(false);
  });

  it('should update multiple fields at once', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: warehouse.warehouseId.toString(),
      name: 'Novo Nome',
      description: 'Nova descrição',
      isActive: false,
    });

    expect(result.warehouse.name).toBe('Novo Nome');
    expect(result.warehouse.description).toBe('Nova descrição');
    expect(result.warehouse.isActive).toBe(false);
  });

  it('should fail when warehouse is not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: new UniqueEntityID().toString(),
        name: 'Novo Nome',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should fail when new code is too short', async () => {
    const warehouse = await createTestWarehouse();

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: warehouse.warehouseId.toString(),
        code: 'F',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail when new code is too long', async () => {
    const warehouse = await createTestWarehouse();

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: warehouse.warehouseId.toString(),
        code: 'FABRIC',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail when new code already exists on another warehouse', async () => {
    const warehouse1 = await createTestWarehouse();

    await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'WH2',
      name: 'Warehouse 2',
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: warehouse1.warehouseId.toString(),
        code: 'WH2',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow keeping same code', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: warehouse.warehouseId.toString(),
      code: 'FAB',
      name: 'Novo Nome',
    });

    expect(result.warehouse.code).toBe('FAB');
    expect(result.warehouse.name).toBe('Novo Nome');
  });
});
