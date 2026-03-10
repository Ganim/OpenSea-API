import { InMemoryRecurringConfigsRepository } from '@/repositories/finance/in-memory/in-memory-recurring-configs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListRecurringConfigsUseCase } from './list-recurring-configs';

let recurringConfigsRepository: InMemoryRecurringConfigsRepository;
let sut: ListRecurringConfigsUseCase;

describe('ListRecurringConfigsUseCase', () => {
  beforeEach(async () => {
    recurringConfigsRepository = new InMemoryRecurringConfigsRepository();
    sut = new ListRecurringConfigsUseCase(recurringConfigsRepository);

    // Seed test data
    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel mensal',
      categoryId: 'cat-1',
      expectedAmount: 2500,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-04-01'),
    });
    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      description: 'Mensalidade cliente',
      categoryId: 'cat-2',
      expectedAmount: 1000,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-04-01'),
    });
    await recurringConfigsRepository.create({
      tenantId: 'tenant-2',
      type: 'PAYABLE',
      description: 'Outro tenant',
      categoryId: 'cat-3',
      expectedAmount: 500,
      frequencyUnit: 'WEEKLY',
      startDate: new Date('2026-01-01'),
    });
  });

  it('should list configs for tenant', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.configs).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter by type', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
    });

    expect(result.configs).toHaveLength(1);
    expect(result.configs[0].type).toBe('PAYABLE');
  });

  it('should filter by status', async () => {
    // Pause one config
    const allConfigs = recurringConfigsRepository.items.filter(
      (c) => c.tenantId.toString() === 'tenant-1',
    );
    allConfigs[0].status = 'PAUSED';

    const result = await sut.execute({
      tenantId: 'tenant-1',
      status: 'ACTIVE',
    });

    expect(result.configs).toHaveLength(1);
  });

  it('should paginate results', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 1,
    });

    expect(result.configs).toHaveLength(1);
    expect(result.total).toBe(2);
  });

  it('should not show configs from other tenants', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });
    const hasOtherTenant = result.configs.some(
      (c) => c.tenantId !== 'tenant-1',
    );
    expect(hasOtherTenant).toBe(false);
  });
});
