import { InMemoryRecurringConfigsRepository } from '@/repositories/finance/in-memory/in-memory-recurring-configs-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('should apply IGPM as placeholder using fixedAdjustmentRate when no provider is injected', async () => {
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

  // Regression: P1-11 — when an IndexRateProvider is injected, IPCA/IGPM
  // configs must use the real-time rate returned by the provider, not the
  // config's fixedAdjustmentRate placeholder.
  it('should call IndexRateProvider for IPCA/IGPM when injected', async () => {
    const indexRateProvider = {
      getIndex: vi.fn().mockResolvedValue(0.0567), // 5.67%
    };
    const sutWithProvider = new ApplyIndexationUseCase(
      recurringConfigsRepository,
      indexRateProvider,
    );

    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel IPCA',
      categoryId: 'cat-1',
      expectedAmount: 1000,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-04-01'),
      indexationType: 'IPCA',
      fixedAdjustmentRate: 0.01, // placeholder must NOT be used
      adjustmentMonth: 3,
    });

    const result = await sutWithProvider.execute({
      tenantId: 'tenant-1',
      referenceDate: new Date('2026-03-15'),
    });

    expect(result.adjustedCount).toBe(1);
    expect(indexRateProvider.getIndex).toHaveBeenCalledWith(
      'IPCA',
      new Date('2026-03-15'),
    );
    // 1000 * 1.0567 = 1056.70 (not 1010 placeholder)
    expect(recurringConfigsRepository.items[0].expectedAmount).toBe(1056.7);
  });

  // Regression: P1-11 — provider failures must throw explicitly so the cron
  // visibly fails, rather than silently falling back to a stale placeholder
  // that would mis-adjust every contract.
  it('should propagate provider errors for IPCA/IGPM instead of using placeholder', async () => {
    const indexRateProvider = {
      getIndex: vi
        .fn()
        .mockRejectedValue(new Error('BCB API unreachable')),
    };
    const sutWithProvider = new ApplyIndexationUseCase(
      recurringConfigsRepository,
      indexRateProvider,
    );

    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel IPCA',
      categoryId: 'cat-1',
      expectedAmount: 1000,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-04-01'),
      indexationType: 'IPCA',
      fixedAdjustmentRate: 0.01,
      adjustmentMonth: 3,
    });

    await expect(
      sutWithProvider.execute({
        tenantId: 'tenant-1',
        referenceDate: new Date('2026-03-15'),
      }),
    ).rejects.toThrowError('BCB API unreachable');

    // Config must NOT have been adjusted
    expect(recurringConfigsRepository.items[0].expectedAmount).toBe(1000);
  });
});
