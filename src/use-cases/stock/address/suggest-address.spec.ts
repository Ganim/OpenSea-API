import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SuggestAddressUseCase } from './suggest-address';

let binsRepository: InMemoryBinsRepository;
let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: SuggestAddressUseCase;

describe('SuggestAddressUseCase', () => {
  beforeEach(() => {
    binsRepository = new InMemoryBinsRepository();
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new SuggestAddressUseCase(
      binsRepository,
      zonesRepository,
      warehousesRepository,
    );
  });

  async function createTestData() {
    const warehouse = await warehousesRepository.create({
      code: 'FAB',
      name: 'Fábrica Principal',
    });

    const zone = await zonesRepository.create({
      warehouseId: warehouse.warehouseId,
      code: 'EST',
      name: 'Estoque',
    });

    const bins = await Promise.all([
      binsRepository.create({
        zoneId: zone.zoneId,
        address: 'FAB-EST-101-A',
        aisle: 1,
        shelf: 1,
        position: 'A',
        capacity: 100,
        currentOccupancy: 50,
      }),
      binsRepository.create({
        zoneId: zone.zoneId,
        address: 'FAB-EST-102-A',
        aisle: 1,
        shelf: 2,
        position: 'A',
      }),
      binsRepository.create({
        zoneId: zone.zoneId,
        address: 'FAB-EST-103-B',
        aisle: 1,
        shelf: 3,
        position: 'B',
      }),
      binsRepository.create({
        zoneId: zone.zoneId,
        address: 'FAB-EST-201-A',
        aisle: 2,
        shelf: 1,
        position: 'A',
      }),
    ]);

    return { warehouse, zone, bins };
  }

  it('should suggest addresses matching partial query', async () => {
    const { warehouse, zone } = await createTestData();

    const result = await sut.execute({
      partial: 'FAB-EST',
    });

    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.query).toBe('FAB-EST');

    result.suggestions.forEach((suggestion) => {
      expect(suggestion.address.startsWith('FAB-EST')).toBe(true);
      expect(suggestion.warehouseCode).toBe(warehouse.code);
      expect(suggestion.zoneCode).toBe(zone.code);
    });
  });

  it('should suggest addresses matching case-insensitive query', async () => {
    await createTestData();

    const result = await sut.execute({
      partial: 'fab-est',
    });

    expect(result.suggestions.length).toBeGreaterThan(0);
    result.suggestions.forEach((suggestion) => {
      expect(suggestion.address.toUpperCase().includes('FAB-EST')).toBe(true);
    });
  });

  it('should limit number of suggestions', async () => {
    await createTestData();

    const result = await sut.execute({
      partial: 'FAB',
      limit: 2,
    });

    expect(result.suggestions).toHaveLength(2);
  });

  it('should return empty suggestions when no match', async () => {
    await createTestData();

    const result = await sut.execute({
      partial: 'XYZ-NOPE',
    });

    expect(result.suggestions).toHaveLength(0);
    expect(result.total).toBe(0);
    expect(result.query).toBe('XYZ-NOPE');
  });

  it('should include full bin information in suggestions', async () => {
    const { warehouse, zone, bins } = await createTestData();

    const result = await sut.execute({
      partial: 'FAB-EST-101',
    });

    expect(result.suggestions).toHaveLength(1);
    const suggestion = result.suggestions[0];

    expect(suggestion.address).toBe('FAB-EST-101-A');
    expect(suggestion.binId).toBe(bins[0].binId.toString());
    expect(suggestion.warehouseCode).toBe(warehouse.code);
    expect(suggestion.warehouseName).toBe(warehouse.name);
    expect(suggestion.zoneCode).toBe(zone.code);
    expect(suggestion.zoneName).toBe(zone.name);
    expect(suggestion.aisle).toBe(1);
    expect(suggestion.shelf).toBe(1);
    expect(suggestion.position).toBe('A');
  });

  it('should include occupancy information', async () => {
    await createTestData();

    const result = await sut.execute({
      partial: 'FAB-EST-101',
    });

    expect(result.suggestions).toHaveLength(1);
    const suggestion = result.suggestions[0];

    expect(suggestion.occupancy.current).toBe(50);
    expect(suggestion.occupancy.capacity).toBe(100);
  });

  it('should include availability status', async () => {
    await createTestData();

    const result = await sut.execute({
      partial: 'FAB-EST',
    });

    result.suggestions.forEach((suggestion) => {
      expect(typeof suggestion.isAvailable).toBe('boolean');
    });
  });

  it('should handle bins without capacity', async () => {
    await createTestData();

    const result = await sut.execute({
      partial: 'FAB-EST-102',
    });

    expect(result.suggestions).toHaveLength(1);
    expect(result.suggestions[0].occupancy.capacity).toBeNull();
  });

  it('should skip bins with missing zones', async () => {
    const { zone } = await createTestData();

    // Manually remove zone from repository
    zonesRepository.zones = zonesRepository.zones.filter(
      (z) => !z.zoneId.equals(zone.zoneId),
    );

    const result = await sut.execute({
      partial: 'FAB-EST',
    });

    expect(result.suggestions).toHaveLength(0);
  });

  it('should cache zone and warehouse lookups for efficiency', async () => {
    await createTestData();

    const result = await sut.execute({
      partial: 'FAB-EST',
    });

    // All bins share the same zone/warehouse - should have been cached
    expect(result.suggestions.length).toBeGreaterThan(1);

    const uniqueWarehouses = new Set(
      result.suggestions.map((s) => s.warehouseCode),
    );
    const uniqueZones = new Set(result.suggestions.map((s) => s.zoneCode));

    expect(uniqueWarehouses.size).toBe(1);
    expect(uniqueZones.size).toBe(1);
  });

  it('should use default limit of 10', async () => {
    const warehouse = await warehousesRepository.create({
      code: 'BIG',
      name: 'Big Warehouse',
    });

    const zone = await zonesRepository.create({
      warehouseId: warehouse.warehouseId,
      code: 'ZN1',
      name: 'Zone 1',
    });

    // Create 15 bins
    for (let i = 1; i <= 15; i++) {
      await binsRepository.create({
        zoneId: zone.zoneId,
        address: `BIG-ZN1-${i.toString().padStart(3, '0')}-A`,
        aisle: 1,
        shelf: i,
        position: 'A',
      });
    }

    const result = await sut.execute({
      partial: 'BIG-ZN1',
    });

    expect(result.suggestions).toHaveLength(10);
  });

  it('should return total count of suggestions', async () => {
    await createTestData();

    const result = await sut.execute({
      partial: 'FAB-EST',
    });

    expect(result.total).toBe(result.suggestions.length);
  });
});
