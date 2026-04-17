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
      getIndex: vi.fn().mockRejectedValue(new Error('BCB API unreachable')),
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

  // ─── P2-55: Edge cases — IPCA/IGPM provider returns zero or negative ──
  // Deflation (negative IPCA) is rare but possible (BR had it in 2017-2018).
  // Zero IPCA is also possible in a flat month. Neither should raise an
  // amount — the contract term "reajuste" only applies for positive inflation
  // indexes in BR leasing law. The use case's `if (adjustmentRate <= 0)
  // continue;` guard protects against both; these tests lock that behavior.
  it('should skip IPCA adjustment when the provider returns zero', async () => {
    const zeroIndexProvider = {
      getIndex: vi.fn().mockResolvedValue(0),
    };
    const sutWithZeroProvider = new ApplyIndexationUseCase(
      recurringConfigsRepository,
      zeroIndexProvider,
    );

    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel IPCA - zero month',
      categoryId: 'cat-1',
      expectedAmount: 1500,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-04-01'),
      indexationType: 'IPCA',
      adjustmentMonth: 3,
    });

    const result = await sutWithZeroProvider.execute({
      tenantId: 'tenant-1',
      referenceDate: new Date('2026-03-15'),
    });

    expect(result.adjustedCount).toBe(0);
    expect(zeroIndexProvider.getIndex).toHaveBeenCalled();
    expect(recurringConfigsRepository.items[0].expectedAmount).toBe(1500);
    // lastAdjustmentDate must NOT be set — so the next month's run still has
    // a chance to re-evaluate (crucial for contracts that use cumulative
    // 12-month indexes, not single-month snapshots).
    expect(
      recurringConfigsRepository.items[0].lastAdjustmentDate,
    ).toBeUndefined();
  });

  it('should skip IGPM adjustment when the provider returns a negative rate (deflation)', async () => {
    const deflationProvider = {
      getIndex: vi.fn().mockResolvedValue(-0.0025), // -0.25% deflation
    };
    const sutWithDeflationProvider = new ApplyIndexationUseCase(
      recurringConfigsRepository,
      deflationProvider,
    );

    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Contrato IGPM - deflação',
      categoryId: 'cat-1',
      expectedAmount: 3200,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-04-01'),
      indexationType: 'IGPM',
      adjustmentMonth: 3,
    });

    const result = await sutWithDeflationProvider.execute({
      tenantId: 'tenant-1',
      referenceDate: new Date('2026-03-15'),
    });

    expect(result.adjustedCount).toBe(0);
    // Contract amount must be preserved — BR lease law does not allow
    // automatic downward adjustment (tenant would need to renegotiate).
    expect(recurringConfigsRepository.items[0].expectedAmount).toBe(3200);
    expect(
      recurringConfigsRepository.items[0].lastAdjustmentDate,
    ).toBeUndefined();
  });

  it('should skip FIXED_RATE adjustment when fixedAdjustmentRate is zero', async () => {
    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel sem reajuste este ano',
      categoryId: 'cat-1',
      expectedAmount: 1800,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-04-01'),
      indexationType: 'FIXED_RATE',
      fixedAdjustmentRate: 0,
      adjustmentMonth: 3,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      referenceDate: new Date('2026-03-15'),
    });

    expect(result.adjustedCount).toBe(0);
    expect(recurringConfigsRepository.items[0].expectedAmount).toBe(1800);
  });

  it('should skip FIXED_RATE adjustment when fixedAdjustmentRate is negative', async () => {
    await recurringConfigsRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      description: 'Aluguel com taxa negativa (config inválida)',
      categoryId: 'cat-1',
      expectedAmount: 2500,
      frequencyUnit: 'MONTHLY',
      startDate: new Date('2026-01-01'),
      nextDueDate: new Date('2026-04-01'),
      indexationType: 'FIXED_RATE',
      fixedAdjustmentRate: -0.02,
      adjustmentMonth: 3,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      referenceDate: new Date('2026-03-15'),
    });

    expect(result.adjustedCount).toBe(0);
    expect(recurringConfigsRepository.items[0].expectedAmount).toBe(2500);
  });
});
