import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryBomsRepository } from '@/repositories/production/in-memory/in-memory-boms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBomUseCase } from './create-bom';

let bomsRepository: InMemoryBomsRepository;
let sut: CreateBomUseCase;

describe('CreateBomUseCase', () => {
  const TENANT_ID = 'tenant-1';
  const PRODUCT_ID = 'product-1';
  const CREATED_BY = 'user-1';

  beforeEach(() => {
    bomsRepository = new InMemoryBomsRepository();
    sut = new CreateBomUseCase(bomsRepository);
  });

  it('should create a BOM', async () => {
    const { bom } = await sut.execute({
      tenantId: TENANT_ID,
      productId: PRODUCT_ID,
      version: '1.0',
      name: 'Main BOM',
      description: 'Primary bill of materials',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: CREATED_BY,
    });

    expect(bom.id.toString()).toEqual(expect.any(String));
    expect(bom.name).toBe('Main BOM');
    expect(bom.version).toBe('1.0');
    expect(bom.status).toBe('DRAFT');
    expect(bom.baseQuantity).toBe(1);
    expect(bom.description).toBe('Primary bill of materials');
  });

  it('should create a BOM with isDefault true', async () => {
    const { bom } = await sut.execute({
      tenantId: TENANT_ID,
      productId: PRODUCT_ID,
      version: '1.0',
      name: 'Default BOM',
      isDefault: true,
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: CREATED_BY,
    });

    expect(bom.isDefault).toBe(true);
  });

  it('should create a BOM with validUntil', async () => {
    const validUntil = new Date('2027-12-31');
    const { bom } = await sut.execute({
      tenantId: TENANT_ID,
      productId: PRODUCT_ID,
      version: '1.0',
      name: 'Seasonal BOM',
      baseQuantity: 10,
      validFrom: new Date('2026-01-01'),
      validUntil,
      createdById: CREATED_BY,
    });

    expect(bom.validUntil).toEqual(validUntil);
  });

  it('should not allow duplicate [productId, version] per tenant', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      productId: PRODUCT_ID,
      version: '1.0',
      name: 'BOM v1',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: CREATED_BY,
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        productId: PRODUCT_ID,
        version: '1.0',
        name: 'BOM v1 duplicate',
        baseQuantity: 1,
        validFrom: new Date('2026-01-01'),
        createdById: CREATED_BY,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should allow same version for different products', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      productId: 'product-1',
      version: '1.0',
      name: 'BOM Product 1',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: CREATED_BY,
    });

    const { bom } = await sut.execute({
      tenantId: TENANT_ID,
      productId: 'product-2',
      version: '1.0',
      name: 'BOM Product 2',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: CREATED_BY,
    });

    expect(bom.id.toString()).toEqual(expect.any(String));
  });

  it('should allow different versions for same product', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      productId: PRODUCT_ID,
      version: '1.0',
      name: 'BOM v1',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: CREATED_BY,
    });

    const { bom } = await sut.execute({
      tenantId: TENANT_ID,
      productId: PRODUCT_ID,
      version: '2.0',
      name: 'BOM v2',
      baseQuantity: 1,
      validFrom: new Date('2026-06-01'),
      createdById: CREATED_BY,
    });

    expect(bom.version).toBe('2.0');
  });
});
