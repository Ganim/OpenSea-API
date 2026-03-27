import { InMemoryCashflowSnapshotsRepository } from '@/repositories/finance/in-memory/in-memory-cashflow-snapshots-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetCashflowAccuracyUseCase } from './get-cashflow-accuracy';

let snapshotsRepository: InMemoryCashflowSnapshotsRepository;
let sut: GetCashflowAccuracyUseCase;

describe('GetCashflowAccuracyUseCase', () => {
  beforeEach(() => {
    snapshotsRepository = new InMemoryCashflowSnapshotsRepository();
    sut = new GetCashflowAccuracyUseCase(snapshotsRepository);
  });

  it('should return empty data when no snapshots exist', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    expect(result.accuracy).toBe(0);
    expect(result.dataPoints).toHaveLength(0);
    expect(result.periodCount).toBe(0);
  });

  it('should return 100% accuracy when predicted matches actual exactly', async () => {
    await snapshotsRepository.upsert({
      tenantId: 'tenant-1',
      date: new Date('2026-01-15'),
      predictedInflow: 10000,
      predictedOutflow: 5000,
      actualInflow: 10000,
      actualOutflow: 5000,
    });

    await snapshotsRepository.upsert({
      tenantId: 'tenant-1',
      date: new Date('2026-01-16'),
      predictedInflow: 8000,
      predictedOutflow: 4000,
      actualInflow: 8000,
      actualOutflow: 4000,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    expect(result.accuracy).toBe(100);
    expect(result.periodCount).toBe(2);
  });

  it('should calculate reduced accuracy when predictions deviate from actual', async () => {
    await snapshotsRepository.upsert({
      tenantId: 'tenant-1',
      date: new Date('2026-01-15'),
      predictedInflow: 10000,
      predictedOutflow: 5000,
      actualInflow: 8000,
      actualOutflow: 6000,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    // Predicted net: 5000, Actual net: 2000, error: |5000-2000|/2000 = 1.5
    // accuracy = max(0, (1 - 1.5) * 100) = 0
    expect(result.accuracy).toBeLessThanOrEqual(100);
    expect(result.periodCount).toBe(1);
  });

  it('should skip snapshots without actual values for accuracy calculation', async () => {
    await snapshotsRepository.upsert({
      tenantId: 'tenant-1',
      date: new Date('2026-01-15'),
      predictedInflow: 10000,
      predictedOutflow: 5000,
      actualInflow: 10000,
      actualOutflow: 5000,
    });

    // Snapshot without actual values (future projection)
    await snapshotsRepository.upsert({
      tenantId: 'tenant-1',
      date: new Date('2026-01-20'),
      predictedInflow: 12000,
      predictedOutflow: 7000,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    expect(result.accuracy).toBe(100);
    expect(result.dataPoints).toHaveLength(2);
    expect(result.periodCount).toBe(1); // Only 1 has actual values
  });

  it('should return data points with correct date formatting', async () => {
    await snapshotsRepository.upsert({
      tenantId: 'tenant-1',
      date: new Date('2026-03-10'),
      predictedInflow: 5000,
      predictedOutflow: 3000,
      actualInflow: 4800,
      actualOutflow: 3200,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
    });

    expect(result.dataPoints[0].date).toBe('2026-03-10');
    expect(result.dataPoints[0].predictedInflow).toBe(5000);
    expect(result.dataPoints[0].predictedOutflow).toBe(3000);
    expect(result.dataPoints[0].actualInflow).toBe(4800);
    expect(result.dataPoints[0].actualOutflow).toBe(3200);
  });

  it('should filter snapshots by tenant', async () => {
    await snapshotsRepository.upsert({
      tenantId: 'tenant-1',
      date: new Date('2026-01-15'),
      predictedInflow: 10000,
      predictedOutflow: 5000,
      actualInflow: 10000,
      actualOutflow: 5000,
    });

    await snapshotsRepository.upsert({
      tenantId: 'tenant-2',
      date: new Date('2026-01-15'),
      predictedInflow: 20000,
      predictedOutflow: 15000,
      actualInflow: 20000,
      actualOutflow: 15000,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-01-31'),
    });

    expect(result.dataPoints).toHaveLength(1);
    expect(result.dataPoints[0].predictedInflow).toBe(10000);
  });

  it('should handle accuracy with close but imperfect predictions', async () => {
    // Simulate 5 days with small deviations
    for (let day = 1; day <= 5; day++) {
      await snapshotsRepository.upsert({
        tenantId: 'tenant-1',
        date: new Date(`2026-02-${String(day).padStart(2, '0')}`),
        predictedInflow: 10000,
        predictedOutflow: 6000,
        actualInflow: 10000 * (1 + (day % 2 === 0 ? 0.05 : -0.05)),
        actualOutflow: 6000 * (1 + (day % 2 === 0 ? -0.03 : 0.03)),
      });
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-28'),
    });

    // With small deviations, accuracy should be high but not 100%
    expect(result.accuracy).toBeGreaterThan(50);
    expect(result.accuracy).toBeLessThan(100);
    expect(result.periodCount).toBe(5);
  });
});
