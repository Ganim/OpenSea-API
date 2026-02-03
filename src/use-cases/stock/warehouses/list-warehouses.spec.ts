import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListWarehousesUseCase } from './list-warehouses';

let warehousesRepository: InMemoryWarehousesRepository;
let sut: ListWarehousesUseCase;

describe('ListWarehousesUseCase', () => {
  beforeEach(() => {
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new ListWarehousesUseCase(warehousesRepository);
  });

  async function createTestWarehouses() {
    await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'FAB',
      name: 'Fábrica',
      isActive: true,
    });

    await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'WH1',
      name: 'Warehouse 1',
      isActive: true,
    });

    await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'OLD',
      name: 'Armazém Antigo',
      isActive: false,
    });
  }

  it('should list all warehouses', async () => {
    await createTestWarehouses();

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.warehouses).toHaveLength(3);
  });

  it('should list only active warehouses when activeOnly is true', async () => {
    await createTestWarehouses();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      activeOnly: true,
    });

    expect(result.warehouses).toHaveLength(2);
    result.warehouses.forEach((w) => {
      expect(w.isActive).toBe(true);
    });
  });

  it('should return empty array when no warehouses exist', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.warehouses).toHaveLength(0);
  });

  it('should not include deleted warehouses', async () => {
    await createTestWarehouses();

    const warehouse = warehousesRepository.warehouses[0];
    await warehousesRepository.delete(warehouse.warehouseId);

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.warehouses).toHaveLength(2);
  });

  it('should default to activeOnly false', async () => {
    await createTestWarehouses();

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.warehouses).toHaveLength(3);
  });
});
