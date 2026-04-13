import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBomsRepository } from '@/repositories/production/in-memory/in-memory-boms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBomUseCase } from './create-bom';
import { GetBomByIdUseCase } from './get-bom-by-id';

let bomsRepository: InMemoryBomsRepository;
let createBom: CreateBomUseCase;
let sut: GetBomByIdUseCase;

describe('GetBomByIdUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    bomsRepository = new InMemoryBomsRepository();
    createBom = new CreateBomUseCase(bomsRepository);
    sut = new GetBomByIdUseCase(bomsRepository);
  });

  it('should get a BOM by id', async () => {
    const { bom: created } = await createBom.execute({
      tenantId: TENANT_ID,
      productId: 'product-1',
      version: '1.0',
      name: 'Test BOM',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: 'user-1',
    });

    const { bom } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
    });

    expect(bom.name).toBe('Test BOM');
    expect(bom.version).toBe('1.0');
  });

  it('should throw if BOM not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
