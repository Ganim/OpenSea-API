import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryWarehousesRepository } from '@/repositories/stock/in-memory/in-memory-warehouses-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateWarehouseUseCase } from './create-warehouse';

let warehousesRepository: InMemoryWarehousesRepository;
let sut: CreateWarehouseUseCase;

describe('CreateWarehouseUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    warehousesRepository = new InMemoryWarehousesRepository();
    sut = new CreateWarehouseUseCase(warehousesRepository);
  });

  it('should create a warehouse with minimal data', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      code: 'FAB',
      name: 'Fábrica Principal',
    });

    expect(result.warehouse).toBeDefined();
    expect(result.warehouse.code).toBe('FAB');
    expect(result.warehouse.name).toBe('Fábrica Principal');
    expect(result.warehouse.isActive).toBe(true);
  });

  it('should create a warehouse with all optional fields', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      code: 'FAB',
      name: 'Fábrica Principal',
      description: 'Fábrica principal de produção',
      address: 'Rua Industrial, 123',
      isActive: true,
    });

    expect(result.warehouse.description).toBe('Fábrica principal de produção');
    expect(result.warehouse.address).toBe('Rua Industrial, 123');
  });

  it('should create an inactive warehouse', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      code: 'OLD',
      name: 'Armazém Antigo',
      isActive: false,
    });

    expect(result.warehouse.isActive).toBe(false);
  });

  it('should normalize code to uppercase', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      code: 'fab',
      name: 'Fábrica',
    });

    expect(result.warehouse.code).toBe('FAB');
  });

  it('should accept 2-character code', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      code: 'WH',
      name: 'Warehouse',
    });

    expect(result.warehouse.code).toBe('WH');
  });

  it('should accept 5-character code', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      code: 'FABRI',
      name: 'Fábrica',
    });

    expect(result.warehouse.code).toBe('FABRI');
  });

  it('should fail when code is too short', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'F',
        name: 'Fábrica',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail when code is too long', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'FABRIC',
        name: 'Fábrica',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail when code already exists', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      code: 'FAB',
      name: 'Fábrica 1',
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'FAB',
        name: 'Fábrica 2',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should fail when code already exists (case insensitive)', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      code: 'FAB',
      name: 'Fábrica 1',
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        code: 'fab',
        name: 'Fábrica 2',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should assign unique IDs to different warehouses', async () => {
    const result1 = await sut.execute({
      tenantId: TENANT_ID,
      code: 'WH1',
      name: 'Warehouse 1',
    });

    const result2 = await sut.execute({
      tenantId: TENANT_ID,
      code: 'WH2',
      name: 'Warehouse 2',
    });

    expect(result1.warehouse.warehouseId.toString()).not.toBe(
      result2.warehouse.warehouseId.toString(),
    );
  });
});
