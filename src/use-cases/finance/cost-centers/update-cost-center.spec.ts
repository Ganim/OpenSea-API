import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-cost-centers-repository';
import { beforeEach, describe, expect, it } from 'vitest';

import { UpdateCostCenterUseCase } from './update-cost-center';

let repository: InMemoryCostCentersRepository;
let sut: UpdateCostCenterUseCase;

describe('UpdateCostCenterUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCostCentersRepository();
    sut = new UpdateCostCenterUseCase(repository);
  });

  it('should update a cost center name', async () => {
    const costCenter = await repository.create({
      tenantId: 'tenant-1',
      code: 'CC-001',
      name: 'Marketing',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: costCenter.id.toString(),
      name: 'Marketing and Sales',
    });

    expect(result.costCenter).toBeDefined();
    expect(result.costCenter.name).toBe('Marketing and Sales');
    expect(result.costCenter.code).toBe('CC-001');
  });

  it('should throw ResourceNotFoundError if cost center not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: new UniqueEntityID().toString(),
        name: 'Updated Name',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError if name is empty', async () => {
    const costCenter = await repository.create({
      tenantId: 'tenant-1',
      code: 'CC-001',
      name: 'Marketing',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: costCenter.id.toString(),
        name: '',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError if code already exists', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      code: 'CC-001',
      name: 'Marketing',
    });

    const costCenter2 = await repository.create({
      tenantId: 'tenant-1',
      code: 'CC-002',
      name: 'Sales',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: costCenter2.id.toString(),
        code: 'CC-001',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
