import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ZoneLayout } from '@/entities/stock/value-objects/zone-layout';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateZoneLayoutUseCase } from './update-zone-layout';

let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: UpdateZoneLayoutUseCase;

describe('UpdateZoneLayoutUseCase', () => {
  beforeEach(() => {
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new UpdateZoneLayoutUseCase(zonesRepository);
  });

  it('should update zone layout', async () => {
    const warehouse = await warehousesRepository.create({
      code: 'FAB',
      name: 'Main Warehouse',
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
    });

    const newLayout = ZoneLayout.create({
      aislePositions: [
        { aisleNumber: 1, x: 0, y: 0, rotation: 0 },
        { aisleNumber: 2, x: 200, y: 0, rotation: 0 },
      ],
      canvasWidth: 500,
      canvasHeight: 400,
      gridSize: 10,
    });

    const result = await sut.execute({
      zoneId: zone.zoneId.toString(),
      layout: newLayout.toJSON(),
    });

    expect(result.zone.layout).toBeDefined();
    expect(result.zone.layout?.aislePositions).toHaveLength(2);
  });

  it('should clear zone layout when layout is null', async () => {
    const warehouse = await warehousesRepository.create({
      code: 'FAB',
      name: 'Main Warehouse',
    });

    const layout = ZoneLayout.create({
      aislePositions: [{ aisleNumber: 1, x: 0, y: 0, rotation: 0 }],
      canvasWidth: 500,
      canvasHeight: 400,
      gridSize: 10,
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
      layout: layout.toJSON(),
    });

    expect(zone.layout).toBeDefined();

    const result = await sut.execute({
      zoneId: zone.zoneId.toString(),
      layout: null,
    });

    expect(result.zone.layout).toBeNull();
  });

  it('should throw when zone does not exist', async () => {
    await expect(() =>
      sut.execute({
        zoneId: new UniqueEntityID().toString(),
        layout: ZoneLayout.create({
          aislePositions: [{ aisleNumber: 1, x: 0, y: 0, rotation: 0 }],
          canvasWidth: 500,
          canvasHeight: 400,
          gridSize: 10,
        }).toJSON(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
