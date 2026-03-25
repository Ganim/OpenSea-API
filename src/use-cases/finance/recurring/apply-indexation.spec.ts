import { InMemoryRecurringConfigsRepository } from '@/repositories/finance/in-memory/in-memory-recurring-configs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApplyIndexationUseCase } from './apply-indexation';

let recurringConfigsRepository: InMemoryRecurringConfigsRepository;
let sut: ApplyIndexationUseCase;

describe('ApplyIndexationUseCase', () => {
  beforeEach(() => {
    recurringConfigsRepository = new InMemoryRecurringConfigsRepository();
    sut = new ApplyIndexationUseCase(recurringConfigsRepository);
  });

  it('should apply FIXED_RATE indexation when adjustmentMonth matches', async () => {
    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel com reajuste',
      categoryId: 'cat-1',
      expectedAmount: 1000,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-04-01'),
      indexationType: 'FIXED_RATE',
      fixedAdjustmentRate: 0.05, // 5%
      adjustmentMonth: 3, // March
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      referenceDate: new Date('2026-03-15'),
    });

    expect(result.adjustedCount).toBe(1);
    expect(recurringConfigsRepository.items[0].expectedAmount).toBe(1050);
    expect(
      recurringConfigsRepository.items[0].lastAdjustmentDate,
    ).toBeDefined();
    expect(recurringConfigsRepository.items[0].notes).toContain('Reajuste');
    expect(recurringConfigsRepository.items[0].notes).toContain('1050.00');
  });

  it('should not adjust when adjustmentMonth does not match', async () => {
    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel',
      categoryId: 'cat-1',
      expectedAmount: 1000,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-04-01'),
      indexationType: 'FIXED_RATE',
      fixedAdjustmentRate: 0.05,
      adjustmentMonth: 6, // June, not March
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      referenceDate: new Date('2026-03-15'),
    });

    expect(result.adjustedCount).toBe(0);
    expect(recurringConfigsRepository.items[0].expectedAmount).toBe(1000);
  });

  it('should not adjust if already adjusted this year', async () => {
    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel',
      categoryId: 'cat-1',
      expectedAmount: 1050,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-04-01'),
      indexationType: 'FIXED_RATE',
      fixedAdjustmentRate: 0.05,
      adjustmentMonth: 3,
      lastAdjustmentDate: new Date('2026-03-01'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      referenceDate: new Date('2026-03-15'),
    });

    expect(result.adjustedCount).toBe(0);
    expect(recurringConfigsRepository.items[0].expectedAmount).toBe(1050);
  });

  it('should skip configs with NONE indexation type', async () => {
    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Sem reajuste',
      categoryId: 'cat-1',
      expectedAmount: 1000,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-04-01'),
      indexationType: 'NONE',
      adjustmentMonth: 3,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      referenceDate: new Date('2026-03-15'),
    });

    expect(result.adjustedCount).toBe(0);
  });

  it('should apply IGPM as placeholder using fixedAdjustmentRate', async () => {
    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Contrato IGPM',
      categoryId: 'cat-1',
      expectedAmount: 2000,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-04-01'),
      indexationType: 'IGPM',
      fixedAdjustmentRate: 0.03, // 3%
      adjustmentMonth: 3,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      referenceDate: new Date('2026-03-15'),
    });

    expect(result.adjustedCount).toBe(1);
    expect(recurringConfigsRepository.items[0].expectedAmount).toBe(2060);
  });
});
