import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GenerateLabelsByZoneUseCase } from './generate-labels-by-zone';

let binsRepository: InMemoryBinsRepository;
let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: GenerateLabelsByZoneUseCase;

describe('GenerateLabelsByZoneUseCase', () => {
  beforeEach(() => {
    binsRepository = new InMemoryBinsRepository();
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new GenerateLabelsByZoneUseCase(
      binsRepository,
      zonesRepository,
      warehousesRepository,
    );
  });

  async function createTestData() {
    const warehouse = await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'FAB',
      name: 'Fábrica Principal',
    });

    const zone = await zonesRepository.create({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId,
      code: 'EST',
      name: 'Estoque',
    });

    // Create bins with different aisles, shelves, and positions
    const bins = await Promise.all([
      binsRepository.create({
        tenantId: 'tenant-1',
        zoneId: zone.zoneId,
        address: 'FAB-EST-101-A',
        aisle: 1,
        shelf: 1,
        position: 'A',
      }),
      binsRepository.create({
        tenantId: 'tenant-1',
        zoneId: zone.zoneId,
        address: 'FAB-EST-101-B',
        aisle: 1,
        shelf: 1,
        position: 'B',
      }),
      binsRepository.create({
        tenantId: 'tenant-1',
        zoneId: zone.zoneId,
        address: 'FAB-EST-102-A',
        aisle: 1,
        shelf: 2,
        position: 'A',
      }),
      binsRepository.create({
        tenantId: 'tenant-1',
        zoneId: zone.zoneId,
        address: 'FAB-EST-103-A',
        aisle: 1,
        shelf: 3,
        position: 'A',
      }),
      binsRepository.create({
        tenantId: 'tenant-1',
        zoneId: zone.zoneId,
        address: 'FAB-EST-201-A',
        aisle: 2,
        shelf: 1,
        position: 'A',
      }),
      binsRepository.create({
        tenantId: 'tenant-1',
        zoneId: zone.zoneId,
        address: 'FAB-EST-202-C',
        aisle: 2,
        shelf: 2,
        position: 'C',
      }),
      binsRepository.create({
        tenantId: 'tenant-1',
        zoneId: zone.zoneId,
        address: 'FAB-EST-301-A',
        aisle: 3,
        shelf: 1,
        position: 'A',
      }),
    ]);

    return { warehouse, zone, bins };
  }

  it('should generate labels for all bins in a zone', async () => {
    const { warehouse, zone, bins } = await createTestData();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId.toString(),
      format: 'qr',
      size: 'medium',
    });

    expect(result.labels).toHaveLength(bins.length);
    expect(result.format).toBe('qr');
    expect(result.size).toBe('medium');
    expect(result.totalLabels).toBe(bins.length);

    result.labels.forEach((label) => {
      expect(label.warehouseCode).toBe(warehouse.code);
      expect(label.zoneCode).toBe(zone.code);
    });
  });

  it('should filter by aisles', async () => {
    const { zone } = await createTestData();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId.toString(),
      format: 'qr',
      size: 'medium',
      aisles: [1],
    });

    expect(result.labels).toHaveLength(4);
    result.labels.forEach((label) => {
      expect(label.aisle).toBe(1);
    });
  });

  it('should filter by multiple aisles', async () => {
    const { zone } = await createTestData();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId.toString(),
      format: 'qr',
      size: 'medium',
      aisles: [1, 2],
    });

    expect(result.labels).toHaveLength(6);
    result.labels.forEach((label) => {
      expect([1, 2]).toContain(label.aisle);
    });
  });

  it('should filter by shelf range (from)', async () => {
    const { zone } = await createTestData();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId.toString(),
      format: 'qr',
      size: 'medium',
      shelvesFrom: 2,
    });

    expect(result.labels).toHaveLength(3);
    result.labels.forEach((label) => {
      expect(label.shelf).toBeGreaterThanOrEqual(2);
    });
  });

  it('should filter by shelf range (to)', async () => {
    const { zone } = await createTestData();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId.toString(),
      format: 'qr',
      size: 'medium',
      shelvesTo: 1,
    });

    expect(result.labels).toHaveLength(4);
    result.labels.forEach((label) => {
      expect(label.shelf).toBeLessThanOrEqual(1);
    });
  });

  it('should filter by shelf range (from and to)', async () => {
    const { zone } = await createTestData();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId.toString(),
      format: 'qr',
      size: 'medium',
      shelvesFrom: 1,
      shelvesTo: 2,
    });

    expect(result.labels).toHaveLength(6);
    result.labels.forEach((label) => {
      expect(label.shelf).toBeGreaterThanOrEqual(1);
      expect(label.shelf).toBeLessThanOrEqual(2);
    });
  });

  it('should filter by positions', async () => {
    const { zone } = await createTestData();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId.toString(),
      format: 'qr',
      size: 'medium',
      positions: ['A'],
    });

    expect(result.labels).toHaveLength(5);
    result.labels.forEach((label) => {
      expect(label.position.toUpperCase()).toBe('A');
    });
  });

  it('should filter by multiple positions (case insensitive)', async () => {
    const { zone } = await createTestData();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId.toString(),
      format: 'qr',
      size: 'medium',
      positions: ['a', 'B'],
    });

    expect(result.labels).toHaveLength(6);
    result.labels.forEach((label) => {
      expect(['A', 'B']).toContain(label.position.toUpperCase());
    });
  });

  it('should combine multiple filters', async () => {
    const { zone } = await createTestData();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId.toString(),
      format: 'qr',
      size: 'medium',
      aisles: [1],
      shelvesFrom: 1,
      shelvesTo: 2,
      positions: ['A'],
    });

    expect(result.labels).toHaveLength(2);
    result.labels.forEach((label) => {
      expect(label.aisle).toBe(1);
      expect(label.shelf).toBeGreaterThanOrEqual(1);
      expect(label.shelf).toBeLessThanOrEqual(2);
      expect(label.position).toBe('A');
    });
  });

  it('should exclude warehouse from codeData when includeWarehouse is false', async () => {
    const { zone } = await createTestData();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId.toString(),
      format: 'qr',
      size: 'medium',
      includeWarehouse: false,
    });

    result.labels.forEach((label) => {
      expect(label.codeData.startsWith('EST-')).toBe(true);
      expect(label.address.startsWith('FAB-')).toBe(true);
    });
  });

  it('should exclude both warehouse and zone from codeData', async () => {
    const { zone } = await createTestData();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId.toString(),
      format: 'qr',
      size: 'medium',
      includeWarehouse: false,
      includeZone: false,
    });

    result.labels.forEach((label) => {
      expect(label.codeData.startsWith('FAB-')).toBe(false);
      expect(label.codeData.startsWith('EST-')).toBe(false);
      expect(label.address.startsWith('FAB-EST-')).toBe(true);
    });
  });

  it('should throw error when zone is not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        zoneId: new UniqueEntityID().toString(),
        format: 'qr',
        size: 'medium',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw error when warehouse is not found', async () => {
    const zone = await zonesRepository.create({
      tenantId: 'tenant-1',
      warehouseId: new UniqueEntityID(),
      code: 'ORPHAN',
      name: 'Zona Órfã',
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        zoneId: zone.zoneId.toString(),
        format: 'qr',
        size: 'medium',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should return empty labels when zone has no bins', async () => {
    const warehouse = await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'FAB',
      name: 'Fábrica Principal',
    });

    const zone = await zonesRepository.create({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId,
      code: 'EMPTY',
      name: 'Zona Vazia',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId.toString(),
      format: 'qr',
      size: 'medium',
    });

    expect(result.labels).toHaveLength(0);
    expect(result.totalLabels).toBe(0);
  });

  it('should support barcode format', async () => {
    const { zone } = await createTestData();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      zoneId: zone.zoneId.toString(),
      format: 'barcode',
      size: 'large',
    });

    expect(result.format).toBe('barcode');
    expect(result.size).toBe('large');
  });
});
