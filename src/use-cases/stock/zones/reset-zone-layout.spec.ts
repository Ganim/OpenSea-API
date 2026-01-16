import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ZoneLayout } from '@/entities/stock/value-objects/zone-layout';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ResetZoneLayoutUseCase } from './reset-zone-layout';

let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: ResetZoneLayoutUseCase;

describe('ResetZoneLayoutUseCase', () => {
  beforeEach(() => {
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new ResetZoneLayoutUseCase(zonesRepository);
  });

  it('should reset zone layout to null', async () => {
    const warehouse = await warehousesRepository.create({
      code: 'FAB',
      name: 'Main Warehouse',
    });

    const layout = ZoneLayout.create({
      aislePositions: [
        { aisleNumber: 1, x: 0, y: 0, rotation: 0 },
        { aisleNumber: 2, x: 200, y: 0, rotation: 0 },
      ],
      canvasWidth: 500,
      canvasHeight: 400,
      gridSize: 10,
    });

    const zone = await zonesRepository.create({
      warehouseId: warehouse.warehouseId,
      code: 'Z1',
      name: 'Zone 1',
      structure: ZoneStructure.create({
        aisles: 2,
        shelvesPerAisle: 5,
        binsPerShelf: 4,
      }).toJSON(),
      layout: layout.toJSON(),
    });

    expect(zone.layout).toBeDefined();

    const result = await sut.execute({
      zoneId: zone.zoneId.toString(),
    });

    expect(result.zone.layout).toBeNull();
  });

  it('should handle reset when layout is already null', async () => {
    const warehouse = await warehousesRepository.create({
      code: 'FAB',
      name: 'Main Warehouse',
    });

    const zone = await zonesRepository.create({
      warehouseId: warehouse.warehouseId,
      code: 'Z2',
      name: 'Zone 2',
      structure: ZoneStructure.create({
        aisles: 1,
        shelvesPerAisle: 5,
        binsPerShelf: 4,
      }).toJSON(),
    });

    expect(zone.layout).toBeNull();

    const result = await sut.execute({
      zoneId: zone.zoneId.toString(),
    });

    expect(result.zone.layout).toBeNull();
  });

  it('should throw when zone does not exist', async () => {
    await warehousesRepository.create({ code: 'FAB', name: 'Main Warehouse' });

    await expect(() =>
      sut.execute({
        zoneId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
