import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetZoneByIdUseCase } from './get-zone-by-id';

let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: GetZoneByIdUseCase;

describe('GetZoneByIdUseCase', () => {
  beforeEach(() => {
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new GetZoneByIdUseCase(zonesRepository, warehousesRepository);
  });

  async function createTestZone() {
    const warehouse = await warehousesRepository.create({
      code: 'FAB',
      name: 'Fábrica Principal',
    });

    const zone = await zonesRepository.create({
      warehouseId: warehouse.warehouseId,
      code: 'EST',
      name: 'Estoque',
      description: 'Descrição da zona',
    });

    return { warehouse, zone };
  }

  it('should get zone by id', async () => {
    const { warehouse, zone } = await createTestZone();

    const result = await sut.execute({
      id: zone.zoneId.toString(),
    });

    expect(result.zone).toBeDefined();
    expect(result.zone.code).toBe('EST');
    expect(result.zone.name).toBe('Estoque');
    expect(result.zone.description).toBe('Descrição da zona');
    expect(result.warehouse.code).toBe(warehouse.code);
  });

  it('should include warehouse information', async () => {
    const { warehouse, zone } = await createTestZone();

    const result = await sut.execute({
      id: zone.zoneId.toString(),
    });

    expect(result.warehouse).toBeDefined();
    expect(result.warehouse.code).toBe(warehouse.code);
    expect(result.warehouse.name).toBe(warehouse.name);
  });

  it('should include bin count', async () => {
    const { zone } = await createTestZone();

    const result = await sut.execute({
      id: zone.zoneId.toString(),
    });

    expect(result.binCount).toBe(0);
  });

  it('should include bin count when bins exist', async () => {
    const { zone } = await createTestZone();

    vi.spyOn(zonesRepository, 'countBins').mockResolvedValue(15);

    const result = await sut.execute({
      id: zone.zoneId.toString(),
    });

    expect(result.binCount).toBe(15);
  });

  it('should fail when zone is not found', async () => {
    await expect(() =>
      sut.execute({
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should fail when warehouse is not found (orphan zone)', async () => {
    const zone = await zonesRepository.create({
      warehouseId: new UniqueEntityID(),
      code: 'ORPHAN',
      name: 'Zona Órfã',
    });

    await expect(() =>
      sut.execute({
        id: zone.zoneId.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not find deleted zone', async () => {
    const { zone } = await createTestZone();

    await zonesRepository.delete(zone.zoneId);

    await expect(() =>
      sut.execute({
        id: zone.zoneId.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
