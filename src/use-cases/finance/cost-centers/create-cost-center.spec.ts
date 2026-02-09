import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-cost-centers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateCostCenterUseCase } from './create-cost-center';

let repository: InMemoryCostCentersRepository;
let sut: CreateCostCenterUseCase;

describe('CreateCostCenterUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryCostCentersRepository();
    sut = new CreateCostCenterUseCase(repository);
  });

  it('should create a cost center', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      code: 'CC-001',
      name: 'Marketing',
    });

    expect(result.costCenter).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        code: 'CC-001',
        name: 'Marketing',
        isActive: true,
      }),
    );
  });

  it('should create a cost center with all fields', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      code: 'CC-002',
      name: 'Engineering',
      description: 'Engineering department',
      monthlyBudget: 50000,
      annualBudget: 600000,
      isActive: true,
    });

    expect(result.costCenter.description).toBe('Engineering department');
    expect(result.costCenter.monthlyBudget).toBe(50000);
    expect(result.costCenter.annualBudget).toBe(600000);
  });

  it('should not create with empty name', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', code: 'CC-001', name: '' }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create with empty code', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', code: '', name: 'Marketing' }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create with duplicate code', async () => {
    await sut.execute({ tenantId: 'tenant-1', code: 'CC-001', name: 'Marketing' });

    await expect(
      sut.execute({ tenantId: 'tenant-1', code: 'CC-001', name: 'Sales' }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should create inactive cost center', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      code: 'CC-003',
      name: 'Legacy',
      isActive: false,
    });

    expect(result.costCenter.isActive).toBe(false);
  });
});
