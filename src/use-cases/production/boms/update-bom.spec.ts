import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBomsRepository } from '@/repositories/production/in-memory/in-memory-boms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBomUseCase } from './create-bom';
import { UpdateBomUseCase } from './update-bom';

let bomsRepository: InMemoryBomsRepository;
let createBom: CreateBomUseCase;
let sut: UpdateBomUseCase;

describe('UpdateBomUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    bomsRepository = new InMemoryBomsRepository();
    createBom = new CreateBomUseCase(bomsRepository);
    sut = new UpdateBomUseCase(bomsRepository);
  });

  it('should update a BOM', async () => {
    const { bom: created } = await createBom.execute({
      tenantId: TENANT_ID,
      productId: 'product-1',
      version: '1.0',
      name: 'Original Name',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: 'user-1',
    });

    const { bom } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      name: 'Updated Name',
      baseQuantity: 5,
    });

    expect(bom.name).toBe('Updated Name');
    expect(bom.baseQuantity).toBe(5);
  });

  it('should update description to null', async () => {
    const { bom: created } = await createBom.execute({
      tenantId: TENANT_ID,
      productId: 'product-1',
      version: '1.0',
      name: 'BOM',
      description: 'Some description',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: 'user-1',
    });

    const { bom } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.id.toString(),
      description: null,
    });

    expect(bom.description).toBeNull();
  });

  it('should throw if BOM not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
        name: 'New Name',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
