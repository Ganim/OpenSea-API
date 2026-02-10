import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-cost-centers-repository';
import { beforeEach, describe, expect, it } from 'vitest';

import { GetCostCenterByIdUseCase } from './get-cost-center-by-id';

let repository: InMemoryCostCentersRepository;
let sut: GetCostCenterByIdUseCase;

describe('GetCostCenterByIdUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCostCentersRepository();
    sut = new GetCostCenterByIdUseCase(repository);
  });

  it('should get a cost center by id', async () => {
    const costCenter = await repository.create({
      tenantId: 'tenant-1',
      code: 'CC-001',
      name: 'Marketing',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: costCenter.id.toString(),
    });

    expect(result.costCenter).toBeDefined();
    expect(result.costCenter.id).toBe(costCenter.id.toString());
    expect(result.costCenter.code).toBe('CC-001');
    expect(result.costCenter.name).toBe('Marketing');
  });

  it('should throw ResourceNotFoundError if not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
