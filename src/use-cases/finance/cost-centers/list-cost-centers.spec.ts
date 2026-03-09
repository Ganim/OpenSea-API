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

  it('should list cost centers with pagination', async () => {
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
    expect(result.meta).toEqual({
      total: 2,
      page: 1,
      limit: 20,
      pages: 1,
    });
  });

  it('should return empty array if no cost centers', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(result.costCenters).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('should paginate results', async () => {
    for (let i = 1; i <= 5; i++) {
      await repository.create({
        tenantId: 'tenant-1',
        code: `CC-${String(i).padStart(3, '0')}`,
        name: `Cost Center ${i}`,
      });
    }

    const page1 = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 2,
    });

    expect(page1.costCenters).toHaveLength(2);
    expect(page1.meta).toEqual({
      total: 5,
      page: 1,
      limit: 2,
      pages: 3,
    });

    const page3 = await sut.execute({
      tenantId: 'tenant-1',
      page: 3,
      limit: 2,
    });

    expect(page3.costCenters).toHaveLength(1);
    expect(page3.meta.page).toBe(3);
  });

  it('should cap limit at 100', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      limit: 500,
    });

    expect(result.meta.limit).toBe(100);
  });
});
