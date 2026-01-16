import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListBinsUseCase } from './list-bins';

let binsRepository: InMemoryBinsRepository;
let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: ListBinsUseCase;

describe('ListBinsUseCase', () => {
  beforeEach(() => {
    binsRepository = new InMemoryBinsRepository();
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new ListBinsUseCase(binsRepository);
  });

  async function createTestData() {
    const warehouse = await warehousesRepository.create({
      code: 'FAB',
      name: 'Fábrica',
    });

    const zone1 = await zonesRepository.create({
      warehouseId: warehouse.warehouseId,
      code: 'EST',
      name: 'Estoque',
    });

    const zone2 = await zonesRepository.create({
      warehouseId: warehouse.warehouseId,
      code: 'PRD',
      name: 'Produção',
    });

    await binsRepository.create({
      zoneId: zone1.zoneId,
      address: 'FAB-EST-101-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
      isActive: true,
      isBlocked: false,
    });

    await binsRepository.create({
      zoneId: zone1.zoneId,
      address: 'FAB-EST-102-B',
      aisle: 1,
      shelf: 2,
      position: 'B',
      isActive: true,
      isBlocked: true,
    });

    await binsRepository.create({
      zoneId: zone1.zoneId,
      address: 'FAB-EST-201-A',
      aisle: 2,
      shelf: 1,
      position: 'A',
      isActive: false,
      isBlocked: false,
    });

    await binsRepository.create({
      zoneId: zone2.zoneId,
      address: 'FAB-PRD-101-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
      isActive: true,
      isBlocked: false,
    });

    return { warehouse, zone1, zone2 };
  }

  it('should list all bins', async () => {
    await createTestData();

    const result = await sut.execute();

    expect(result.bins).toHaveLength(4);
  });

  it('should filter bins by zone', async () => {
    const { zone1 } = await createTestData();

    const result = await sut.execute({
      zoneId: zone1.zoneId.toString(),
    });

    expect(result.bins).toHaveLength(3);
    result.bins.forEach((b) => {
      expect(b.zoneId.equals(zone1.zoneId)).toBe(true);
    });
  });

  it('should filter bins by aisle', async () => {
    await createTestData();

    const result = await sut.execute({
      aisle: 1,
    });

    expect(result.bins).toHaveLength(3);
    result.bins.forEach((b) => {
      expect(b.aisle).toBe(1);
    });
  });

  it('should filter bins by shelf', async () => {
    await createTestData();

    const result = await sut.execute({
      shelf: 1,
    });

    expect(result.bins).toHaveLength(3);
    result.bins.forEach((b) => {
      expect(b.shelf).toBe(1);
    });
  });

  it('should filter active bins only', async () => {
    await createTestData();

    const result = await sut.execute({
      isActive: true,
    });

    expect(result.bins).toHaveLength(3);
    result.bins.forEach((b) => {
      expect(b.isActive).toBe(true);
    });
  });

  it('should filter inactive bins only', async () => {
    await createTestData();

    const result = await sut.execute({
      isActive: false,
    });

    expect(result.bins).toHaveLength(1);
    result.bins.forEach((b) => {
      expect(b.isActive).toBe(false);
    });
  });

  it('should filter blocked bins only', async () => {
    await createTestData();

    const result = await sut.execute({
      isBlocked: true,
    });

    expect(result.bins).toHaveLength(1);
    result.bins.forEach((b) => {
      expect(b.isBlocked).toBe(true);
    });
  });

  it('should filter by address pattern', async () => {
    await createTestData();

    const result = await sut.execute({
      addressPattern: 'FAB-EST',
    });

    expect(result.bins).toHaveLength(3);
    result.bins.forEach((b) => {
      expect(b.address.includes('FAB-EST')).toBe(true);
    });
  });

  it('should combine multiple filters', async () => {
    const { zone1 } = await createTestData();

    const result = await sut.execute({
      zoneId: zone1.zoneId.toString(),
      aisle: 1,
      isActive: true,
    });

    expect(result.bins).toHaveLength(2);
  });

  it('should return empty array when no bins exist', async () => {
    const result = await sut.execute();

    expect(result.bins).toHaveLength(0);
  });

  it('should not include deleted bins', async () => {
    await createTestData();

    const bin = binsRepository.bins[0];
    await binsRepository.delete(bin.binId);

    const result = await sut.execute();

    expect(result.bins).toHaveLength(3);
  });
});
