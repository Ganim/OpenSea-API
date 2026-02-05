import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ZoneStructure } from '@/entities/stock/value-objects/zone-structure';
import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryItemMovementsRepository } from '@/repositories/stock/in-memory/in-memory-item-movements-repository';
import { InMemoryItemsRepository } from '@/repositories/stock/in-memory/in-memory-items-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ConfigureZoneStructureUseCase } from './configure-zone-structure';

let zonesRepository: InMemoryZonesRepository;
let binsRepository: InMemoryBinsRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let itemsRepository: InMemoryItemsRepository;
let itemMovementsRepository: InMemoryItemMovementsRepository;
let sut: ConfigureZoneStructureUseCase;

describe('ConfigureZoneStructureUseCase', () => {
  beforeEach(() => {
    zonesRepository = new InMemoryZonesRepository();
    binsRepository = new InMemoryBinsRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    itemsRepository = new InMemoryItemsRepository();
    itemMovementsRepository = new InMemoryItemMovementsRepository();
    sut = new ConfigureZoneStructureUseCase(
      zonesRepository,
      binsRepository,
      warehousesRepository,
      itemsRepository,
      itemMovementsRepository,
    );
  });

  it('should generate bins using independent aisle configurations', async () => {
    const warehouse = await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'FAB',
      name: 'Main Warehouse',
    });

    const zone = await zonesRepository.create({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId,
      code: 'Z1',
      name: 'Zone 1',
      structure: ZoneStructure.empty().toJSON(),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      zoneId: zone.zoneId.toString(),
      regenerateBins: true,
      structure: {
        aisles: 2,
        shelvesPerAisle: 10,
        binsPerShelf: 5,
        aisleConfigs: [
          { aisleNumber: 1, shelvesCount: 10, binsPerShelf: 5 },
          { aisleNumber: 2, shelvesCount: 3, binsPerShelf: 2 },
        ],
        codePattern: {
          separator: '-',
          aisleDigits: 1,
          shelfDigits: 2,
          binLabeling: 'LETTERS',
          binDirection: 'BOTTOM_UP',
        },
      },
    });

    expect(result.binsCreated).toBe(56);
    expect(result.binsDeleted).toBe(0);
    expect(binsRepository.bins).toHaveLength(56);
    expect(result.zone.structure.aisleConfigs).toHaveLength(2);
    expect(result.zone.structure.aisles).toBe(2);
    expect(result.zone.structure.shelvesPerAisle).toBe(10);
    expect(result.zone.structure.binsPerShelf).toBe(5);
    expect(result.zone.structure.totalBins).toBe(56);
  });

  it('should reject duplicated aisle numbers', async () => {
    const warehouse = await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'FAB',
      name: 'Main Warehouse',
    });

    const zone = await zonesRepository.create({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId,
      code: 'Z2',
      name: 'Zone 2',
      structure: ZoneStructure.empty().toJSON(),
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        zoneId: zone.zoneId.toString(),
        regenerateBins: true,
        structure: {
          aisles: 2,
          shelvesPerAisle: 10,
          binsPerShelf: 5,
          aisleConfigs: [
            { aisleNumber: 1, shelvesCount: 10, binsPerShelf: 5 },
            { aisleNumber: 1, shelvesCount: 3, binsPerShelf: 2 },
          ],
          codePattern: ZoneStructure.empty().codePattern.toJSON(),
        },
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when zone does not exist', async () => {
    await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'FAB',
      name: 'Main Warehouse',
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        zoneId: new UniqueEntityID().toString(),
        structure: {
          aisles: 1,
          shelvesPerAisle: 1,
          binsPerShelf: 1,
          codePattern: ZoneStructure.empty().codePattern.toJSON(),
        },
      }),
    ).rejects.toThrowError();
  });
});
