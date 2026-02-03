import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateZoneUseCase } from './create-zone';

let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: CreateZoneUseCase;

describe('CreateZoneUseCase', () => {
  beforeEach(() => {
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new CreateZoneUseCase(zonesRepository, warehousesRepository);
  });

  async function createTestWarehouse() {
    return warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'FAB',
      name: 'Fábrica Principal',
    });
  }

  it('should create a zone with minimal data', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId.toString(),
      code: 'EST',
      name: 'Estoque',
    });

    expect(result.zone).toBeDefined();
    expect(result.zone.code).toBe('EST');
    expect(result.zone.name).toBe('Estoque');
    expect(result.zone.warehouseId.equals(warehouse.warehouseId)).toBe(true);
    expect(result.zone.isActive).toBe(true);
  });

  it('should create a zone with description', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId.toString(),
      code: 'EST',
      name: 'Estoque',
      description: 'Zona de estoque geral',
    });

    expect(result.zone.description).toBe('Zona de estoque geral');
  });

  it('should create an inactive zone', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId.toString(),
      code: 'OLD',
      name: 'Zona Antiga',
      isActive: false,
    });

    expect(result.zone.isActive).toBe(false);
  });

  it('should create a zone with structure', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId.toString(),
      code: 'EST',
      name: 'Estoque',
      structure: {
        aisles: 10,
        shelvesPerAisle: 5,
        binsPerShelf: 4,
      },
    });

    expect(result.zone.structure.aisles).toBe(10);
    expect(result.zone.structure.shelvesPerAisle).toBe(5);
    expect(result.zone.structure.binsPerShelf).toBe(4);
  });

  it('should normalize aggregate fields when aisleConfigs are provided', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId.toString(),
      code: 'EST',
      name: 'Estoque',
      structure: {
        aisles: 1,
        shelvesPerAisle: 1,
        binsPerShelf: 1,
        aisleConfigs: [
          { aisleNumber: 1, shelvesCount: 10, binsPerShelf: 5 },
          { aisleNumber: 2, shelvesCount: 3, binsPerShelf: 2 },
        ],
      },
    });

    expect(result.zone.structure.aisleConfigs).toHaveLength(2);
    expect(result.zone.structure.aisles).toBe(2);
    expect(result.zone.structure.shelvesPerAisle).toBe(10);
    expect(result.zone.structure.binsPerShelf).toBe(5);
    expect(result.zone.structure.totalBins).toBe(56);
  });

  it('should normalize code to uppercase', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId.toString(),
      code: 'est',
      name: 'Estoque',
    });

    expect(result.zone.code).toBe('EST');
  });

  it('should accept 2-character code', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId.toString(),
      code: 'AB',
      name: 'Zone AB',
    });

    expect(result.zone.code).toBe('AB');
  });

  it('should accept 5-character code', async () => {
    const warehouse = await createTestWarehouse();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId.toString(),
      code: 'ESTQE',
      name: 'Estoque',
    });

    expect(result.zone.code).toBe('ESTQE');
  });

  it('should fail when code is too short', async () => {
    const warehouse = await createTestWarehouse();

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        warehouseId: warehouse.warehouseId.toString(),
        code: 'E',
        name: 'Estoque',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail when code is too long', async () => {
    const warehouse = await createTestWarehouse();

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        warehouseId: warehouse.warehouseId.toString(),
        code: 'ESTOQU',
        name: 'Estoque',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail when warehouse does not exist', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        warehouseId: new UniqueEntityID().toString(),
        code: 'EST',
        name: 'Estoque',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should fail when code already exists in same warehouse', async () => {
    const warehouse = await createTestWarehouse();

    await sut.execute({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId.toString(),
      code: 'EST',
      name: 'Estoque 1',
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        warehouseId: warehouse.warehouseId.toString(),
        code: 'EST',
        name: 'Estoque 2',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow same code in different warehouses', async () => {
    const warehouse1 = await createTestWarehouse();
    const warehouse2 = await warehousesRepository.create({
      tenantId: 'tenant-1',
      code: 'WH2',
      name: 'Warehouse 2',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      warehouseId: warehouse1.warehouseId.toString(),
      code: 'EST',
      name: 'Estoque FAB',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      warehouseId: warehouse2.warehouseId.toString(),
      code: 'EST',
      name: 'Estoque WH2',
    });

    expect(result.zone.code).toBe('EST');
  });

  it('should fail when aisles exceed maximum', async () => {
    const warehouse = await createTestWarehouse();

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        warehouseId: warehouse.warehouseId.toString(),
        code: 'EST',
        name: 'Estoque',
        structure: { aisles: 100 },
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail when shelvesPerAisle exceed maximum', async () => {
    const warehouse = await createTestWarehouse();

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        warehouseId: warehouse.warehouseId.toString(),
        code: 'EST',
        name: 'Estoque',
        structure: { shelvesPerAisle: 1000 },
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail when binsPerShelf exceed maximum', async () => {
    const warehouse = await createTestWarehouse();

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        warehouseId: warehouse.warehouseId.toString(),
        code: 'EST',
        name: 'Estoque',
        structure: { binsPerShelf: 27 },
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail when aisles is negative', async () => {
    const warehouse = await createTestWarehouse();

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        warehouseId: warehouse.warehouseId.toString(),
        code: 'EST',
        name: 'Estoque',
        structure: { aisles: -1 },
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
