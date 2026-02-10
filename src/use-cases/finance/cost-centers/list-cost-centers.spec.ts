import { InMemoryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-cost-centers-repository';
import { beforeEach, describe, expect, it } from 'vitest';

import { ListCostCentersUseCase } from './list-cost-centers';

let repository: InMemoryCostCentersRepository;
let sut: ListCostCentersUseCase;

describe('ListCostCentersUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCostCentersRepository();
    sut = new ListCostCentersUseCase(repository);
  });

  it('should list cost centers', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      code: 'CC-001',
      name: 'Marketing',
    });

    await repository.create({
      tenantId: 'tenant-1',
      code: 'CC-002',
      name: 'Sales',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(result.costCenters).toHaveLength(2);
    expect(result.costCenters[0].name).toBe('Marketing');
    expect(result.costCenters[1].name).toBe('Sales');
  });

  it('should return empty array if no cost centers', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(result.costCenters).toHaveLength(0);
  });
});
