import { InMemoryBomsRepository } from '@/repositories/production/in-memory/in-memory-boms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBomUseCase } from './create-bom';
import { ListBomsUseCase } from './list-boms';

let bomsRepository: InMemoryBomsRepository;
let createBom: CreateBomUseCase;
let sut: ListBomsUseCase;

describe('ListBomsUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    bomsRepository = new InMemoryBomsRepository();
    createBom = new CreateBomUseCase(bomsRepository);
    sut = new ListBomsUseCase(bomsRepository);
  });

  it('should list all BOMs for a tenant', async () => {
    await createBom.execute({
      tenantId: TENANT_ID,
      productId: 'product-1',
      version: '1.0',
      name: 'BOM 1',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: 'user-1',
    });

    await createBom.execute({
      tenantId: TENANT_ID,
      productId: 'product-2',
      version: '1.0',
      name: 'BOM 2',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: 'user-1',
    });

    const { boms } = await sut.execute({ tenantId: TENANT_ID });

    expect(boms).toHaveLength(2);
  });

  it('should filter by productId', async () => {
    await createBom.execute({
      tenantId: TENANT_ID,
      productId: 'product-1',
      version: '1.0',
      name: 'BOM Product 1',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: 'user-1',
    });

    await createBom.execute({
      tenantId: TENANT_ID,
      productId: 'product-2',
      version: '1.0',
      name: 'BOM Product 2',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: 'user-1',
    });

    const { boms } = await sut.execute({
      tenantId: TENANT_ID,
      productId: 'product-1',
    });

    expect(boms).toHaveLength(1);
    expect(boms[0].name).toBe('BOM Product 1');
  });

  it('should return empty array when no BOMs exist', async () => {
    const { boms } = await sut.execute({ tenantId: TENANT_ID });

    expect(boms).toHaveLength(0);
  });
});
