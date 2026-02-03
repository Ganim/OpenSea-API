import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateZoneUseCase } from './update-zone';

let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: UpdateZoneUseCase;

describe('UpdateZoneUseCase', () => {
  beforeEach(() => {
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new UpdateZoneUseCase(zonesRepository);
  });

  async function createTestZone() {
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
      description: 'Descrição original',
      isActive: true,
    });

    return { warehouse, zone };
  }

  it('should update zone name', async () => {
    const { zone } = await createTestZone();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: zone.zoneId.toString(),
      name: 'Novo Nome',
    });

    expect(result.zone.name).toBe('Novo Nome');
    expect(result.zone.code).toBe('EST');
  });

  it('should update zone code', async () => {
    const { zone } = await createTestZone();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: zone.zoneId.toString(),
      code: 'NEW',
    });

    expect(result.zone.code).toBe('NEW');
  });

  it('should update zone description', async () => {
    const { zone } = await createTestZone();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: zone.zoneId.toString(),
      description: 'Nova descrição',
    });

    expect(result.zone.description).toBe('Nova descrição');
  });

  it('should clear zone description with null', async () => {
    const { zone } = await createTestZone();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: zone.zoneId.toString(),
      description: null,
    });

    expect(result.zone.description).toBeNull();
  });

  it('should update zone active status', async () => {
    const { zone } = await createTestZone();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: zone.zoneId.toString(),
      isActive: false,
    });

    expect(result.zone.isActive).toBe(false);
  });

  it('should update multiple fields at once', async () => {
    const { zone } = await createTestZone();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: zone.zoneId.toString(),
      name: 'Novo Nome',
      description: 'Nova descrição',
      isActive: false,
    });

    expect(result.zone.name).toBe('Novo Nome');
    expect(result.zone.description).toBe('Nova descrição');
    expect(result.zone.isActive).toBe(false);
  });

  it('should fail when zone is not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: new UniqueEntityID().toString(),
        name: 'Novo Nome',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should fail when new code is too short', async () => {
    const { zone } = await createTestZone();

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: zone.zoneId.toString(),
        code: 'E',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail when new code is too long', async () => {
    const { zone } = await createTestZone();

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: zone.zoneId.toString(),
        code: 'ESTOQU',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail when new code already exists in same warehouse', async () => {
    const { warehouse, zone } = await createTestZone();

    await zonesRepository.create({
      tenantId: 'tenant-1',
      warehouseId: warehouse.warehouseId,
      code: 'ZN2',
      name: 'Zona 2',
    });

    await expect(() =>
      sut.execute({
        tenantId: 'tenant-1',
        id: zone.zoneId.toString(),
        code: 'ZN2',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow keeping same code', async () => {
    const { zone } = await createTestZone();

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: zone.zoneId.toString(),
      code: 'EST',
      name: 'Novo Nome',
    });

    expect(result.zone.code).toBe('EST');
    expect(result.zone.name).toBe('Novo Nome');
  });
});
