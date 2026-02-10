import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-cost-centers-repository';
import { beforeEach, describe, expect, it } from 'vitest';

import { DeleteCostCenterUseCase } from './delete-cost-center';

let repository: InMemoryCostCentersRepository;
let sut: DeleteCostCenterUseCase;

describe('DeleteCostCenterUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCostCentersRepository();
    sut = new DeleteCostCenterUseCase(repository);
  });

  it('should delete a cost center', async () => {
    const costCenter = await repository.create({
      tenantId: 'tenant-1',
      code: 'CC-001',
      name: 'Marketing',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      id: costCenter.id.toString(),
    });

    const result = await repository.findById(
      costCenter.id,
      'tenant-1',
    );

    expect(result).toBeNull();
  });

  it('should throw ResourceNotFoundError if cost center not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
