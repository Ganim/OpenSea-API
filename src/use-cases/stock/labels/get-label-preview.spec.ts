import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetLabelPreviewUseCase } from './get-label-preview';

let binsRepository: InMemoryBinsRepository;
let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: GetLabelPreviewUseCase;

describe('GetLabelPreviewUseCase', () => {
  beforeEach(() => {
    binsRepository = new InMemoryBinsRepository();
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new GetLabelPreviewUseCase(
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

    const bin = await binsRepository.create({
      zoneId: zone.zoneId,
      address: 'FAB-EST-101-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
      capacity: 100,
      currentOccupancy: 25,
    });

    return { warehouse, zone, bin };
  }

  it('should get label preview for a bin', async () => {
    const { warehouse, zone, bin } = await createTestData();

    const result = await sut.execute({
      binId: bin.binId.toString(),
    });

    expect(result.preview).toBeDefined();
    expect(result.preview.binId).toBe(bin.binId.toString());
    expect(result.preview.address).toBe('FAB-EST-101-A');
    expect(result.preview.warehouseCode).toBe(warehouse.code);
    expect(result.preview.warehouseName).toBe(warehouse.name);
    expect(result.preview.zoneCode).toBe(zone.code);
    expect(result.preview.zoneName).toBe(zone.name);
    expect(result.preview.aisle).toBe(1);
    expect(result.preview.shelf).toBe(1);
    expect(result.preview.position).toBe('A');
    expect(result.preview.codeData).toBe('FAB-EST-101-A');
  });

  it('should include occupancy information', async () => {
    const { bin } = await createTestData();

    const result = await sut.execute({
      binId: bin.binId.toString(),
    });

    expect(result.preview.occupancy).toBeDefined();
    expect(result.preview.occupancy.current).toBe(25);
    expect(result.preview.occupancy.capacity).toBe(100);
  });

  it('should handle bin without capacity', async () => {
    const warehouse = await warehousesRepository.create({
      code: 'FAB',
      name: 'Fábrica Principal',
    });

    const zone = await zonesRepository.create({
      warehouseId: warehouse.warehouseId,
      code: 'EST',
      name: 'Estoque',
    });

    const bin = await binsRepository.create({
      zoneId: zone.zoneId,
      address: 'FAB-EST-102-B',
      aisle: 1,
      shelf: 2,
      position: 'B',
    });

    const result = await sut.execute({
      binId: bin.binId.toString(),
    });

    expect(result.preview.occupancy.capacity).toBeNull();
    expect(result.preview.occupancy.current).toBe(0);
  });

  it('should throw error when bin is not found', async () => {
    await expect(() =>
      sut.execute({
        binId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw error when zone is not found', async () => {
    const bin = await binsRepository.create({
      zoneId: new UniqueEntityID(),
      address: 'ORPHAN-101-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
    });

    await expect(() =>
      sut.execute({
        binId: bin.binId.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw error when warehouse is not found', async () => {
    const zone = await zonesRepository.create({
      warehouseId: new UniqueEntityID(),
      code: 'ORPHAN',
      name: 'Zona Órfã',
    });

    const bin = await binsRepository.create({
      zoneId: zone.zoneId,
      address: 'ORPHAN-101-A',
      aisle: 1,
      shelf: 1,
      position: 'A',
    });

    await expect(() =>
      sut.execute({
        binId: bin.binId.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
