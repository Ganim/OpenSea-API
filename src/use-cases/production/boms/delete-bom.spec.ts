import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBomsRepository } from '@/repositories/production/in-memory/in-memory-boms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBomUseCase } from './create-bom';
import { DeleteBomUseCase } from './delete-bom';

let bomsRepository: InMemoryBomsRepository;
let createBom: CreateBomUseCase;
let sut: DeleteBomUseCase;

describe('DeleteBomUseCase', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    bomsRepository = new InMemoryBomsRepository();
    createBom = new CreateBomUseCase(bomsRepository);
    sut = new DeleteBomUseCase(bomsRepository);
  });

  it('should delete a BOM', async () => {
    const { bom } = await createBom.execute({
      tenantId: TENANT_ID,
      productId: 'product-1',
      version: '1.0',
      name: 'BOM to delete',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: 'user-1',
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: bom.id.toString(),
    });

    expect(result.message).toBe('BOM deleted successfully.');
    expect(bomsRepository.items).toHaveLength(0);
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
