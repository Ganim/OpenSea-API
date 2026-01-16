import { InMemoryBinsRepository } from '@/repositories/stock/in-memory/in-memory-bins-repository';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { InMemoryZonesRepository } from '@/repositories/stock/in-memory/in-memory-zones-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ValidateAddressUseCase } from './validate-address';

let binsRepository: InMemoryBinsRepository;
let zonesRepository: InMemoryZonesRepository;
let warehousesRepository: InMemoryWarehousesRepository;
let sut: ValidateAddressUseCase;

describe('ValidateAddressUseCase', () => {
  beforeEach(() => {
    binsRepository = new InMemoryBinsRepository();
    zonesRepository = new InMemoryZonesRepository();
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new ValidateAddressUseCase(binsRepository);
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
      address: 'FAB-EST-102-B',
      aisle: 1,
      shelf: 2,
      position: 'B',
    });

    return { warehouse, zone, bin };
  }

  it('should validate and find an existing address', async () => {
    const { bin } = await createTestData();

    const result = await sut.execute({
      address: 'FAB-EST-102-B',
    });

    expect(result.valid).toBe(true);
    expect(result.exists).toBe(true);
    expect(result.binId).toBe(bin.binId.toString());
    expect(result.address).toBe('FAB-EST-102-B');
  });

  it('should validate address with different case', async () => {
    const { bin } = await createTestData();

    const result = await sut.execute({
      address: 'fab-est-102-b',
    });

    expect(result.valid).toBe(true);
    expect(result.exists).toBe(true);
    expect(result.binId).toBe(bin.binId.toString());
  });

  it('should return valid but not exists for non-existent address', async () => {
    await createTestData();

    const result = await sut.execute({
      address: 'FAB-EST-999-Z',
    });

    expect(result.valid).toBe(true);
    expect(result.exists).toBe(false);
    expect(result.binId).toBeNull();
  });

  it('should return invalid for malformed address', async () => {
    await createTestData();

    const result = await sut.execute({
      address: 'INVALID',
    });

    expect(result.valid).toBe(false);
    expect(result.exists).toBe(false);
    expect(result.binId).toBeNull();
    expect(result.error).toBeDefined();
  });

  it('should return invalid for address with wrong number of parts', async () => {
    await createTestData();

    const result = await sut.execute({
      address: 'FAB-EST-102',
    });

    expect(result.valid).toBe(false);
    expect(result.exists).toBe(false);
    expect(result.error).toContain('esperado 4 partes');
  });

  it('should return invalid for address with invalid warehouse code', async () => {
    await createTestData();

    const result = await sut.execute({
      address: 'F-EST-102-B',
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Código do armazém inválido');
  });

  it('should trim whitespace from address', async () => {
    const { bin } = await createTestData();

    const result = await sut.execute({
      address: '  FAB-EST-102-B  ',
    });

    expect(result.valid).toBe(true);
    expect(result.exists).toBe(true);
    expect(result.binId).toBe(bin.binId.toString());
  });

  it('should validate address with different separators', async () => {
    const warehouse = await warehousesRepository.create({
      code: 'WH2',
      name: 'Warehouse 2',
    });

    const zone = await zonesRepository.create({
      warehouseId: warehouse.warehouseId,
      code: 'ZN1',
      name: 'Zone 1',
    });

    await binsRepository.create({
      zoneId: zone.zoneId,
      address: 'WH2.ZN1.101.A',
      aisle: 1,
      shelf: 1,
      position: 'A',
    });

    const result = await sut.execute({
      address: 'WH2.ZN1.101.A',
    });

    expect(result.valid).toBe(true);
    expect(result.exists).toBe(true);
  });
});
