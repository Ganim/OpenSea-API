import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListZonesUseCase } from './list-zones';

let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: ListZonesUseCase;

describe('ListZonesUseCase', () => {
  beforeEach(() => {
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new ListZonesUseCase(zonesRepository);
  });

  async function createTestData() {
    const warehouse1 = await warehousesRepository.create({
      code: 'FAB',
      name: 'Fábrica',
    });

    const warehouse2 = await warehousesRepository.create({
      code: 'WH2',
      name: 'Warehouse 2',
    });

    await zonesRepository.create({
      warehouseId: warehouse1.warehouseId,
      code: 'EST',
      name: 'Estoque FAB',
      isActive: true,
    });

    await zonesRepository.create({
      warehouseId: warehouse1.warehouseId,
      code: 'PRD',
      name: 'Produção FAB',
      isActive: true,
    });

    await zonesRepository.create({
      warehouseId: warehouse1.warehouseId,
      code: 'OLD',
      name: 'Zona Antiga FAB',
      isActive: false,
    });

    await zonesRepository.create({
      warehouseId: warehouse2.warehouseId,
      code: 'EST',
      name: 'Estoque WH2',
      isActive: true,
    });

    return { warehouse1, warehouse2 };
  }

  it('should list all zones', async () => {
    await createTestData();

    const result = await sut.execute();

    expect(result.zones).toHaveLength(4);
  });

  it('should list zones by warehouse', async () => {
    const { warehouse1 } = await createTestData();

    const result = await sut.execute({
      warehouseId: warehouse1.warehouseId.toString(),
    });

    expect(result.zones).toHaveLength(3);
    result.zones.forEach((z) => {
      expect(z.warehouseId.equals(warehouse1.warehouseId)).toBe(true);
    });
  });

  it('should list only active zones', async () => {
    await createTestData();

    const result = await sut.execute({ activeOnly: true });

    expect(result.zones).toHaveLength(3);
    result.zones.forEach((z) => {
      expect(z.isActive).toBe(true);
    });
  });

  it('should list only active zones by warehouse', async () => {
    const { warehouse1 } = await createTestData();

    const result = await sut.execute({
      warehouseId: warehouse1.warehouseId.toString(),
      activeOnly: true,
    });

    expect(result.zones).toHaveLength(2);
    result.zones.forEach((z) => {
      expect(z.isActive).toBe(true);
      expect(z.warehouseId.equals(warehouse1.warehouseId)).toBe(true);
    });
  });

  it('should return empty array when no zones exist', async () => {
    const result = await sut.execute();

    expect(result.zones).toHaveLength(0);
  });

  it('should not include deleted zones', async () => {
    await createTestData();

    const zone = zonesRepository.zones[0];
    await zonesRepository.delete(zone.zoneId);

    const result = await sut.execute();

    expect(result.zones).toHaveLength(3);
  });

  it('should default to activeOnly false', async () => {
    await createTestData();

    const result = await sut.execute({});

    expect(result.zones).toHaveLength(4);
  });
});
