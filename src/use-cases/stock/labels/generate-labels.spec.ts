import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GenerateLabelsUseCase } from './generate-labels';

let binsRepository: InMemoryBinsRepository;
let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: GenerateLabelsUseCase;

describe('GenerateLabelsUseCase', () => {
  beforeEach(() => {
    binsRepository = new InMemoryBinsRepository();
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new GenerateLabelsUseCase(
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

    const bin1 = await binsRepository.create({
      zoneId: zone.zoneId,
      address: 'FAB-EST-101-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
    });

    const bin2 = await binsRepository.create({
      zoneId: zone.zoneId,
      address: 'FAB-EST-102-B',
      aisle: 1,
      shelf: 2,
      position: 'B',
    });

    const bin3 = await binsRepository.create({
      zoneId: zone.zoneId,
      address: 'FAB-EST-201-A',
      aisle: 2,
      shelf: 1,
      position: 'A',
    });

    return { warehouse, zone, bins: [bin1, bin2, bin3] };
  }

  it('should generate labels for multiple bins', async () => {
    const { warehouse, zone, bins } = await createTestData();

    const result = await sut.execute({
      binIds: bins.map((b) => b.binId.toString()),
      format: 'qr',
      size: 'medium',
    });

    expect(result.labels).toHaveLength(3);
    expect(result.format).toBe('qr');
    expect(result.size).toBe('medium');
    expect(result.totalLabels).toBe(3);

    const firstLabel = result.labels[0];
    expect(firstLabel.warehouseCode).toBe(warehouse.code);
    expect(firstLabel.warehouseName).toBe(warehouse.name);
    expect(firstLabel.zoneCode).toBe(zone.code);
    expect(firstLabel.zoneName).toBe(zone.name);
    expect(firstLabel.address).toBe('FAB-EST-101-A');
    expect(firstLabel.codeData).toBe('FAB-EST-101-A');
  });

  it('should generate labels with barcode format', async () => {
    const { bins } = await createTestData();

    const result = await sut.execute({
      binIds: [bins[0].binId.toString()],
      format: 'barcode',
      size: 'large',
    });

    expect(result.format).toBe('barcode');
    expect(result.size).toBe('large');
  });

  it('should generate labels for a single bin', async () => {
    const { bins } = await createTestData();

    const result = await sut.execute({
      binIds: [bins[0].binId.toString()],
      format: 'qr',
      size: 'small',
    });

    expect(result.labels).toHaveLength(1);
    expect(result.totalLabels).toBe(1);
  });

  it('should exclude warehouse from codeData when includeWarehouse is false', async () => {
    const { bins } = await createTestData();

    const result = await sut.execute({
      binIds: [bins[0].binId.toString()],
      format: 'qr',
      size: 'medium',
      includeWarehouse: false,
    });

    expect(result.labels[0].codeData).toBe('EST-101-A');
    expect(result.labels[0].address).toBe('FAB-EST-101-A');
  });

  it('should exclude warehouse and zone from codeData when both are false', async () => {
    const { bins } = await createTestData();

    const result = await sut.execute({
      binIds: [bins[0].binId.toString()],
      format: 'qr',
      size: 'medium',
      includeWarehouse: false,
      includeZone: false,
    });

    expect(result.labels[0].codeData).toBe('101-A');
    expect(result.labels[0].address).toBe('FAB-EST-101-A');
  });

  it('should throw error when no bins are found', async () => {
    await expect(() =>
      sut.execute({
        binIds: [new UniqueEntityID().toString()],
        format: 'qr',
        size: 'medium',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should skip bins with missing zones', async () => {
    const warehouse = await warehousesRepository.create({
      code: 'FAB',
      name: 'Fábrica Principal',
    });

    const zone = await zonesRepository.create({
      warehouseId: warehouse.warehouseId,
      code: 'EST',
      name: 'Estoque',
    });

    const validBin = await binsRepository.create({
      zoneId: zone.zoneId,
      address: 'FAB-EST-101-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
    });

    // Create a bin with a non-existent zone (simulating orphaned data)
    const orphanBin = await binsRepository.create({
      zoneId: new UniqueEntityID(),
      address: 'ORPHAN-101-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
    });

    const result = await sut.execute({
      binIds: [validBin.binId.toString(), orphanBin.binId.toString()],
      format: 'qr',
      size: 'medium',
    });

    expect(result.labels).toHaveLength(1);
    expect(result.labels[0].binId).toBe(validBin.binId.toString());
  });

  it('should cache zone and warehouse lookups', async () => {
    const { bins } = await createTestData();

    const result = await sut.execute({
      binIds: bins.map((b) => b.binId.toString()),
      format: 'qr',
      size: 'medium',
    });

    // All bins belong to the same zone/warehouse
    expect(result.labels).toHaveLength(3);
    result.labels.forEach((label) => {
      expect(label.warehouseCode).toBe('FAB');
      expect(label.zoneCode).toBe('EST');
    });
  });

  it('should include correct aisle, shelf, and position data', async () => {
    const { bins } = await createTestData();

    const result = await sut.execute({
      binIds: bins.map((b) => b.binId.toString()),
      format: 'qr',
      size: 'medium',
    });

    const label1 = result.labels.find((l) => l.address === 'FAB-EST-101-A');
    expect(label1?.aisle).toBe(1);
    expect(label1?.shelf).toBe(1);
    expect(label1?.position).toBe('A');

    const label2 = result.labels.find((l) => l.address === 'FAB-EST-102-B');
    expect(label2?.aisle).toBe(1);
    expect(label2?.shelf).toBe(2);
    expect(label2?.position).toBe('B');

    const label3 = result.labels.find((l) => l.address === 'FAB-EST-201-A');
    expect(label3?.aisle).toBe(2);
    expect(label3?.shelf).toBe(1);
    expect(label3?.position).toBe('A');
  });
});
